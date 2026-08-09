namespace AlchemyStudio.Api.CustomOrders;

// Stored lifecycle only goes up to Accepted/Declined/Cancelled -- "Expired"
// is deliberately NOT a stored state. It's computed at read/action time from
// QuoteExpiresAt (see CustomOrderService), since this app has no scheduled
// background job infrastructure yet and a lazy check is simpler and just as
// correct for a fixed expiry window.
public enum CustomOrderRequestStatus
{
    Requested,
    Quoted,
    Accepted,
    Declined,
    Cancelled,
}

public class CustomOrderRequest
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }

    // Every field the customer submits is deliberately optional (product
    // decision, not an oversight) -- someone might only have a reference
    // image, or only a description, or just a budget in mind.
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public long? BudgetMinInPaise { get; set; }
    public long? BudgetMaxInPaise { get; set; }
    public string? DesiredScale { get; set; }

    public CustomOrderRequestStatus Status { get; set; } = CustomOrderRequestStatus.Requested;

    public long? QuotedPriceInPaise { get; set; }
    public string? QuoteNote { get; set; }
    public DateTimeOffset? QuotedAt { get; set; }
    public DateTimeOffset? QuoteExpiresAt { get; set; }

    // Set once the customer accepts and a real Order (reusing the M4
    // payment flow as-is) is created for the quoted amount.
    public Guid? OrderId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
