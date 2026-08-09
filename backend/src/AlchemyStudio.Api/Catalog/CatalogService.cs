using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.Catalog;

public class CatalogService(AppDbContext db)
{
    // --- Public (customer-facing) ---

    public async Task<List<ProductPublicDto>> GetPublishedProductsAsync()
    {
        return await db.Products
            .Include(p => p.Category)
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToPublicDto(p))
            .ToListAsync();
    }

    public async Task<ProductPublicDto> GetPublishedProductBySlugAsync(string slug)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished);

        // Same 404 whether the slug never existed or exists but is unpublished --
        // don't let the response distinguish "doesn't exist" from "not live yet".
        if (product is null)
        {
            throw new ApiException("PRODUCT_NOT_FOUND", "Product not found.", 404);
        }

        return ToPublicDto(product);
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        return await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug))
            .ToListAsync();
    }

    // --- Admin ---

    public async Task<List<ProductAdminDto>> GetAllProductsForAdminAsync()
    {
        return await db.Products
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToAdminDto(p))
            .ToListAsync();
    }

    public async Task<ProductAdminDto> CreateProductAsync(CreateProductRequest request)
    {
        ValidateProductFields(request.Name, request.PriceInPaise, request.StockQuantity);

        var category = await db.Categories.FindAsync(request.CategoryId)
            ?? throw new ApiException("CATEGORY_NOT_FOUND", "Category not found.", 404);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = await GenerateUniqueSlugAsync(request.Name),
            Description = request.Description,
            PriceInPaise = request.PriceInPaise,
            StockQuantity = request.StockQuantity,
            ImageUrl = request.ImageUrl,
            CategoryId = request.CategoryId,
            IsPublished = request.IsPublished,
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        product.Category = category;
        return ToAdminDto(product);
    }

    public async Task<ProductAdminDto> UpdateProductAsync(Guid id, UpdateProductRequest request)
    {
        ValidateProductFields(request.Name, request.PriceInPaise, request.StockQuantity);

        var product = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new ApiException("PRODUCT_NOT_FOUND", "Product not found.", 404);

        if (request.CategoryId != product.CategoryId && !await db.Categories.AnyAsync(c => c.Id == request.CategoryId))
        {
            throw new ApiException("CATEGORY_NOT_FOUND", "Category not found.", 404);
        }

        // Optimistic concurrency (docs/architecture.md): reject a stale write
        // rather than silently overwriting someone else's concurrent edit.
        db.Entry(product).Property(p => p.RowVersion).OriginalValue = request.RowVersion;

        product.Name = request.Name;
        product.Description = request.Description;
        product.PriceInPaise = request.PriceInPaise;
        product.StockQuantity = request.StockQuantity;
        product.ImageUrl = request.ImageUrl;
        product.CategoryId = request.CategoryId;
        product.IsPublished = request.IsPublished;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ApiException(
                "CONCURRENCY_CONFLICT",
                "This product was changed by someone else since you loaded it. Reload and try again.",
                409);
        }

        if (product.CategoryId != product.Category?.Id)
        {
            await db.Entry(product).Reference(p => p.Category).LoadAsync();
        }

        return ToAdminDto(product);
    }

    public async Task DeleteProductAsync(Guid id)
    {
        var product = await db.Products.FindAsync(id)
            ?? throw new ApiException("PRODUCT_NOT_FOUND", "Product not found.", 404);

        // Soft delete, per MASTER-PROMPT.md admin-panel rules.
        product.IsDeleted = true;
        product.IsPublished = false;
        await db.SaveChangesAsync();
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ApiException("VALIDATION_FAILED", "One or more fields are invalid.", 400,
                [new ErrorDetail("name", "required")]);
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = await GenerateUniqueSlugAsync(request.Name, isCategory: true),
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();

        return new CategoryDto(category.Id, category.Name, category.Slug);
    }

    // --- Helpers ---

    private static void ValidateProductFields(string name, long priceInPaise, int stockQuantity)
    {
        var details = new List<ErrorDetail>();
        if (string.IsNullOrWhiteSpace(name)) details.Add(new ErrorDetail("name", "required"));
        if (priceInPaise < 0) details.Add(new ErrorDetail("priceInPaise", "must_be_non_negative"));
        if (stockQuantity < 0) details.Add(new ErrorDetail("stockQuantity", "must_be_non_negative"));

        if (details.Count > 0)
        {
            throw new ApiException("VALIDATION_FAILED", "One or more fields are invalid.", 400, details);
        }
    }

    private async Task<string> GenerateUniqueSlugAsync(string name, bool isCategory = false)
    {
        var baseSlug = SlugGenerator.FromName(name);
        var slug = baseSlug;
        var suffix = 2;

        while (isCategory ? await db.Categories.AnyAsync(c => c.Slug == slug) : await db.Products.AnyAsync(p => p.Slug == slug))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }

    private static ProductPublicDto ToPublicDto(Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.PriceInPaise, p.Currency, p.ImageUrl,
        InStock: p.StockQuantity > 0,
        Category: new CategoryDto(p.Category!.Id, p.Category.Name, p.Category.Slug));

    private static ProductAdminDto ToAdminDto(Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.PriceInPaise, p.Currency, p.ImageUrl,
        p.StockQuantity, p.IsPublished,
        new CategoryDto(p.Category!.Id, p.Category.Name, p.Category.Slug),
        p.CreatedAt, p.UpdatedAt, p.RowVersion);
}
