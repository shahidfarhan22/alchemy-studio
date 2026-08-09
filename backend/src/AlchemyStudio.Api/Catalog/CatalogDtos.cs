namespace AlchemyStudio.Api.Catalog;

public record CategoryDto(Guid Id, string Name, string Slug);

// Customer-facing: no stock count, no draft/deleted state, no row version.
public record ProductPublicDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    long PriceInPaise,
    string Currency,
    string? ImageUrl,
    bool InStock,
    CategoryDto Category
);

// Admin-facing: everything, including fields needed to manage the product.
public record ProductAdminDto(
    Guid Id,
    string Name,
    string Slug,
    string Description,
    long PriceInPaise,
    string Currency,
    string? ImageUrl,
    int StockQuantity,
    bool IsPublished,
    CategoryDto Category,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    uint RowVersion
);

public record CreateCategoryRequest(string Name);

public record CreateProductRequest(
    string Name,
    string Description,
    long PriceInPaise,
    int StockQuantity,
    string? ImageUrl,
    Guid CategoryId,
    bool IsPublished
);

public record UpdateProductRequest(
    string Name,
    string Description,
    long PriceInPaise,
    int StockQuantity,
    string? ImageUrl,
    Guid CategoryId,
    bool IsPublished,
    uint RowVersion
);
