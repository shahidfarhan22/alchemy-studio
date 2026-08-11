using AlchemyStudio.Api.Data;
using AlchemyStudio.Api.Emails;
using AlchemyStudio.Api.ErrorHandling;
using AlchemyStudio.Api.Orders;
using Microsoft.EntityFrameworkCore;

namespace AlchemyStudio.Api.CustomOrders;

public class CustomOrderService(AppDbContext db, OrderService orderService, EmailService email, IConfiguration configuration)
{
    // Same config key CORS/OrderService already read (Program.cs).
    private string FrontendBaseUrl => configuration["Cors:AllowedOrigin"]!;

    // Fixed expiry window (product decision, see docs/decisions.md) --
    // deliberately NOT enforced by a background sweep (this app has no
    // scheduled-job infrastructure). Instead, "Expired" is computed lazily
    // wherever a quote's status matters: on every read (ToDto/ToAdminDto)
    // and re-checked at the top of Accept/Decline so a stale client can't
    // act on an expired quote just because it was open in a browser tab.
    private static readonly TimeSpan QuoteValidityWindow = TimeSpan.FromDays(14);

    public async Task<CustomOrderRequestDto> CreateAsync(Guid userId, CreateCustomOrderRequest request)
    {
        ValidateBudget(request.BudgetMinInPaise, request.BudgetMaxInPaise);

        var entity = new CustomOrderRequest
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Description = NullIfBlank(request.Description),
            ImageUrl = NullIfBlank(request.ImageUrl),
            BudgetMinInPaise = request.BudgetMinInPaise,
            BudgetMaxInPaise = request.BudgetMaxInPaise,
            DesiredScale = NullIfBlank(request.DesiredScale),
        };

        db.CustomOrderRequests.Add(entity);
        await db.SaveChangesAsync();

        return ToDto(entity);
    }

    public async Task<List<CustomOrderRequestDto>> GetOwnAsync(Guid userId)
    {
        var requests = await db.CustomOrderRequests
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return requests.Select(ToDto).ToList();
    }

    public async Task<CustomOrderRequestDto> GetOwnByIdAsync(Guid userId, Guid id)
    {
        var entity = await FindOwnedAsync(userId, id);
        return ToDto(entity);
    }

    public async Task<List<CustomOrderAdminDto>> GetAllForAdminAsync()
    {
        var requests = await db.CustomOrderRequests.OrderByDescending(r => r.CreatedAt).ToListAsync();
        var userIds = requests.Select(r => r.UserId).Distinct().ToList();
        var users = await db.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);

        return requests.Select(r =>
        {
            var user = users.GetValueOrDefault(r.UserId);
            return ToAdminDto(r, user?.Email ?? "(unknown)", user?.DisplayName ?? "(unknown)");
        }).ToList();
    }

    public async Task<CustomOrderAdminDto> QuoteAsync(Guid id, QuoteCustomOrderRequest request)
    {
        if (request.PriceInPaise <= 0)
        {
            throw new ApiException("VALIDATION_FAILED", "Quoted price must be greater than zero.", 400,
                [new ErrorDetail("priceInPaise", "must_be_positive")]);
        }

        var entity = await db.CustomOrderRequests.FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new ApiException("NOT_FOUND", "Custom order request not found.", 404);

        if (entity.Status != CustomOrderRequestStatus.Requested)
        {
            throw new ApiException("INVALID_STATE", "Only a newly-requested piece can be quoted.", 409);
        }

        entity.QuotedPriceInPaise = request.PriceInPaise;
        entity.QuoteNote = NullIfBlank(request.Note);
        entity.QuotedAt = DateTimeOffset.UtcNow;
        entity.QuoteExpiresAt = entity.QuotedAt.Value.Add(QuoteValidityWindow);
        entity.Status = CustomOrderRequestStatus.Quoted;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        var user = await db.Users.FindAsync(entity.UserId);
        if (user?.Email is not null)
        {
            await email.SendAsync(
                user.Email,
                "Your quote is ready",
                EmailTemplates.QuoteReady(entity.Description, entity.QuotedPriceInPaise!.Value, "INR", entity.QuoteNote, entity.QuoteExpiresAt, entity.Id, FrontendBaseUrl));
        }

        return ToAdminDto(entity, user?.Email ?? "(unknown)", user?.DisplayName ?? "(unknown)");
    }

    public async Task<CreateOrderResponse> AcceptAsync(Guid userId, Guid id, AcceptCustomOrderRequest request)
    {
        var entity = await FindOwnedAsync(userId, id);
        RequireActiveQuote(entity);

        var itemName = string.IsNullOrWhiteSpace(entity.Description)
            ? "Custom miniature"
            : Truncate($"Custom: {entity.Description}", 120);

        var response = await orderService.CreateOrderForCustomQuoteAsync(userId, request.AddressId, itemName, entity.QuotedPriceInPaise!.Value);

        entity.OrderId = response.OrderId;
        entity.Status = CustomOrderRequestStatus.Accepted;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return response;
    }

    public async Task<CustomOrderRequestDto> DeclineAsync(Guid userId, Guid id)
    {
        var entity = await FindOwnedAsync(userId, id);
        RequireActiveQuote(entity);

        entity.Status = CustomOrderRequestStatus.Declined;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return ToDto(entity);
    }

    public async Task<CustomOrderRequestDto> CancelAsync(Guid userId, Guid id)
    {
        var entity = await FindOwnedAsync(userId, id);
        if (entity.Status != CustomOrderRequestStatus.Requested)
        {
            throw new ApiException("INVALID_STATE", "Only a request that hasn't been quoted yet can be cancelled.", 409);
        }

        entity.Status = CustomOrderRequestStatus.Cancelled;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        return ToDto(entity);
    }

    private async Task<CustomOrderRequest> FindOwnedAsync(Guid userId, Guid id) =>
        await db.CustomOrderRequests.FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId)
            ?? throw new ApiException("NOT_FOUND", "Custom order request not found.", 404);

    private static void RequireActiveQuote(CustomOrderRequest entity)
    {
        if (entity.Status != CustomOrderRequestStatus.Quoted)
        {
            throw new ApiException("INVALID_STATE", "This request doesn't have an active quote.", 409);
        }
        if (entity.QuoteExpiresAt is not null && entity.QuoteExpiresAt < DateTimeOffset.UtcNow)
        {
            throw new ApiException("QUOTE_EXPIRED", "This quote has expired. Please submit a new request.", 409);
        }
    }

    private static void ValidateBudget(long? min, long? max)
    {
        var details = new List<ErrorDetail>();
        if (min is < 0) details.Add(new ErrorDetail("budgetMinInPaise", "must_be_non_negative"));
        if (max is < 0) details.Add(new ErrorDetail("budgetMaxInPaise", "must_be_non_negative"));
        if (min is not null && max is not null && min > max) details.Add(new ErrorDetail("budgetMaxInPaise", "must_be_at_least_budget_min"));

        if (details.Count > 0)
        {
            throw new ApiException("VALIDATION_FAILED", "One or more fields are invalid.", 400, details);
        }
    }

    private static string ComputeEffectiveStatus(CustomOrderRequest r) =>
        r.Status == CustomOrderRequestStatus.Quoted && r.QuoteExpiresAt is not null && r.QuoteExpiresAt < DateTimeOffset.UtcNow
            ? "Expired"
            : r.Status.ToString();

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static CustomOrderRequestDto ToDto(CustomOrderRequest r) => new(
        r.Id, ComputeEffectiveStatus(r), r.Description, r.ImageUrl, r.BudgetMinInPaise, r.BudgetMaxInPaise, r.DesiredScale,
        r.QuotedPriceInPaise, r.QuoteNote, r.QuotedAt, r.QuoteExpiresAt, r.OrderId, r.CreatedAt);

    private static CustomOrderAdminDto ToAdminDto(CustomOrderRequest r, string userEmail, string userDisplayName) => new(
        r.Id, r.UserId, userEmail, userDisplayName, ComputeEffectiveStatus(r), r.Description, r.ImageUrl,
        r.BudgetMinInPaise, r.BudgetMaxInPaise, r.DesiredScale,
        r.QuotedPriceInPaise, r.QuoteNote, r.QuotedAt, r.QuoteExpiresAt, r.OrderId, r.CreatedAt);
}
