namespace AlchemyStudio.Api.Orders;

// State machine per docs/architecture.md: created -> authorized -> captured
// -> settled, plus failed / refunded / partially_refunded. "Settled" and
// "disputed" aren't distinguished from Captured yet -- no admin UI needs
// that distinction until M6; the raw webhook history is preserved either
// way via WebhookEvent for whenever it's needed.
public enum PaymentStatus
{
    Created,
    Authorized,
    Captured,
    Failed,
    Refunded,
    PartiallyRefunded,
}

public class Payment
{
    public Guid Id { get; set; }
    public required Guid OrderId { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Created;
    public required long AmountInPaise { get; set; }
    public string Currency { get; set; } = "INR";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
