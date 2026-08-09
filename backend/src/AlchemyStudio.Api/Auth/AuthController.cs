using System.Security.Claims;
using AlchemyStudio.Api.Cart;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace AlchemyStudio.Api.Auth;

[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public class AuthController(AuthService authService, CartService cartService, IWebHostEnvironment env) : ControllerBase
{
    private const string RefreshCookieName = "refreshToken";

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);
        SetRefreshCookie(result.RawRefreshToken);
        await MergeAnonymousCartAsync(result.Response.User.Id);
        return Ok(result.Response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        SetRefreshCookie(result.RawRefreshToken);
        await MergeAnonymousCartAsync(result.Response.User.Id);
        return Ok(result.Response);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh()
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrEmpty(rawToken))
        {
            throw new ApiException("INVALID_REFRESH_TOKEN", "Session expired, please log in again.", 401);
        }

        var result = await authService.RefreshAsync(rawToken);
        SetRefreshCookie(result.RawRefreshToken);
        return Ok(result.Response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var rawToken = Request.Cookies[RefreshCookieName];
        await authService.LogoutAsync(rawToken);
        Response.Cookies.Delete(RefreshCookieName);
        return NoContent();
    }

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        await authService.ChangePasswordAsync(CurrentUserId, request);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public ActionResult<object> Me() => Ok(new
    {
        Id = CurrentUserId,
        Email = User.FindFirstValue(ClaimTypes.Email),
        Roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value),
    });

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new ApiException("UNAUTHORIZED", "Not authenticated.", 401));

    private void SetRefreshCookie(string rawRefreshToken)
    {
        Response.Cookies.Append(RefreshCookieName, rawRefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = !env.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/api/v1/auth",
            Expires = DateTimeOffset.UtcNow.Add(TokenService.RefreshTokenLifetime),
        });
    }

    // If the browser was carrying a guest cart cookie, fold it into the
    // account's cart now that we know who they are (docs/decisions.md:
    // cart persists across login, guest -> account).
    private async Task MergeAnonymousCartAsync(Guid userId)
    {
        var anonymousToken = Request.Cookies[CartController.AnonymousCookieName];
        if (string.IsNullOrEmpty(anonymousToken)) return;

        await cartService.MergeAnonymousCartIntoUserAsync(anonymousToken, userId);
        Response.Cookies.Delete(CartController.AnonymousCookieName);
    }
}
