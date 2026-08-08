using AlchemyStudio.Api.Auth;
using AlchemyStudio.Api.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;

namespace AlchemyStudio.Api.Tests.Auth;

// Pure unit tests -- no database, no network. Covers the security-critical
// token logic directly, independent of the integration-test gap tracked in
// docs/progress.md (needs Docker or a dedicated test DB -- see that file).
public class TokenServiceTests
{
    private static TokenService CreateService(string signingKey = "unit-test-signing-key-at-least-32-bytes-long!!")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SigningKey"] = signingKey,
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
            })
            .Build();
        return new TokenService(config);
    }

    private static ApplicationUser CreateUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "unit-test@example.com",
        UserName = "unit-test@example.com",
        DisplayName = "Unit Test User",
    };

    [Fact]
    public void GenerateAccessToken_ProducesTokenThatValidatesWithMatchingKey()
    {
        var service = CreateService();
        var user = CreateUser();

        var (token, _) = service.GenerateAccessToken(user, [Roles.Customer]);

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(token, service.GetValidationParameters(), out _);

        // JwtSecurityTokenHandler remaps short JWT claim names ("sub", "email") to their
        // long-form ClaimTypes equivalents by default -- this is what AuthController.Me()
        // actually reads at runtime (with a "sub" fallback), so the test checks the same.
        Assert.Equal(user.Id.ToString(), principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
        Assert.Equal(user.Email, principal.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value);
        Assert.Contains(principal.Claims, c => c.Type == System.Security.Claims.ClaimTypes.Role && c.Value == Roles.Customer);
    }

    [Fact]
    public void GenerateAccessToken_IncludesAllAssignedRoles()
    {
        var service = CreateService();
        var user = CreateUser();

        var (token, _) = service.GenerateAccessToken(user, [Roles.Customer, Roles.Admin]);

        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(token, service.GetValidationParameters(), out _);
        var roles = principal.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();

        Assert.Contains(Roles.Customer, roles);
        Assert.Contains(Roles.Admin, roles);
    }

    [Fact]
    public void GenerateAccessToken_ExpiresApproximately15MinutesFromNow()
    {
        var service = CreateService();
        var (_, expiresAt) = service.GenerateAccessToken(CreateUser(), [Roles.Customer]);

        var delta = expiresAt - DateTimeOffset.UtcNow;
        Assert.InRange(delta.TotalMinutes, 14.5, 15.5);
    }

    [Fact]
    public void ValidateToken_RejectsTokenSignedWithADifferentKey()
    {
        // Security property: a token forged with a different key must never validate.
        var issuer = CreateService(signingKey: "issuer-signing-key-at-least-32-bytes-long!!!!");
        var attacker = CreateService(signingKey: "attacker-signing-key-at-least-32-bytes-long!!");

        var (forgedToken, _) = attacker.GenerateAccessToken(CreateUser(), [Roles.Customer]);

        var handler = new JwtSecurityTokenHandler();
        Assert.Throws<SecurityTokenSignatureKeyNotFoundException>(
            () => handler.ValidateToken(forgedToken, issuer.GetValidationParameters(), out _));
    }

    [Fact]
    public void ValidateToken_RejectsTokenForWrongAudience()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SigningKey"] = "shared-signing-key-at-least-32-bytes-long!!!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "audience-a",
            })
            .Build();
        var serviceA = new TokenService(config);

        var configB = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SigningKey"] = "shared-signing-key-at-least-32-bytes-long!!!",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "audience-b",
            })
            .Build();
        var serviceB = new TokenService(configB);

        var (token, _) = serviceA.GenerateAccessToken(CreateUser(), [Roles.Customer]);

        var handler = new JwtSecurityTokenHandler();
        Assert.Throws<SecurityTokenInvalidAudienceException>(
            () => handler.ValidateToken(token, serviceB.GetValidationParameters(), out _));
    }

    [Fact]
    public void GenerateRefreshTokenRaw_ProducesUniqueValuesEachCall()
    {
        var a = TokenService.GenerateRefreshTokenRaw();
        var b = TokenService.GenerateRefreshTokenRaw();

        Assert.NotEqual(a, b);
        Assert.True(a.Length > 32, "refresh token should be a long, high-entropy value");
    }

    [Fact]
    public void HashToken_IsDeterministic()
    {
        const string raw = "some-raw-refresh-token-value";
        Assert.Equal(TokenService.HashToken(raw), TokenService.HashToken(raw));
    }

    [Fact]
    public void HashToken_DifferentInputsProduceDifferentHashes()
    {
        Assert.NotEqual(TokenService.HashToken("token-a"), TokenService.HashToken("token-b"));
    }

    [Fact]
    public void HashToken_NeverReturnsTheRawValue()
    {
        // Guards the "store hashed, never raw" rule (AGENTS.md) at the unit level.
        const string raw = "some-raw-refresh-token-value";
        Assert.NotEqual(raw, TokenService.HashToken(raw));
    }
}
