using System.Globalization;
using System.Text;

namespace AlchemyStudio.Api.Emails;

// Hand-written "bulletproof" HTML email markup -- table-based layout,
// inline styles only, bgcolor attributes alongside CSS background-color
// (many clients, notably Outlook desktop, only honor the HTML attribute).
// Custom webfonts (Bodoni Moda/Public Sans) aren't reliable in email
// clients, so this leans on safe fallback stacks that carry the same
// character: Georgia for the serif display voice, Arial for the sans body.
public static class EmailTemplates
{
    private const string Bg = "#0a0a0b";
    private const string Surface = "#100f10";
    private const string Text = "#f0ede4";
    private const string Muted = "#8b877e";
    private const string Gold = "#c9a227";
    private const string Hairline = "#232022";
    private const string Serif = "Georgia, 'Times New Roman', serif";
    private const string Sans = "Arial, Helvetica, sans-serif";

    public static string OrderConfirmation(IReadOnlyList<(string Name, int Quantity, long LineTotalInPaise)> items, long subtotalInPaise, string currency, Guid orderId, string frontendBaseUrl)
    {
        var rows = new StringBuilder();
        foreach (var item in items)
        {
            rows.Append($"""
                <tr>
                  <td style="padding:10px 0;border-top:1px solid {Hairline};font-family:{Sans};font-size:14px;color:{Text};">{Escape(item.Name)} &times; {item.Quantity}</td>
                  <td style="padding:10px 0;border-top:1px solid {Hairline};font-family:{Sans};font-size:14px;color:{Text};text-align:right;">{FormatMoney(item.LineTotalInPaise, currency)}</td>
                </tr>
                """);
        }

        var body = $"""
            <p style="margin:0 0 24px;font-family:{Sans};font-size:14px;line-height:1.6;color:{Muted};">Thank you for your order — we've received your payment and will begin work shortly.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              {rows}
              <tr>
                <td style="padding:16px 0 0;border-top:1px solid {Gold};font-family:{Serif};font-size:17px;color:{Text};">Total</td>
                <td style="padding:16px 0 0;border-top:1px solid {Gold};font-family:{Serif};font-size:17px;color:{Text};text-align:right;">{FormatMoney(subtotalInPaise, currency)}</td>
              </tr>
            </table>
            """;

        return Wrap("Order confirmed", "Your order is confirmed.", body, $"{frontendBaseUrl}/orders/{orderId}", "View order");
    }

    public static string QuoteReady(string? description, long quotedPriceInPaise, string currency, string? note, DateTimeOffset? expiresAt, Guid requestId, string frontendBaseUrl)
    {
        var body = $"""
            <p style="margin:0 0 24px;font-family:{Sans};font-size:14px;line-height:1.6;color:{Muted};">
              We've reviewed your custom request{(string.IsNullOrWhiteSpace(description) ? "" : $" for &ldquo;{Escape(Truncate(description, 80))}&rdquo;")} and put together a quote.
            </p>
            <p style="margin:0 0 8px;font-family:{Serif};font-size:28px;color:{Text};">{FormatMoney(quotedPriceInPaise, currency)}</p>
            {(string.IsNullOrWhiteSpace(note) ? "" : $"""<p style="margin:0 0 16px;font-family:{Sans};font-size:14px;color:{Muted};">{Escape(note)}</p>""")}
            {(expiresAt is null ? "" : $"""<p style="margin:0;font-family:{Sans};font-size:12px;color:{Muted};">Valid until {expiresAt.Value.ToString("d MMMM yyyy", CultureInfo.InvariantCulture)}.</p>""")}
            """;

        return Wrap("Quote ready", "Your quote is ready.", body, $"{frontendBaseUrl}/custom-orders/{requestId}", "View quote");
    }

    public static string ShippingUpdate(string fulfillmentStatus, string? trackingNumber, string? carrier, Guid orderId, string frontendBaseUrl)
    {
        var statusLine = fulfillmentStatus switch
        {
            "Shipped" => "Your order is on its way.",
            "Delivered" => "Your order has been delivered.",
            _ => "Your order status has been updated.",
        };

        var trackingLine = !string.IsNullOrWhiteSpace(trackingNumber)
            ? $"""<p style="margin:16px 0 0;font-family:{Sans};font-size:14px;color:{Muted};">{Escape(carrier ?? "Tracking")}: {Escape(trackingNumber)}</p>"""
            : "";

        var body = $"""
            <p style="margin:0;font-family:{Sans};font-size:14px;line-height:1.6;color:{Muted};">{statusLine}</p>
            {trackingLine}
            """;

        return Wrap("Shipping update", statusLine, body, $"{frontendBaseUrl}/orders/{orderId}", "View order");
    }

    private static string Wrap(string eyebrow, string heading, string bodyHtml, string ctaUrl, string ctaLabel) => $"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:{Bg};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{Bg}" style="background-color:{Bg};">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" bgcolor="{Surface}" style="background-color:{Surface};max-width:560px;width:100%;">
                  <tr>
                    <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid {Hairline};">
                      <span style="font-family:{Serif};font-size:17px;letter-spacing:3px;text-transform:uppercase;color:{Text};">Alchemy <span style="color:{Gold};">Studio</span></span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 12px;font-family:{Sans};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:{Gold};">{Escape(eyebrow)}</p>
                      <h1 style="margin:0 0 24px;font-family:{Serif};font-size:25px;line-height:1.35;color:{Text};font-weight:normal;">{Escape(heading)}</h1>
                      {bodyHtml}
                      <div style="margin-top:32px;">
                        <a href="{ctaUrl}" style="display:inline-block;border:1px solid {Gold};color:{Gold};text-decoration:none;padding:12px 28px;font-family:{Sans};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">{Escape(ctaLabel)}</a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 40px 32px;border-top:1px solid {Hairline};">
                      <p style="margin:0;font-family:{Sans};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:{Muted};">Alchemy Studio &mdash; limited casts, individually numbered</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;

    // Simple grouped format (₹1,500.00), not the Indian lakh/crore grouping
    // convention -- readable and unambiguous, not worth the extra complexity
    // for a transactional email.
    private static string FormatMoney(long paise, string currency)
    {
        var symbol = currency == "INR" ? "₹" : currency + " ";
        return $"{symbol}{(paise / 100m).ToString("N2", CultureInfo.InvariantCulture)}";
    }

    private static string Truncate(string value, int maxLength) => value.Length <= maxLength ? value : value[..maxLength] + "…";

    private static string Escape(string value) => System.Net.WebUtility.HtmlEncode(value);
}
