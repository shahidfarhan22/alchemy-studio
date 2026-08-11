using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace AlchemyStudio.Api.Emails;

// Wraps Resend's REST API directly (POST https://api.resend.com/emails) --
// no SDK needed, the request shape is a single flat JSON object, verified
// against Resend's own docs before writing this (docs/decisions.md), same
// discipline as the Razorpay integrations.
public class EmailService(HttpClient http, IConfiguration configuration, ILogger<EmailService> logger)
{
    // Optional at construction, same fix as RazorpayService's webhook secret
    // (ADR-012): the domain/DNS/Resend-account setup is a real human action
    // that takes time, and every order-related endpoint depends on this
    // service being constructible in the meantime -- requiring these eagerly
    // would break order creation entirely for a feature that hasn't been
    // configured yet, not just email sending. Checked lazily in SendAsync.
    private readonly string? _apiKey = configuration["Resend:ApiKey"];
    private readonly string? _fromAddress = configuration["Resend:FromAddress"];

    // Best-effort, never blocking. A failed (or unconfigured) email must
    // never break the real state transition it's attached to (an order
    // marked Paid, a quote sent, a shipment marked Shipped) -- same rule as
    // "a non-critical convenience feature must never break the critical
    // path" from ADR-014's login fix. Every caller in
    // OrderService/CustomOrderService fires this after its own
    // SaveChangesAsync, never before, and never wraps it in a try/catch that
    // would roll back the real operation.
    public async Task SendAsync(string to, string subject, string html)
    {
        if (_apiKey is null || _fromAddress is null)
        {
            logger.LogInformation("Resend:ApiKey/FromAddress not configured yet -- skipping email to {To}: {Subject}", to, subject);
            return;
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "emails");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(new { from = _fromAddress, to = new[] { to }, subject, html });

            var response = await http.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                logger.LogWarning("Resend email to {To} ({Subject}) failed with {Status}: {Body}", to, subject, response.StatusCode, body);
                return;
            }

            logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send email to {To}: {Subject}", to, subject);
        }
    }
}
