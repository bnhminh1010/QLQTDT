using QLQTDT.Api.Security;

namespace QLQTDT.Api.Tests.Security;

public class TokenHasherTests
{
    [Fact]
    public void Hash_IsDeterministic()
    {
        var first = TokenHasher.Hash("token-value");
        var second = TokenHasher.Hash("token-value");

        Assert.Equal(first, second);
    }

    [Fact]
    public void Hash_DoesNotReturnPlaintext()
    {
        var hash = TokenHasher.Hash("token-value");

        Assert.NotEqual("token-value", hash);
    }

    [Fact]
    public void Hash_ReturnsSha256Hex()
    {
        var hash = TokenHasher.Hash("token-value");

        Assert.Equal(64, hash.Length);
        Assert.Matches("^[0-9a-f]{64}$", hash);
    }
}
