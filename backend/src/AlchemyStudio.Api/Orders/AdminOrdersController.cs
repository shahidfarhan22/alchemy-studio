using AlchemyStudio.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Orders;

// Admin-only. Real server-side authorization via [Authorize(Roles=...)] --
// never just a hidden button on the frontend (MASTER-PROMPT.md admin rules).
// Catalog orders only -- custom-order-derived orders are a separate admin
// view (CustomOrders/AdminCustomOrdersController), see OrderService.
[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = Roles.Admin)]
public class AdminOrdersController(OrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<AdminOrderSummaryDto>>> List() =>
        Ok(await orderService.GetAllOrdersForAdminAsync());

    [HttpGet("{id}")]
    public async Task<ActionResult<AdminOrderDetailDto>> Get(Guid id) =>
        Ok(await orderService.GetOrderForAdminAsync(id));

    [HttpPut("{id}/fulfillment")]
    public async Task<ActionResult<AdminOrderDetailDto>> UpdateFulfillment(Guid id, UpdateFulfillmentRequest request) =>
        Ok(await orderService.UpdateFulfillmentAsync(id, request));

    [HttpPost("{id}/refund")]
    public async Task<ActionResult<AdminOrderDetailDto>> Refund(Guid id) =>
        Ok(await orderService.RefundOrderAsync(id));
}

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = Roles.Admin)]
public class AdminDashboardController(OrderService orderService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardStatsDto>> Get() =>
        Ok(await orderService.GetDashboardStatsAsync());
}
