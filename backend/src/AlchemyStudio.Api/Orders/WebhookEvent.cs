namespace AlchemyStudio.Api.Orders;

// Append-only idempotency log + audit trail (docs/architecture.md:
// "webhooks arrive out of order and more than once... store the raw
// payload and event ID"). Every webhook is recorded here BEFORE any
// processing, keyed uniquely on Razorpay's event ID, so a duplicate
// delivery is detected and skipped rather than double-processed.
public class WebhookEvent
{
    public Guid Id { get; set; }
    public required string RazorpayEventId { get; set; }
    public required string EventType { get; set; }
    public required string RawPayload { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
}
