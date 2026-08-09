using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Orders;

[ApiController]
[Route("api/v1/orders")]
[Authorize] // checkout requires login (docs/decisions.md)
public class OrdersController(OrderService orderService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateOrderResponse>> Create(CreateOrderRequest request) =>
        Ok(await orderService.CreateOrderAsync(CurrentUserId, request));

    [HttpGet]
    public async Task<ActionResult<List<OrderSummaryDto>>> List() =>
        Ok(await orderService.GetOrdersForUserAsync(CurrentUserId));

    // Polled by the frontend after launching the Razorpay checkout widget --
    // status only ever changes via the webhook, never trusted from the
    // client (docs/architecture.md).
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDetailDto>> Get(Guid id) =>
        Ok(await orderService.GetOrderByIdAsync(CurrentUserId, id));

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
