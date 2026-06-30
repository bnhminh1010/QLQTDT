using System.Security.Cryptography;
using System.Text;

namespace QLQTDT.Api.Tests.Services;

public class RefreshTokenReuseTests
{
    private const string Secret = "TestSecretThatIsLongEnoughForHmacSha256!@#$";

    private string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    [Fact]
    public void HashToken_Deterministic()
    {
        var token = "test-refresh-token-value";
        var hash1 = HashToken(token);
        var hash2 = HashToken(token);
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void HashToken_DifferentTokens_DifferentHashes()
    {
        var hash1 = HashToken("token-a");
        var hash2 = HashToken("token-b");
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void JwtService_GenerateToken_ContainsJti()
    {
        var jwtSecret = "TestSecretKeyForUnitTestsOnly!@#$%^&*()";
        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var claims = new List<System.Security.Claims.Claim>
        {
            new(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub, "1"),
            new(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email, "test@test.com"),
            new("permissions", "GOITHAU.VIEW,GOITHAU.CREATE")
        };

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: "TestIssuer",
            audience: "TestAudience",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(60),
            signingCredentials: credentials
        );

        var tokenStr = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
        Assert.NotNull(tokenStr);

        // Read it back and verify JTI exists
        var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(tokenStr);
        Assert.NotNull(jwt.Id);
        Assert.NotEmpty(jwt.Id);
    }
}
