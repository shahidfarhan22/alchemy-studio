using System.Text.RegularExpressions;

namespace AlchemyStudio.Api.Catalog;

public static partial class SlugGenerator
{
    public static string FromName(string name)
    {
        var normalized = name.Trim().ToLowerInvariant();
        var withDashes = NonAlphanumeric().Replace(normalized, "-");
        return withDashes.Trim('-');
    }

    [GeneratedRegex(@"[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();
}
