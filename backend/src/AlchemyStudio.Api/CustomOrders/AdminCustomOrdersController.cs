using AlchemyStudio.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.CustomOrders;

// Admin-only. Real server-side authorization via [Authorize(Roles=...)] --
// never just a hidden button on the frontend (MASTER-PROMPT.md admin rules).
[ApiController]
[Route("api/v1/admin/custom-orders")]
[Authorize(Roles = Roles.Admin)]
public class AdminCustomOrdersController(CustomOrderService customOrders) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CustomOrderAdminDto>>> List() =>
        Ok(await customOrders.GetAllForAdminAsync());

    [HttpPost("{id}/quote")]
    public async Task<ActionResult<CustomOrderAdminDto>> Quote(Guid id, QuoteCustomOrderRequest request) =>
        Ok(await customOrders.QuoteAsync(id, request));
}
