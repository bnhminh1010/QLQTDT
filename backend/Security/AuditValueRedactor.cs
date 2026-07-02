namespace QLQTDT.Api.Security;

public static class AuditValueRedactor
{
    private const string Redacted = "[REDACTED]";

    public static object? Redact(string propertyName, object? value) =>
        IsSensitive(propertyName) ? Redacted : value;

    public static bool IsSensitive(string propertyName)
    {
        if (string.IsNullOrWhiteSpace(propertyName))
            return false;

        return propertyName.Equals("Token", StringComparison.OrdinalIgnoreCase)
            || propertyName.EndsWith("Token", StringComparison.OrdinalIgnoreCase)
            || propertyName.Contains("RefreshToken", StringComparison.OrdinalIgnoreCase)
            || propertyName.Contains("MatKhau", StringComparison.OrdinalIgnoreCase)
            || propertyName.Contains("Password", StringComparison.OrdinalIgnoreCase)
            || propertyName.Contains("Secret", StringComparison.OrdinalIgnoreCase)
            || propertyName.Contains("ApiKey", StringComparison.OrdinalIgnoreCase);
    }
}
