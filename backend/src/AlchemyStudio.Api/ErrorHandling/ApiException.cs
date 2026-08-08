namespace AlchemyStudio.Api.ErrorHandling;

// Throw this (or a subclass) from any service to produce a specific error
// envelope instead of the generic 500. Caught once by GlobalExceptionHandler
// -- controllers don't need their own try/catch per AGENTS.md.
public class ApiException(string code, string message, int statusCode, IReadOnlyList<ErrorDetail>? details = null)
    : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
    public IReadOnlyList<ErrorDetail>? Details { get; } = details;
}
