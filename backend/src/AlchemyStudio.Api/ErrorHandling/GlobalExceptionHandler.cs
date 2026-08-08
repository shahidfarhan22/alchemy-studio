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

        ErrorBody body;
        int statusCode;

        if (exception is ApiException apiException)
        {
            // Expected, typed failure (validation, auth, not-found, ...) --
            // log at a lower level, no stack trace needed to investigate.
            logger.LogInformation("{Code} for {Method} {Path} (correlationId={CorrelationId})",
                apiException.Code, httpContext.Request.Method, httpContext.Request.GetDisplayUrl(), correlationId);

            statusCode = apiException.StatusCode;
            body = new ErrorBody(apiException.Code, apiException.Message, apiException.Details, correlationId);
        }
        else
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path} (correlationId={CorrelationId})",
                httpContext.Request.Method, httpContext.Request.GetDisplayUrl(), correlationId);

            statusCode = StatusCodes.Status500InternalServerError;
            body = new ErrorBody("INTERNAL_ERROR", "Something went wrong on our end. Please try again.", null, correlationId);
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsJsonAsync(new ErrorEnvelope(body), cancellationToken);
        return true;
    }
}
