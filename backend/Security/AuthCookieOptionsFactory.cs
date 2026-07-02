using Microsoft.AspNetCore.Http;
using QLQTDT.Api.Config;

namespace QLQTDT.Api.Security;

public static class AuthCookieOptionsFactory
{
    public const string XsrfCookieName = "XSRF-TOKEN";
    public const string RefreshCookiePath = "/api/auth";

    public static CookieOptions CreateAccessCookieOptions(JwtConfig config, bool isDevelopment) => new()
    {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = GetSameSite(isDevelopment),
        Path = "/",
        MaxAge = TimeSpan.FromMinutes(config.ExpiryMinutes)
    };

    public static CookieOptions CreateRefreshCookieOptions(JwtConfig config, bool isDevelopment) => new()
    {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = GetSameSite(isDevelopment),
        Path = RefreshCookiePath,
        MaxAge = TimeSpan.FromDays(config.RefreshTokenExpiryDays)
    };

    public static CookieOptions CreateXsrfCookieOptions(JwtConfig config, bool isDevelopment) => new()
    {
        HttpOnly = false,
        Secure = !isDevelopment,
        SameSite = GetSameSite(isDevelopment),
        Path = "/",
        MaxAge = TimeSpan.FromMinutes(config.ExpiryMinutes)
    };

    public static CookieOptions CreateDeleteAccessCookieOptions(bool isDevelopment) => new()
    {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = GetSameSite(isDevelopment),
        Path = "/"
    };

    public static CookieOptions CreateDeleteRefreshCookieOptions(bool isDevelopment) => new()
    {
        HttpOnly = true,
        Secure = !isDevelopment,
        SameSite = GetSameSite(isDevelopment),
        Path = RefreshCookiePath
    };

    public static CookieOptions CreateDeleteXsrfCookieOptions(bool isDevelopment) => new()
    {
        HttpOnly = false,
        Secure = !isDevelopment,
        SameSite = GetSameSite(isDevelopment),
        Path = "/"
    };

    public static SameSiteMode GetSameSite(bool isDevelopment) =>
        isDevelopment ? SameSiteMode.Lax : SameSiteMode.None;
}
