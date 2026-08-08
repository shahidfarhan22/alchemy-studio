using Microsoft.AspNetCore.Identity;

namespace AlchemyStudio.Api.Data;

// Runs at startup (Development only -- see Program.cs). Creates the two
// roles and, if no admin exists yet, seeds one from configuration. Never a
// hardcoded password: if Admin:Email/Admin:Password aren't set, seeding is
// skipped and a warning is logged instead of silently using a default.
public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration, ILogger logger)
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        if (userManager.Users.Any(u => u.Email != null))
        {
            return; // an account already exists (admin or otherwise) -- nothing to seed
        }

        var adminEmail = configuration["Admin:Email"];
        var adminPassword = configuration["Admin:Password"];
        if (string.IsNullOrEmpty(adminEmail) || string.IsNullOrEmpty(adminPassword))
        {
            logger.LogWarning(
                "No admin account exists and Admin:Email/Admin:Password are not configured. " +
                "Set them via dotnet user-secrets (see AGENTS.md) to seed the first admin.");
            return;
        }

        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            DisplayName = "Admin",
            MustChangePassword = true,
            EmailConfirmed = true,
        };

        var result = await userManager.CreateAsync(admin, adminPassword);
        if (!result.Succeeded)
        {
            logger.LogError("Failed to seed admin account: {Errors}",
                string.Join("; ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(admin, Roles.Admin);
        logger.LogInformation("Seeded first admin account: {Email}", adminEmail);
    }
}
