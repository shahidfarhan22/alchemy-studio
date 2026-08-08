using System.Text.Json;
using AlchemyStudio.Api.ErrorHandling;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace AlchemyStudio.Api.Tests.ErrorHandling;

// The error envelope is a contract every future feature area depends on
// (AGENTS.md). These tests guard it directly, no database needed.
public class GlobalExceptionHandlerTests
{
    private static (DefaultHttpContext context, MemoryStream body) CreateContext(string? correlationId = "test-correlation-id")
    {
        var context = new DefaultHttpContext();
        var body = new MemoryStream();
        context.Response.Body = body;
        if (correlationId is not null)
        {
            context.Items[CorrelationIdMiddleware.ItemsKey] = correlationId;
        }
        return (context, body);
    }

    private static async Task<JsonDocument> ReadBodyAsJsonAsync(MemoryStream body)
    {
        body.Position = 0;
        using var reader = new StreamReader(body);
        var text = await reader.ReadToEndAsync();
        return JsonDocument.Parse(text);
    }

    [Fact]
    public async Task ApiException_MapsToItsOwnCodeAndStatus()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var (context, body) = CreateContext();
        var exception = new ApiException("SOMETHING_SPECIFIC", "A specific, safe-to-display message.", 409);

        var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);

        Assert.True(handled);
        Assert.Equal(409, context.Response.StatusCode);

        using var json = await ReadBodyAsJsonAsync(body);
        var error = json.RootElement.GetProperty("error");
        Assert.Equal("SOMETHING_SPECIFIC", error.GetProperty("code").GetString());
        Assert.Equal("A specific, safe-to-display message.", error.GetProperty("message").GetString());
        Assert.Equal("test-correlation-id", error.GetProperty("correlationId").GetString());
    }

    [Fact]
    public async Task ApiException_IncludesDetailsWhenProvided()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var (context, body) = CreateContext();
        var exception = new ApiException("VALIDATION_FAILED", "Invalid.", 400,
            [new ErrorDetail("email", "already_registered")]);

        await handler.TryHandleAsync(context, exception, CancellationToken.None);

        using var json = await ReadBodyAsJsonAsync(body);
        var details = json.RootElement.GetProperty("error").GetProperty("details");
        Assert.Equal(1, details.GetArrayLength());
        Assert.Equal("email", details[0].GetProperty("field").GetString());
        Assert.Equal("already_registered", details[0].GetProperty("issue").GetString());
    }

    [Fact]
    public async Task UnhandledException_MapsToGeneric500_AndDoesNotLeakExceptionDetails()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var (context, body) = CreateContext();
        var exception = new InvalidOperationException("Sensitive internal detail: connection string password=hunter2");

        await handler.TryHandleAsync(context, exception, CancellationToken.None);

        Assert.Equal(500, context.Response.StatusCode);

        using var json = await ReadBodyAsJsonAsync(body);
        var error = json.RootElement.GetProperty("error");
        Assert.Equal("INTERNAL_ERROR", error.GetProperty("code").GetString());
        Assert.DoesNotContain("hunter2", error.GetProperty("message").GetString());
        Assert.DoesNotContain("connection string", error.GetProperty("message").GetString());
    }

    [Fact]
    public async Task MissingCorrelationId_FallsBackToUnknown_RatherThanThrowing()
    {
        var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
        var (context, body) = CreateContext(correlationId: null);

        await handler.TryHandleAsync(context, new ApiException("X", "x", 400), CancellationToken.None);

        using var json = await ReadBodyAsJsonAsync(body);
        Assert.Equal("unknown", json.RootElement.GetProperty("error").GetProperty("correlationId").GetString());
    }
}
