namespace AlchemyStudio.Api.Data;

// The raw token is never stored -- only its hash. Rotated on every use;
// if a token is reused after rotation, that's a signal of theft and the
// whole chain gets revoked (see AuthService.RefreshAsync).
public class RefreshToken
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public required string TokenHash { get; set; }
    public required DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}
