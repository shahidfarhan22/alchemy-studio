using Razorpay.Api;
using Razorpay.Api.Errors;
using RazorpaySdkOrder = Razorpay.Api.Order; // "Order" collides with our own Orders.Order entity

namespace AlchemyStudio.Api.Orders;

public class RazorpayService
{
    private readonly RazorpayClient _client;
    // Not required for order creation -- only exists once a webhook is
    // configured in the Razorpay dashboard (a later setup step). Checked
    // lazily in VerifyWebhookSignature, not the constructor, so creating
    // orders isn't blocked on a secret that isn't set up yet.
    private readonly string? _webhookSecret;

    public string KeyId { get; }

    public RazorpayService(IConfiguration configuration)
    {
        KeyId = configuration["Razorpay:KeyId"]
            ?? throw new InvalidOperationException("Razorpay:KeyId is not configured. See AGENTS.md.");
        var keySecret = configuration["Razorpay:KeySecret"]
            ?? throw new InvalidOperationException("Razorpay:KeySecret is not configured. See AGENTS.md.");
        _webhookSecret = configuration["Razorpay:WebhookSecret"];

        _client = new RazorpayClient(KeyId, keySecret);
    }

    public string CreateOrder(long amountInPaise, string currency, string receipt)
    {
        var options = new Dictionary<string, object>
        {
            { "amount", amountInPaise },
            { "currency", currency },
            { "receipt", receipt },
        };

        RazorpaySdkOrder order = _client.Order.Create(options);
        return (string)order.Attributes["id"];
    }

    // Client-side checkout confirmation -- fast UX feedback only, never the
    // authoritative state change (docs/architecture.md: webhooks are the
    // source of truth, not the redirect callback).
    public bool VerifyCheckoutSignature(string razorpayOrderId, string razorpayPaymentId, string razorpaySignature)
    {
        var attributes = new Dictionary<string, string>
        {
            { "razorpay_order_id", razorpayOrderId },
            { "razorpay_payment_id", razorpayPaymentId },
            { "razorpay_signature", razorpaySignature },
        };

        try
        {
            Utils.verifyPaymentSignature(attributes);
            return true;
        }
        catch (SignatureVerificationError)
        {
            return false;
        }
    }

    public bool VerifyWebhookSignature(string payload, string signature)
    {
        if (_webhookSecret is null)
        {
            throw new InvalidOperationException("Razorpay:WebhookSecret is not configured. See AGENTS.md.");
        }

        try
        {
            Utils.verifyWebhookSignature(payload, signature, _webhookSecret);
            return true;
        }
        catch (SignatureVerificationError)
        {
            return false;
        }
    }
}
