using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Extensions;

namespace AlchemyStudio.Api.ErrorHandling;

// Catches anything a controller didn't handle itself and turns it into the
// standard error envelope. Never leaks stack traces, SQL, or internal paths.
public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var correlationId = httpContext.Items.TryGetValue(CorrelationIdMiddleware.ItemsKey, out var id)
            ? id!.ToString()!
            : "unknown";

        logger.LogError(exception, "Unhandled exception for {Method} {Path} (correlationId={CorrelationId})",
            httpContext.Request.Method, httpContext.Request.GetDisplayUrl(), correlationId);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/json";

        var envelope = new ErrorEnvelope(new ErrorBody(
            Code: "INTERNAL_ERROR",
            Message: "Something went wrong on our end. Please try again.",
            Details: null,
            CorrelationId: correlationId
        ));

        await httpContext.Response.WriteAsJsonAsync(envelope, cancellationToken);
        return true;
    }
}
