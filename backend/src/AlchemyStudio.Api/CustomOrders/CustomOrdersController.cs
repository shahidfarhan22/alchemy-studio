using System.Security.Claims;
using AlchemyStudio.Api.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.CustomOrders;

// Customer-facing. Login required upfront (product decision, see
// docs/decisions.md) -- unlike the cart, a custom request is inherently tied
// to a specific person you'll be quoting back and forth with, so there's no
// real "browse anonymously" case to support here.
[ApiController]
[Route("api/v1/custom-orders")]
[Authorize]
public class CustomOrdersController(CustomOrderService customOrders) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CustomOrderRequestDto>> Create(CreateCustomOrderRequest request) =>
        Ok(await customOrders.CreateAsync(CurrentUserId, request));

    [HttpGet]
    public async Task<ActionResult<List<CustomOrderRequestDto>>> List() =>
        Ok(await customOrders.GetOwnAsync(CurrentUserId));

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomOrderRequestDto>> Get(Guid id) =>
        Ok(await customOrders.GetOwnByIdAsync(CurrentUserId, id));

    // Same response shape as POST /api/v1/orders -- the frontend launches
    // the exact same Razorpay checkout widget code either way.
    [HttpPost("{id}/accept")]
    public async Task<ActionResult<CreateOrderResponse>> Accept(Guid id, AcceptCustomOrderRequest request) =>
        Ok(await customOrders.AcceptAsync(CurrentUserId, id, request));

    [HttpPost("{id}/decline")]
    public async Task<ActionResult<CustomOrderRequestDto>> Decline(Guid id) =>
        Ok(await customOrders.DeclineAsync(CurrentUserId, id));

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<CustomOrderRequestDto>> Cancel(Guid id) =>
        Ok(await customOrders.CancelAsync(CurrentUserId, id));

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
