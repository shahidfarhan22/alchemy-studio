using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Cart;

// Deliberately NOT [Authorize] -- guests can browse and build a cart
// (docs/decisions.md: login required only at checkout, not before).
[ApiController]
[Route("api/v1/cart")]
public class CartController(CartService cartService) : ControllerBase
{
    public const string AnonymousCookieName = "cartToken";

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var result = await cartService.GetOrCreateCartAsync(CurrentUserId, AnonymousToken);
        ApplyNewTokenCookie(result.NewAnonymousToken);
        return Ok(result.Cart);
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(AddCartItemRequest request)
    {
        var result = await cartService.AddItemAsync(CurrentUserId, AnonymousToken, request);
        ApplyNewTokenCookie(result.NewAnonymousToken);
        return Ok(result.Cart);
    }

    [HttpPut("items/{productId}")]
    public async Task<ActionResult<CartDto>> UpdateItem(Guid productId, UpdateCartItemRequest request)
    {
        var result = await cartService.UpdateItemQuantityAsync(CurrentUserId, AnonymousToken, productId, request);
        return Ok(result.Cart);
    }

    [HttpDelete("items/{productId}")]
    public async Task<ActionResult<CartDto>> RemoveItem(Guid productId) =>
        Ok(await cartService.RemoveItemAsync(CurrentUserId, AnonymousToken, productId));

    private Guid? CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return idClaim is not null ? Guid.Parse(idClaim) : null;
        }
    }

    private string? AnonymousToken => CurrentUserId is null ? Request.Cookies[AnonymousCookieName] : null;

    private void ApplyNewTokenCookie(string? newToken)
    {
        if (newToken is null) return;

        Response.Cookies.Append(AnonymousCookieName, newToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = !HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/", // needs to reach /api/v1/auth too, for the merge-on-login step
            Expires = DateTimeOffset.UtcNow.AddDays(30),
        });
    }
}
