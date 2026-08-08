using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Auth;

public record AuthResult(AuthResponse Response, string RawRefreshToken, Guid RefreshTokenId);

public class AuthService(
    UserManager<ApplicationUser> userManager,
    AppDbContext db,
    TokenService tokenService,
    ILogger<AuthService> logger)
{
    public async Task<AuthResult> RegisterAsync(RegisterRequest request)
    {
        var existing = await userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            // Known trade-off, not full enumeration-safety: registration does
            // reveal an email is taken. True enumeration-safety here needs an
            // email-confirmation step ("check your inbox" for either case),
            // which isn't possible until email sending exists at M7. Login
            // and refresh below ARE enumeration-safe. See docs/decisions.md.
            throw new ApiException("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            throw ToValidationException(createResult);
        }

        await userManager.AddToRoleAsync(user, Roles.Customer);
        logger.LogInformation("User registered: {UserId}", user.Id);

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);

        // Enumeration-safe: burn roughly the same time whether the account
        // exists or not, and return an identical error either way.
        var passwordOk = user is not null && await userManager.CheckPasswordAsync(user, request.Password);
        if (user is null)
        {
            await userManager.CheckPasswordAsync(DummyUserForTiming, request.Password);
        }

        if (user is null || !passwordOk)
        {
            logger.LogInformation("Failed login attempt for {Email}", request.Email);
            throw new ApiException("INVALID_CREDENTIALS", "Invalid email or password.", 401);
        }

        if (await userManager.IsLockedOutAsync(user))
        {
            throw new ApiException("ACCOUNT_LOCKED", "Too many failed attempts. Try again shortly.", 423);
        }

        logger.LogInformation("User logged in: {UserId}", user.Id);
        return await IssueTokensAsync(user);
    }

    public async Task<AuthResult> RefreshAsync(string rawRefreshToken)
    {
        var tokenHash = TokenService.HashToken(rawRefreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (stored is null)
        {
            throw new ApiException("INVALID_REFRESH_TOKEN", "Session expired, please log in again.", 401);
        }

        if (stored.RevokedAt is not null)
        {
            // A revoked token being presented again means it was already
            // rotated away -- someone is replaying an old token. Treat as
            // theft: revoke every active token for this user.
            logger.LogWarning("Refresh token reuse detected for user {UserId}", stored.UserId);
            var allActive = await db.RefreshTokens
                .Where(t => t.UserId == stored.UserId && t.RevokedAt == null)
                .ToListAsync();
            foreach (var token in allActive) token.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            throw new ApiException("REFRESH_TOKEN_REUSE_DETECTED", "Session expired, please log in again.", 401);
        }

        if (stored.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            throw new ApiException("REFRESH_TOKEN_EXPIRED", "Session expired, please log in again.", 401);
        }

        var user = await userManager.FindByIdAsync(stored.UserId.ToString())
            ?? throw new ApiException("INVALID_REFRESH_TOKEN", "Session expired, please log in again.", 401);

        var result = await IssueTokensAsync(user);

        stored.RevokedAt = DateTimeOffset.UtcNow;
        stored.ReplacedByTokenId = result.RefreshTokenId;
        await db.SaveChangesAsync();

        return result;
    }

    public async Task LogoutAsync(string? rawRefreshToken)
    {
        if (string.IsNullOrEmpty(rawRefreshToken)) return;

        var tokenHash = TokenService.HashToken(rawRefreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == tokenHash);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new ApiException("NOT_FOUND", "User not found.", 404);

        var result = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            throw ToValidationException(result);
        }

        if (user.MustChangePassword)
        {
            user.MustChangePassword = false;
            await userManager.UpdateAsync(user);
        }
    }

    private async Task<AuthResult> IssueTokensAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var (accessToken, expiresAt) = tokenService.GenerateAccessToken(user, roles);

        var rawRefreshToken = TokenService.GenerateRefreshTokenRaw();
        var refreshTokenEntity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = TokenService.HashToken(rawRefreshToken),
            ExpiresAt = DateTimeOffset.UtcNow.Add(TokenService.RefreshTokenLifetime),
        };
        db.RefreshTokens.Add(refreshTokenEntity);
        await db.SaveChangesAsync();

        var response = new AuthResponse(
            accessToken,
            expiresAt,
            new UserSummary(user.Id, user.Email!, user.DisplayName, roles.ToList(), user.MustChangePassword));

        return new AuthResult(response, rawRefreshToken, refreshTokenEntity.Id);
    }

    private static ApiException ToValidationException(IdentityResult result)
    {
        var details = result.Errors.Select(e => new ErrorDetail(
            Field: e.Code.Contains("Password", StringComparison.OrdinalIgnoreCase) ? "password"
                 : e.Code.Contains("Email", StringComparison.OrdinalIgnoreCase) || e.Code.Contains("UserName", StringComparison.OrdinalIgnoreCase) ? "email"
                 : "form",
            Issue: e.Code)).ToList();

        return new ApiException("VALIDATION_FAILED", "One or more fields are invalid.", 400, details);
    }

    // A fixed, never-registered user whose password check we run when the
    // real lookup misses, purely so both code paths take similar time.
    // The hash must be real (Identity's hasher rejects malformed hashes
    // outright rather than just failing the comparison), so it's generated
    // via the same hasher Identity itself uses, not hand-written.
    private static readonly ApplicationUser DummyUserForTiming = CreateDummyUser();

    private static ApplicationUser CreateDummyUser()
    {
        var dummy = new ApplicationUser { UserName = "timing-dummy@invalid", Email = "timing-dummy@invalid" };
        dummy.PasswordHash = new PasswordHasher<ApplicationUser>().HashPassword(dummy, Guid.NewGuid().ToString());
        return dummy;
    }
}
