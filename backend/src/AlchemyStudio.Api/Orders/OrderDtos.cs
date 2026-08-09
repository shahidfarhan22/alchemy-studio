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
