namespace AlchemyStudio.Api.Auth;

public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record AuthResponse(string AccessToken, DateTimeOffset ExpiresAt, UserSummary User);
public record UserSummary(Guid Id, string Email, string DisplayName, IReadOnlyList<string> Roles, bool MustChangePassword);
