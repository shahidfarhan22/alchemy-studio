using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Catalog;

// Public, unauthenticated -- customers browsing the store.
[ApiController]
[Route("api/v1/products")]
public class ProductsController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProductPublicDto>>> List() => Ok(await catalog.GetPublishedProductsAsync());

    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductPublicDto>> GetBySlug(string slug) =>
        Ok(await catalog.GetPublishedProductBySlugAsync(slug));
}

[ApiController]
[Route("api/v1/categories")]
public class CategoriesController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> List() => Ok(await catalog.GetCategoriesAsync());
}
