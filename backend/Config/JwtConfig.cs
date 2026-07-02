namespace QLQTDT.Api.Config;

public class JwtConfig
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 7;
    public string CookieName { get; set; } = "AccessToken";
    public string RefreshCookieName { get; set; } = "RefreshToken";
}
