using System.Text.Json;
using AlchemyStudio.Api.Addresses;
using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.Emails;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Orders;

public class OrderService(AppDbContext db, RazorpayService razorpay, EmailService email, IConfiguration configuration, ILogger<OrderService> logger)
{
    // Reuses the same config key CORS already reads (Program.cs) rather than
    // inventing a second "where is the frontend" setting.
    private string FrontendBaseUrl => configuration["Cors:AllowedOrigin"]!;

    public async Task<CreateOrderResponse> CreateOrderAsync(Guid userId, CreateOrderRequest request)
    {
        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
        if (cart is null || cart.Items.Count == 0)
        {
            throw new ApiException("CART_EMPTY", "Your cart is empty.", 400);
        }

        var address = await GetOwnedAddressAsync(userId, request.AddressId);

        var productIds = cart.Items.Select(i => i.ProductId).ToList();
        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        var orderItems = new List<OrderItem>();
        foreach (var cartItem in cart.Items)
        {
            if (!products.TryGetValue(cartItem.ProductId, out var product) || !product.IsPublished)
            {
                throw new ApiException("CART_HAS_UNAVAILABLE_ITEMS",
                    "Your cart has an item that's no longer available. Please review your cart.", 409);
            }
            if (product.StockQuantity < cartItem.Quantity)
            {
                throw new ApiException("CART_HAS_UNAVAILABLE_ITEMS",
                    $"'{product.Name}' only has {product.StockQuantity} left in stock. Please update your cart.", 409);
            }

            orderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                ProductId = product.Id,
                ProductName = product.Name,
                PriceInPaise = product.PriceInPaise,
                Quantity = cartItem.Quantity,
                LineTotalInPaise = product.PriceInPaise * cartItem.Quantity,
            });
        }

        var subtotal = orderItems.Sum(i => i.LineTotalInPaise);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubtotalInPaise = subtotal,
            ShippingAddress = ToShippingAddress(address),
            Items = orderItems,
        };

        return await PersistOrderAndCreateRazorpayOrderAsync(order);
    }

    // Custom-order acceptance (CustomOrders/CustomOrderService): a single
    // snapshotted line item for the quoted price, reusing the exact same
    // Order/Payment/webhook machinery as a catalog checkout -- the only
    // difference is there's no cart and no real Product behind the item
    // (OrderItem.ProductId is left null; see OrderItem.cs and the
    // stock-decrement guard in HandlePaymentCapturedAsync below).
    public async Task<CreateOrderResponse> CreateOrderForCustomQuoteAsync(Guid userId, Guid addressId, string itemName, long priceInPaise)
    {
        var address = await GetOwnedAddressAsync(userId, addressId);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubtotalInPaise = priceInPaise,
            ShippingAddress = ToShippingAddress(address),
            Items = [
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = null,
                    ProductName = itemName,
                    PriceInPaise = priceInPaise,
                    Quantity = 1,
                    LineTotalInPaise = priceInPaise,
                },
            ],
        };

        return await PersistOrderAndCreateRazorpayOrderAsync(order);
    }

    private async Task<Address> GetOwnedAddressAsync(Guid userId, Guid addressId) =>
        await db.Addresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId)
            ?? throw new ApiException("ADDRESS_NOT_FOUND", "Address not found.", 404);

    private static OrderShippingAddress ToShippingAddress(Address address) => new()
    {
        FullName = address.FullName,
        Line1 = address.Line1,
        Line2 = address.Line2,
        City = address.City,
        State = address.State,
        PostalCode = address.PostalCode,
        Country = address.Country,
        Phone = address.Phone,
    };

    private async Task<CreateOrderResponse> PersistOrderAndCreateRazorpayOrderAsync(Order order)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        // Razorpay order created only after our own order is durably saved --
        // if this call fails, the customer just sees an error and can retry;
        // no half-committed state either way (order exists but with no
        // RazorpayOrderId, harmless and never shown as payable without one).
        var razorpayOrderId = razorpay.CreateOrder(order.SubtotalInPaise, order.Currency, order.Id.ToString());
        order.RazorpayOrderId = razorpayOrderId;
        await db.SaveChangesAsync();

        return new CreateOrderResponse(order.Id, razorpayOrderId, order.SubtotalInPaise, order.Currency, razorpay.KeyId);
    }

    public async Task<List<OrderSummaryDto>> GetOrdersForUserAsync(Guid userId) =>
        await db.Orders.Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto(o.Id, o.Status, o.SubtotalInPaise, o.Currency, o.CreatedAt))
            .ToListAsync();

    public async Task<OrderDetailDto> GetOrderByIdAsync(Guid userId, Guid orderId)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId)
            ?? throw new ApiException("ORDER_NOT_FOUND", "Order not found.", 404);

        return new OrderDetailDto(
            order.Id, order.Status, order.SubtotalInPaise, order.Currency,
            order.Items.Select(i => new OrderItemDto(i.ProductName, i.PriceInPaise, i.Quantity, i.LineTotalInPaise)).ToList(),
            order.CreatedAt);
    }

    // Webhooks arrive out of order and more than once (docs/architecture.md)
    // -- every event is logged before processing, keyed uniquely on
    // Razorpay's event ID, so a duplicate delivery is a safe no-op.
    //
    // eventId comes from the X-Razorpay-Event-Id HEADER, not the JSON body --
    // verified directly against Razorpay's docs, not assumed. Their payload
    // has no top-level event identifier field at all (an earlier version of
    // this method incorrectly looked for one in the body, which would have
    // made every real webhook fail with INVALID_WEBHOOK_PAYLOAD).
    public async Task ProcessWebhookAsync(string rawPayload, string signature, string eventId)
    {
        if (!razorpay.VerifyWebhookSignature(rawPayload, signature))
        {
            throw new ApiException("INVALID_WEBHOOK_SIGNATURE", "Signature verification failed.", 400);
        }

        if (string.IsNullOrEmpty(eventId))
        {
            throw new ApiException("INVALID_WEBHOOK_PAYLOAD", "Missing X-Razorpay-Event-Id header.", 400);
        }

        using var doc = JsonDocument.Parse(rawPayload);
        var root = doc.RootElement;
        var eventType = root.TryGetProperty("event", out var evEl) ? evEl.GetString() : null;

        if (string.IsNullOrEmpty(eventType))
        {
            throw new ApiException("INVALID_WEBHOOK_PAYLOAD", "Missing event type.", 400);
        }

        if (await db.WebhookEvents.AnyAsync(e => e.RazorpayEventId == eventId))
        {
            logger.LogInformation("Webhook event {EventId} already processed, skipping.", eventId);
            return;
        }

        db.WebhookEvents.Add(new WebhookEvent { Id = Guid.NewGuid(), RazorpayEventId = eventId, EventType = eventType, RawPayload = rawPayload });
        await db.SaveChangesAsync();

        var paymentEntity = root.GetProperty("payload").GetProperty("payment").GetProperty("entity");
        var razorpayOrderId = paymentEntity.GetProperty("order_id").GetString();
        var razorpayPaymentId = paymentEntity.GetProperty("id").GetString();
        var amount = paymentEntity.GetProperty("amount").GetInt64();

        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.RazorpayOrderId == razorpayOrderId);
        if (order is null)
        {
            logger.LogWarning("Webhook {EventId} references unknown Razorpay order {RazorpayOrderId}.", eventId, razorpayOrderId);
            return;
        }

        switch (eventType)
        {
            case "payment.captured":
                await HandlePaymentCapturedAsync(order, razorpayPaymentId!, amount);
                break;
            case "payment.failed":
                await UpsertPaymentAsync(order.Id, razorpayPaymentId, amount, PaymentStatus.Failed);
                order.Status = OrderStatus.PaymentFailed;
                order.UpdatedAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync();
                break;
            case "refund.processed":
                await HandleRefundProcessedAsync(order, root);
                break;
            case "refund.failed":
                await HandleRefundFailedAsync(order.Id);
                break;
            default:
                logger.LogInformation("Webhook event {EventType} received, no handler needed yet.", eventType);
                break;
        }
    }

    private async Task HandlePaymentCapturedAsync(Order order, string razorpayPaymentId, long amount)
    {
        if (order.Status == OrderStatus.Paid)
        {
            return; // already processed (e.g. a retried webhook delivery for a different event id)
        }

        await UpsertPaymentAsync(order.Id, razorpayPaymentId, amount, PaymentStatus.Captured);

        order.Status = OrderStatus.Paid;
        order.FulfillmentStatus = FulfillmentStatus.Processing; // nothing to fulfill before payment (M6)
        order.UpdatedAt = DateTimeOffset.UtcNow;

        // Conditional update, not read-then-write (docs/architecture.md
        // Concurrency) -- decremented only now, at confirmed payment, not at
        // order creation, so an abandoned/failed checkout never holds stock
        // hostage. Accepted tradeoff: a narrow window where two customers
        // could both have their payment captured for the last unit; logged
        // if it ever under-runs rather than silently going negative.
        foreach (var item in order.Items)
        {
            // Custom-order items (CustomOrders/CustomOrderService) have no
            // real catalog Product behind them -- nothing to decrement.
            if (item.ProductId is null) continue;

            var affected = await db.Products
                .Where(p => p.Id == item.ProductId && p.StockQuantity >= item.Quantity)
                .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.StockQuantity, p => p.StockQuantity - item.Quantity));

            if (affected == 0)
            {
                logger.LogWarning(
                    "Stock for product {ProductId} could not be decremented by {Quantity} for paid order {OrderId} -- already out of stock. Needs manual reconciliation.",
                    item.ProductId, item.Quantity, order.Id);
            }
        }

        var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == order.UserId);
        if (cart is not null)
        {
            db.CartItems.RemoveRange(cart.Items);
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Order {OrderId} marked Paid, stock decremented, cart cleared.", order.Id);

        var buyer = await db.Users.FindAsync(order.UserId);
        if (buyer?.Email is not null)
        {
            var itemsForEmail = order.Items.Select(i => (i.ProductName, i.Quantity, i.LineTotalInPaise)).ToList();
            await email.SendAsync(
                buyer.Email,
                "Your order is confirmed",
                EmailTemplates.OrderConfirmation(itemsForEmail, order.SubtotalInPaise, order.Currency, order.Id, FrontendBaseUrl));
        }
    }

    // Admin-triggered refunds (M6) are initiated via RefundOrderAsync below,
    // but -- same "webhooks are the source of truth" rule as payment capture
    // -- the order/payment only actually flip to Refunded once this webhook
    // confirms it, never from the synchronous Razorpay API response.
    private async Task HandleRefundProcessedAsync(Order order, JsonElement root)
    {
        if (order.Status == OrderStatus.Refunded)
        {
            return; // already processed (e.g. a retried webhook delivery for a different event id)
        }

        var refundedAmount = root.GetProperty("payload").GetProperty("refund").GetProperty("entity").GetProperty("amount").GetInt64();

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);
        if (payment is null)
        {
            logger.LogWarning("refund.processed webhook for order {OrderId} but no Payment record exists.", order.Id);
            return;
        }

        payment.Status = refundedAmount >= payment.AmountInPaise ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded;
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        order.Status = OrderStatus.Refunded;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();
        logger.LogInformation("Order {OrderId} marked Refunded ({Amount} paise).", order.Id, refundedAmount);
    }

    private async Task HandleRefundFailedAsync(Guid orderId)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        if (payment is not null && payment.RazorpayRefundId is not null)
        {
            // Clear it so the admin can retry -- this attempt didn't go through.
            payment.RazorpayRefundId = null;
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
        logger.LogWarning("Refund failed for order {OrderId} -- needs manual follow-up.", orderId);
    }

    // --- Admin (M6: order management) ---

    public async Task<List<AdminOrderSummaryDto>> GetAllOrdersForAdminAsync()
    {
        // Catalog orders only -- custom-order-derived orders (every item's
        // ProductId is null, see CreateOrderForCustomQuoteAsync) are managed
        // from the separate custom-orders admin view instead (product
        // decision, docs/decisions.md), not merged into this list.
        var orders = await db.Orders.Include(o => o.Items)
            .Where(o => o.Items.All(i => i.ProductId != null))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var users = await UsersByIdAsync(orders.Select(o => o.UserId));

        return orders.Select(o => new AdminOrderSummaryDto(
            o.Id, o.UserId, users.GetValueOrDefault(o.UserId)?.Email ?? "(unknown)", o.Status,
            o.FulfillmentStatus, o.SubtotalInPaise, o.Currency, o.CreatedAt)).ToList();
    }

    public async Task<AdminOrderDetailDto> GetOrderForAdminAsync(Guid orderId)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new ApiException("ORDER_NOT_FOUND", "Order not found.", 404);

        var user = await db.Users.FindAsync(order.UserId);
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);

        return ToAdminDetailDto(order, user?.Email ?? "(unknown)", payment);
    }

    public async Task<AdminOrderDetailDto> UpdateFulfillmentAsync(Guid orderId, UpdateFulfillmentRequest request)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new ApiException("ORDER_NOT_FOUND", "Order not found.", 404);

        if (order.Status != OrderStatus.Paid)
        {
            throw new ApiException("INVALID_STATE", "Only a paid order can be fulfilled.", 409);
        }

        // Orders paid before this field existed have FulfillmentStatus ==
        // null even though they're genuinely Paid -- treat that as an
        // implicit "Processing" baseline rather than misreading it as
        // "never paid" (caught via real pre-existing order data, not
        // guessed: every order paid before this migration has this shape).
        var currentFulfillment = order.FulfillmentStatus ?? FulfillmentStatus.Processing;
        if (request.Status < currentFulfillment)
        {
            throw new ApiException("INVALID_STATE", "Fulfillment status can't move backward.", 409);
        }

        order.FulfillmentStatus = request.Status;
        if (!string.IsNullOrWhiteSpace(request.TrackingNumber)) order.TrackingNumber = request.TrackingNumber.Trim();
        if (!string.IsNullOrWhiteSpace(request.Carrier)) order.Carrier = request.Carrier.Trim();
        order.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        // Processing is the automatic starting point, not something worth a
        // "shipping update" email -- only Shipped/Delivered are real news.
        if (request.Status is FulfillmentStatus.Shipped or FulfillmentStatus.Delivered)
        {
            var buyer = await db.Users.FindAsync(order.UserId);
            if (buyer?.Email is not null)
            {
                await email.SendAsync(
                    buyer.Email,
                    request.Status == FulfillmentStatus.Shipped ? "Your order has shipped" : "Your order has been delivered",
                    EmailTemplates.ShippingUpdate(request.Status.ToString(), order.TrackingNumber, order.Carrier, order.Id, FrontendBaseUrl));
            }
        }

        return await GetOrderForAdminAsync(orderId);
    }

    public async Task<AdminOrderDetailDto> RefundOrderAsync(Guid orderId)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId)
            ?? throw new ApiException("ORDER_NOT_FOUND", "Order not found.", 404);

        if (order.Status != OrderStatus.Paid)
        {
            throw new ApiException("INVALID_STATE", "Only a paid order can be refunded.", 409);
        }

        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        if (payment?.RazorpayPaymentId is null)
        {
            throw new ApiException("INVALID_STATE", "No captured payment found for this order.", 409);
        }
        if (payment.RazorpayRefundId is not null)
        {
            throw new ApiException("REFUND_ALREADY_INITIATED", "A refund has already been initiated for this order.", 409);
        }

        // receiptKey = order.Id -- Razorpay's own idempotency key for refunds
        // on the same payment, so a duplicate/retried admin request can't
        // double-refund even if this guard is somehow raced.
        var (refundId, _) = razorpay.CreateRefund(payment.RazorpayPaymentId, order.SubtotalInPaise, order.Id.ToString());

        payment.RazorpayRefundId = refundId;
        payment.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        logger.LogInformation("Refund {RefundId} initiated for order {OrderId} -- awaiting webhook confirmation.", refundId, order.Id);

        return await GetOrderForAdminAsync(orderId);
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var orders = await db.Orders
            .Select(o => new { o.Status, o.FulfillmentStatus, o.SubtotalInPaise, o.CreatedAt })
            .ToListAsync();

        var paidOrders = orders.Where(o => o.Status == OrderStatus.Paid).ToList();
        var totalRevenue = paidOrders.Sum(o => o.SubtotalInPaise);
        var totalPaidOrders = paidOrders.Count;
        var averageOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;
        // Same null-as-Processing reading as UpdateFulfillmentAsync's backward-
        // transition guard: a Paid order with no FulfillmentStatus yet (paid
        // before this feature existed) still genuinely hasn't been marked
        // Shipped/Delivered, so it belongs in this count too -- found via
        // real pre-existing order data during verification, not assumed.
        var awaitingFulfillment = paidOrders.Count(o => (o.FulfillmentStatus ?? FulfillmentStatus.Processing) == FulfillmentStatus.Processing);

        var today = DateOnly.FromDateTime(DateTimeOffset.UtcNow.UtcDateTime.Date);
        var since = today.AddDays(-29);
        var revenueByDayMap = paidOrders
            .Where(o => DateOnly.FromDateTime(o.CreatedAt.UtcDateTime.Date) >= since)
            .GroupBy(o => DateOnly.FromDateTime(o.CreatedAt.UtcDateTime.Date))
            .ToDictionary(g => g.Key, g => g.Sum(o => o.SubtotalInPaise));

        var revenueByDay = new List<DailyRevenueDto>();
        for (var d = since; d <= today; d = d.AddDays(1))
        {
            revenueByDay.Add(new DailyRevenueDto(d, revenueByDayMap.GetValueOrDefault(d, 0)));
        }

        var statusBreakdown = orders
            .GroupBy(o => o.Status)
            .Select(g => new StatusCountDto(g.Key.ToString(), g.Count()))
            .ToList();

        return new DashboardStatsDto(totalRevenue, totalPaidOrders, averageOrderValue, awaitingFulfillment, revenueByDay, statusBreakdown);
    }

    private async Task<Dictionary<Guid, ApplicationUser>> UsersByIdAsync(IEnumerable<Guid> userIds)
    {
        var ids = userIds.Distinct().ToList();
        return await db.Users.Where(u => ids.Contains(u.Id)).ToDictionaryAsync(u => u.Id);
    }

    private static AdminOrderDetailDto ToAdminDetailDto(Order order, string userEmail, Payment? payment) => new(
        order.Id, order.UserId, userEmail, order.Status, order.FulfillmentStatus, order.TrackingNumber, order.Carrier,
        order.SubtotalInPaise, order.Currency,
        order.Items.Select(i => new OrderItemDto(i.ProductName, i.PriceInPaise, i.Quantity, i.LineTotalInPaise)).ToList(),
        new OrderShippingAddressDto(
            order.ShippingAddress.FullName, order.ShippingAddress.Line1, order.ShippingAddress.Line2,
            order.ShippingAddress.City, order.ShippingAddress.State, order.ShippingAddress.PostalCode,
            order.ShippingAddress.Country, order.ShippingAddress.Phone),
        order.RazorpayOrderId, payment?.RazorpayPaymentId, payment?.RazorpayRefundId, order.CreatedAt, order.UpdatedAt);

    private async Task UpsertPaymentAsync(Guid orderId, string? razorpayPaymentId, long amount, PaymentStatus status)
    {
        var payment = await db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        if (payment is null)
        {
            payment = new Payment { Id = Guid.NewGuid(), OrderId = orderId, AmountInPaise = amount };
            db.Payments.Add(payment);
        }

        payment.RazorpayPaymentId = razorpayPaymentId;
        payment.Status = status;
        payment.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();
    }
}
