namespace AlchemyStudio.Api.Cart;

public record CartItemDto(
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string? ImageUrl,
    long PriceInPaise,
    string Currency,
    int Quantity,
    long LineTotalInPaise,
    bool InStock,
    // False if the product was soft-deleted or unpublished after being
    // added to this cart -- shown as "no longer available" rather than
    // silently disappearing (see docs/decisions.md).
    bool IsAvailable
);

public record CartDto(Guid CartId, List<CartItemDto> Items, long SubtotalInPaise, string Currency);

public record AddCartItemRequest(Guid ProductId, int Quantity);
public record UpdateCartItemRequest(int Quantity);
