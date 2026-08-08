using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AlchemyStudio.Api.Data;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace AlchemyStudio.Api.Auth;

public class TokenService(IConfiguration configuration)
{
    private readonly string _signingKey = configuration["Jwt:SigningKey"]
        ?? throw new InvalidOperationException("Jwt:SigningKey is not configured. See AGENTS.md.");
    private readonly string _issuer = configuration["Jwt:Issuer"] ?? "alchemy-studio-api";
    private readonly string _audience = configuration["Jwt:Audience"] ?? "alchemy-studio-frontend";

    // Short-lived by design (AGENTS.md: access tokens <=15 min) -- the refresh
    // token, not this one, is what stays valid for a long time.
    private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);
    public static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(30);

    public (string Token, DateTimeOffset ExpiresAt) GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var expiresAt = DateTimeOffset.UtcNow.Add(AccessTokenLifetime);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    // Refresh tokens are opaque random values, not JWTs -- only their hash is
    // ever persisted (AGENTS.md: "store hashed"). The raw value only ever
    // exists in the httpOnly cookie sent to the browser.
    public static string GenerateRefreshTokenRaw()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public static string HashToken(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }

    public TokenValidationParameters GetValidationParameters() => new()
    {
        ValidateIssuer = true,
        ValidIssuer = _issuer,
        ValidateAudience = true,
        ValidAudience = _audience,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_signingKey)),
        ClockSkew = TimeSpan.FromSeconds(30),
    };
}
