using AlchemyStudio.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Catalog;

// Admin-only. Real server-side authorization via [Authorize(Roles=...)] --
// never just a hidden button on the frontend (MASTER-PROMPT.md admin rules).
[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminCatalogController(CatalogService catalog) : ControllerBase
{
    [HttpGet("products")]
    public async Task<ActionResult<List<ProductAdminDto>>> ListProducts() =>
        Ok(await catalog.GetAllProductsForAdminAsync());

    [HttpPost("products")]
    public async Task<ActionResult<ProductAdminDto>> CreateProduct(CreateProductRequest request) =>
        Ok(await catalog.CreateProductAsync(request));

    [HttpPut("products/{id}")]
    public async Task<ActionResult<ProductAdminDto>> UpdateProduct(Guid id, UpdateProductRequest request) =>
        Ok(await catalog.UpdateProductAsync(id, request));

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        await catalog.DeleteProductAsync(id);
        return NoContent();
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryRequest request) =>
        Ok(await catalog.CreateCategoryAsync(request));
}
