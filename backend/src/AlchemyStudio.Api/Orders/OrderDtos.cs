namespace AlchemyStudio.Api.Orders;

public record CreateOrderRequest(Guid AddressId);

// Everything the frontend needs to launch Razorpay's checkout widget.
// RazorpayKeyId is the public key -- safe to expose, unlike the secret.
public record CreateOrderResponse(
    Guid OrderId,
    string RazorpayOrderId,
    long AmountInPaise,
    string Currency,
    string RazorpayKeyId
);

public record OrderItemDto(string ProductName, long PriceInPaise, int Quantity, long LineTotalInPaise);

public record OrderSummaryDto(Guid Id, OrderStatus Status, long SubtotalInPaise, string Currency, DateTimeOffset CreatedAt);

public record OrderDetailDto(
    Guid Id,
    OrderStatus Status,
    long SubtotalInPaise,
    string Currency,
    List<OrderItemDto> Items,
    DateTimeOffset CreatedAt
);

// --- Admin (M6: order management) ---

public record OrderShippingAddressDto(
    string FullName, string Line1, string? Line2, string City, string State, string PostalCode, string Country, string Phone
);

public record AdminOrderSummaryDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    OrderStatus Status,
    FulfillmentStatus? FulfillmentStatus,
    long SubtotalInPaise,
    string Currency,
    DateTimeOffset CreatedAt
);

public record AdminOrderDetailDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    OrderStatus Status,
    FulfillmentStatus? FulfillmentStatus,
    string? TrackingNumber,
    string? Carrier,
    long SubtotalInPaise,
    string Currency,
    List<OrderItemDto> Items,
    OrderShippingAddressDto ShippingAddress,
    string? RazorpayOrderId,
    string? RazorpayPaymentId,
    string? RazorpayRefundId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt
);

public record UpdateFulfillmentRequest(FulfillmentStatus Status, string? TrackingNumber, string? Carrier);

public record DashboardStatsDto(
    long TotalRevenueInPaise,
    int TotalPaidOrders,
    long AverageOrderValueInPaise,
    int OrdersAwaitingFulfillment,
    List<DailyRevenueDto> RevenueByDay,
    List<StatusCountDto> StatusBreakdown
);

public record DailyRevenueDto(DateOnly Date, long RevenueInPaise);

public record StatusCountDto(string Status, int Count);
