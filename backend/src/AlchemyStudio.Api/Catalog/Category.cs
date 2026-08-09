namespace AlchemyStudio.Api.Catalog;

public class Category
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<Product> Products { get; set; } = [];
}
