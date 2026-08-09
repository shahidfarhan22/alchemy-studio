namespace AlchemyStudio.Api.CustomOrders;

public record CreateCustomOrderRequest(
    string? Description,
    string? ImageUrl,
    long? BudgetMinInPaise,
    long? BudgetMaxInPaise,
    string? DesiredScale
);

// Status is a string, not the CustomOrderRequestStatus enum -- it can carry
// the computed "Expired" value, which is never actually persisted (see
// CustomOrderRequestStatus).
public record CustomOrderRequestDto(
    Guid Id,
    string Status,
    string? Description,
    string? ImageUrl,
    long? BudgetMinInPaise,
    long? BudgetMaxInPaise,
    string? DesiredScale,
    long? QuotedPriceInPaise,
    string? QuoteNote,
    DateTimeOffset? QuotedAt,
    DateTimeOffset? QuoteExpiresAt,
    Guid? OrderId,
    DateTimeOffset CreatedAt
);

// Same shape plus who it's from, for the admin queue.
public record CustomOrderAdminDto(
    Guid Id,
    Guid UserId,
    string UserEmail,
    string UserDisplayName,
    string Status,
    string? Description,
    string? ImageUrl,
    long? BudgetMinInPaise,
    long? BudgetMaxInPaise,
    string? DesiredScale,
    long? QuotedPriceInPaise,
    string? QuoteNote,
    DateTimeOffset? QuotedAt,
    DateTimeOffset? QuoteExpiresAt,
    Guid? OrderId,
    DateTimeOffset CreatedAt
);

public record QuoteCustomOrderRequest(long PriceInPaise, string? Note);

public record AcceptCustomOrderRequest(Guid AddressId);
