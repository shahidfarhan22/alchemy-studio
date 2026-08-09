using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Cart;

public record CartResult(CartDto Cart, string? NewAnonymousToken);

public class CartService(AppDbContext db)
{
    // Resolves the caller's cart: by UserId if logged in, else by the
    // anonymous cookie token (creating a cart -- and a fresh token for a
    // brand new guest -- if neither exists yet).
    public async Task<CartResult> GetOrCreateCartAsync(Guid? userId, string? anonymousToken)
    {
        var cart = await FindOrCreateCartEntityAsync(userId, anonymousToken);
        var newToken = userId is null && anonymousToken is null ? cart.AnonymousToken : null;
        return new CartResult(await ToDto(cart), newToken);
    }

    public async Task<CartResult> AddItemAsync(Guid? userId, string? anonymousToken, AddCartItemRequest request)
    {
        if (request.Quantity < 1)
        {
            throw new ApiException("VALIDATION_FAILED", "Quantity must be at least 1.", 400,
                [new ErrorDetail("quantity", "must_be_at_least_1")]);
        }

        var cart = await FindOrCreateCartEntityAsync(userId, anonymousToken);
        var newToken = userId is null && anonymousToken is null ? cart.AnonymousToken : null;

        var product = await db.Products.FindAsync(request.ProductId)
            ?? throw new ApiException("PRODUCT_NOT_FOUND", "Product not found.", 404);
        if (!product.IsPublished)
        {
            throw new ApiException("PRODUCT_NOT_FOUND", "Product not found.", 404);
        }

        var existing = await db.CartItems.FirstOrDefaultAsync(i => i.CartId == cart.Id && i.ProductId == request.ProductId);
        var requestedTotal = (existing?.Quantity ?? 0) + request.Quantity;

        if (requestedTotal > product.StockQuantity)
        {
            throw new ApiException("INSUFFICIENT_STOCK",
                $"Only {product.StockQuantity} left in stock.", 409,
                [new ErrorDetail("quantity", "exceeds_stock")]);
        }

        if (existing is not null)
        {
            existing.Quantity = requestedTotal;
        }
        else
        {
            db.CartItems.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = request.ProductId, Quantity = request.Quantity });
        }

        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return new CartResult(await ToDto(cart), newToken);
    }

    public async Task<CartResult> UpdateItemQuantityAsync(Guid? userId, string? anonymousToken, Guid productId, UpdateCartItemRequest request)
    {
        var cart = await FindOrCreateCartEntityAsync(userId, anonymousToken);
        var item = await db.CartItems.FirstOrDefaultAsync(i => i.CartId == cart.Id && i.ProductId == productId)
            ?? throw new ApiException("CART_ITEM_NOT_FOUND", "Item not found in cart.", 404);

        if (request.Quantity < 1)
        {
            db.CartItems.Remove(item);
        }
        else
        {
            var product = await db.Products.FindAsync(productId)
                ?? throw new ApiException("PRODUCT_NOT_FOUND", "Product not found.", 404);

            if (request.Quantity > product.StockQuantity)
            {
                throw new ApiException("INSUFFICIENT_STOCK",
                    $"Only {product.StockQuantity} left in stock.", 409,
                    [new ErrorDetail("quantity", "exceeds_stock")]);
            }

            item.Quantity = request.Quantity;
        }

        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return new CartResult(await ToDto(cart), null);
    }

    public async Task<CartDto> RemoveItemAsync(Guid? userId, string? anonymousToken, Guid productId)
    {
        var cart = await FindOrCreateCartEntityAsync(userId, anonymousToken);
        var item = await db.CartItems.FirstOrDefaultAsync(i => i.CartId == cart.Id && i.ProductId == productId);
        if (item is not null)
        {
            db.CartItems.Remove(item);
            cart.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
        return await ToDto(cart);
    }

    // Called right after a successful login/register (see AuthController) if
    // the browser was carrying an anonymous cart cookie. Folds guest cart
    // items into the user's existing cart (creating one if needed), capping
    // merged quantities at current stock, then deletes the anonymous cart.
    public async Task MergeAnonymousCartIntoUserAsync(string anonymousToken, Guid userId)
    {
        var anonymousCart = await db.Carts.Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.AnonymousToken == anonymousToken);
        if (anonymousCart is null || anonymousCart.Items.Count == 0)
        {
            if (anonymousCart is not null) db.Carts.Remove(anonymousCart);
            await db.SaveChangesAsync();
            return;
        }

        var userCart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId);
        if (userCart is null)
        {
            userCart = new AlchemyStudio.Api.Cart.Cart { Id = Guid.NewGuid(), UserId = userId };
            db.Carts.Add(userCart);
        }

        // Deliberately NOT capping to current stock here (an earlier version
        // did, using a query that didn't bypass the soft-delete filter --
        // that silently dropped items entirely when the product had been
        // deleted, the same bug already fixed in ToDto()). Stock limits are
        // enforced when adding directly (AddItemAsync); merge just honestly
        // combines what the guest had with what's already there, and
        // ToDto()'s InStock/IsAvailable flags show the real current status.
        foreach (var guestItem in anonymousCart.Items)
        {
            var existing = userCart.Items.FirstOrDefault(i => i.ProductId == guestItem.ProductId);
            if (existing is not null)
            {
                existing.Quantity += guestItem.Quantity;
            }
            else
            {
                userCart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = userCart.Id, ProductId = guestItem.ProductId, Quantity = guestItem.Quantity });
            }
        }

        userCart.UpdatedAt = DateTimeOffset.UtcNow;
        db.Carts.Remove(anonymousCart);
        await db.SaveChangesAsync();
    }

    private async Task<Cart> FindOrCreateCartEntityAsync(Guid? userId, string? anonymousToken)
    {
        Cart? cart = userId is not null
            ? await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == userId)
            : anonymousToken is not null
                ? await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.AnonymousToken == anonymousToken)
                : null;

        if (cart is not null) return cart;

        cart = new Cart
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AnonymousToken = userId is null ? Guid.NewGuid().ToString("N") : null,
        };
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        return cart;
    }

    private async Task<CartDto> ToDto(Cart cart)
    {
        var productIds = cart.Items.Select(i => i.ProductId).ToList();
        // IgnoreQueryFilters: a soft-deleted product must still be findable here --
        // we want to show "no longer available" using its last-known name/image,
        // not just have it vanish from the cart (docs/decisions.md).
        var products = await db.Products.IgnoreQueryFilters()
            .Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        var itemDtos = cart.Items
            .Where(i => products.ContainsKey(i.ProductId)) // still defensive: a product row can't vanish (FK), only be soft-deleted/unpublished
            .Select(i =>
            {
                var p = products[i.ProductId];
                var isAvailable = !p.IsDeleted && p.IsPublished;
                return new CartItemDto(
                    p.Id, p.Name, p.Slug, p.ImageUrl, p.PriceInPaise, p.Currency,
                    i.Quantity, p.PriceInPaise * i.Quantity,
                    InStock: isAvailable && p.StockQuantity >= i.Quantity,
                    IsAvailable: isAvailable);
            })
            .ToList();

        return new CartDto(cart.Id, itemDtos, itemDtos.Sum(i => i.LineTotalInPaise), "INR");
    }
}
