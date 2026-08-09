using AlchemyStudio.Api.Addresses;
using AlchemyStudio.Api.Catalog;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CartEntity = AlchemyStudio.Api.Cart.Cart;
using CartItemEntity = AlchemyStudio.Api.Cart.CartItem;

namespace AlchemyStudio.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<CartEntity> Carts => Set<CartEntity>();
    public DbSet<CartItemEntity> CartItems => Set<CartItemEntity>();
    public DbSet<Address> Addresses => Set<Address>();

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

        builder.Entity<CartEntity>(entity =>
        {
            entity.HasIndex(c => c.UserId).IsUnique();
            entity.HasIndex(c => c.AnonymousToken).IsUnique();

            entity.HasMany(c => c.Items)
                .WithOne()
                .HasForeignKey(i => i.CartId)
                .OnDelete(DeleteBehavior.Cascade); // deleting a cart deletes its items
        });

        builder.Entity<CartItemEntity>(entity =>
        {
            entity.HasIndex(i => new { i.CartId, i.ProductId }).IsUnique();

            entity.HasOne(i => i.Product)
                .WithMany()
                .HasForeignKey(i => i.ProductId)
                .IsRequired(false) // decouples from Product's soft-delete query filter (EF Core warning) -- ProductId column itself stays NOT NULL, this is metadata-only
                .OnDelete(DeleteBehavior.Cascade); // product deleted -> its cart entries go too (soft-delete usually intervenes first)
        });

        builder.Entity<Address>(entity =>
        {
            entity.HasIndex(a => a.UserId);
        });
    }
}
