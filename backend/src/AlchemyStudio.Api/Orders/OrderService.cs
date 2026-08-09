using System.Text.Json;
using AlchemyStudio.Api.Addresses;
using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Orders;

public class OrderService(AppDbContext db, RazorpayService razorpay, ILogger<OrderService> logger)
{
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
    }

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
