namespace AlchemyStudio.Api.Cart;

public class Cart
{
    public Guid Id { get; set; }

    // Exactly one of these is set: UserId for a logged-in customer's cart,
    // AnonymousToken for a guest's cart (tracked via a cookie, see
    // CartController). Merged into the user's cart on login/register --
    // AnonymousToken is cleared once that happens.
    public Guid? UserId { get; set; }
    public string? AnonymousToken { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<CartItem> Items { get; set; } = [];
}
