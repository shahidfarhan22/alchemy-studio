namespace AlchemyStudio.Api.ErrorHandling;

// Shape defined in docs/api.md and AGENTS.md. Never change without updating both.
public record ErrorEnvelope(ErrorBody Error);

public record ErrorBody(
    string Code,
    string Message,
    IReadOnlyList<ErrorDetail>? Details,
    string CorrelationId
);

public record ErrorDetail(string Field, string Issue);
