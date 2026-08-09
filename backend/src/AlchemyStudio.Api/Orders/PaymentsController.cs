using Microsoft.AspNetCore.Mvc;

namespace AlchemyStudio.Api.Orders;

// Called by Razorpay's servers directly, never by our own frontend -- no
// [Authorize] (there's no user session), authenticity comes entirely from
// the signature check inside OrderService.ProcessWebhookAsync.
[ApiController]
[Route("api/v1/payments")]
public class PaymentsController(OrderService orderService) : ControllerBase
{
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, leaveOpen: true);
        var rawPayload = await reader.ReadToEndAsync();

        var signature = Request.Headers["X-Razorpay-Signature"].ToString();
        // The event ID lives in a header, not the JSON body -- Razorpay's
        // payload has no top-level event identifier (verified against their
        // docs, not assumed). This header is what makes idempotency work.
        var eventId = Request.Headers["X-Razorpay-Event-Id"].ToString();

        await orderService.ProcessWebhookAsync(rawPayload, signature, eventId);
        return Ok();
    }
}
