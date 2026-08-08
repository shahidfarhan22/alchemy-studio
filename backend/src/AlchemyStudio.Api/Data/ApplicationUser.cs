using Microsoft.AspNetCore.Identity;

namespace AlchemyStudio.Api.Data;

public class ApplicationUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;

    // Forces a password change on next login. Used for the seeded first
    // admin account so no default admin password is ever left in place.
    public bool MustChangePassword { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
