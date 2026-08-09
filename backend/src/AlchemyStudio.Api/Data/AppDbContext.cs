using AlchemyStudio.Api.Catalog;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(t => t.TokenHash).IsUnique();
            entity.HasIndex(t => t.UserId);
        });

        builder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Slug).IsUnique();
        });

        builder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => p.IsPublished);

            // Optimistic concurrency via Postgres's built-in xmin system column --
            // no extra column needed, EF Core checks it automatically on update
            // (docs/architecture.md "Concurrency").
            entity.Property(p => p.RowVersion)
                .IsRowVersion()
                .HasColumnName("xmin")
                .HasColumnType("xid");

            entity.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict); // don't allow deleting a category that still has products

            // Soft delete (MASTER-PROMPT.md admin-panel rules): every query
            // automatically excludes deleted products unless explicitly asked.
            entity.HasQueryFilter(p => !p.IsDeleted);
        });
    }
}
