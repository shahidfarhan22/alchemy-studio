using AlchemyStudio.Api.Catalog;

namespace AlchemyStudio.Api.Tests.Catalog;

public class SlugGeneratorTests
{
    [Theory]
    [InlineData("Test Dragon Miniature", "test-dragon-miniature")]
    [InlineData("  Leading and trailing spaces  ", "leading-and-trailing-spaces")]
    [InlineData("Multiple   Spaces", "multiple-spaces")]
    [InlineData("Special!@#Characters$%^", "special-characters")]
    [InlineData("UPPERCASE Name", "uppercase-name")]
    [InlineData("Already-Has-Dashes", "already-has-dashes")]
    [InlineData("Numbers123AreFine456", "numbers123arefine456")]
    public void FromName_ProducesExpectedSlug(string input, string expected)
    {
        Assert.Equal(expected, SlugGenerator.FromName(input));
    }

    [Fact]
    public void FromName_NeverProducesLeadingOrTrailingDashes()
    {
        var slug = SlugGenerator.FromName("!!!Wrapped In Punctuation!!!");
        Assert.False(slug.StartsWith('-'));
        Assert.False(slug.EndsWith('-'));
    }
}
