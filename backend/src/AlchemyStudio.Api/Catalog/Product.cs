namespace AlchemyStudio.Api.Catalog;

public class Product
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string Description { get; set; } = string.Empty;

    // Money handling per docs/architecture.md: integer minor units, never
    // floating point. Currency stored explicitly even though only INR is
    // supported today.
    public required long PriceInPaise { get; set; }
    public string Currency { get; set; } = "INR";

    public int StockQuantity { get; set; }
    public string? ImageUrl { get; set; } // MVP simplification -- see ADR-010, real upload deferred pending object storage account

    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }

    public bool IsPublished { get; set; }
    public bool IsDeleted { get; set; } // soft delete, per MASTER-PROMPT.md admin-panel rules

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Postgres system column, used for optimistic concurrency (docs/architecture.md
    // "Concurrency" section) -- no extra column needed, EF Core reads/checks it
    // automatically on update via the OnModelCreating configuration.
    public uint RowVersion { get; set; }
}
