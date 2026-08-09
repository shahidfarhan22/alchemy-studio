namespace AlchemyStudio.Api.Addresses;

// Addresses always belong to a logged-in user -- checkout requires login
// (docs/decisions.md), so there's no anonymous-address concept to mirror
// the anonymous-cart one.
public class Address
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }

    public required string FullName { get; set; }
    public required string Line1 { get; set; }
    public string? Line2 { get; set; }
    public required string City { get; set; }
    public required string State { get; set; }
    public required string PostalCode { get; set; }
    public string Country { get; set; } = "IN"; // India-only per docs/requirements.md
    public required string Phone { get; set; }
    public bool IsDefault { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
