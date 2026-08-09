namespace AlchemyStudio.Api.Orders;

public enum OrderStatus
{
    PendingPayment,
    Paid,
    PaymentFailed,
    Cancelled,
    Refunded,
}

// Independent of OrderStatus -- payment and fulfillment are different
// concerns (M6, docs/decisions.md). Null until the order is actually Paid;
// there's nothing to fulfill before that.
public enum FulfillmentStatus
{
    Processing,
    Shipped,
    Delivered,
}

public class Order
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;

    public required long SubtotalInPaise { get; set; }
    public string Currency { get; set; } = "INR";

    // Snapshot, not a live FK -- the address as it was at order time, even
    // if the customer later edits/deletes their saved Address (EF owned type,
    // stored as columns on the Orders table, not a separate table).
    public required OrderShippingAddress ShippingAddress { get; set; }

    // Set once we create the corresponding order on Razorpay's side.
    public string? RazorpayOrderId { get; set; }

    public FulfillmentStatus? FulfillmentStatus { get; set; }
    public string? TrackingNumber { get; set; }
    public string? Carrier { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<OrderItem> Items { get; set; } = [];
}

// EF owned type -- see AppDbContext OnModelCreating.
public class OrderShippingAddress
{
    public required string FullName { get; set; }
    public required string Line1 { get; set; }
    public string? Line2 { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string PostalCode { get; set; }
    public required string Country { get; set; }
    public required string Phone { get; set; }
}
