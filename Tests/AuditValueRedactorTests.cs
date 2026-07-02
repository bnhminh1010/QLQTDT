using QLQTDT.Api.Security;

namespace QLQTDT.Api.Tests.Security;

public class AuditValueRedactorTests
{
    [Theory]
    [InlineData("MatKhauHash")]
    [InlineData("Token")]
    [InlineData("RefreshTokenHash")]
    [InlineData("ApiKey")]
    [InlineData("ClientSecret")]
    public void Redact_SensitiveField_ReturnsRedactedMarker(string fieldName)
    {
        var value = AuditValueRedactor.Redact(fieldName, "secret-value");

        Assert.Equal("[REDACTED]", value);
    }

    [Theory]
    [InlineData("HoTen")]
    [InlineData("Email")]
    [InlineData("TokenFamilyId")]
    [InlineData("ReplacedTokenId")]
    public void Redact_NonSensitiveField_ReturnsOriginalValue(string fieldName)
    {
        var value = AuditValueRedactor.Redact(fieldName, "public-value");

        Assert.Equal("public-value", value);
    }
}
