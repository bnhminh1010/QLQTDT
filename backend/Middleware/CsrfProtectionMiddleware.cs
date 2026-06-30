using System.Security.Cryptography;

namespace QLQTDT.Api.Middleware;

/// <summary>
/// Validates CSRF double-submit token on all unsafe HTTP methods.
/// Compares XSRF-TOKEN cookie with X-CSRF-Token header (constant-time).
/// </summary>
public class CsrfProtectionMiddleware
{
    private static readonly HashSet<string> SafeMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "GET", "HEAD", "OPTIONS", "TRACE"
    };

    private readonly RequestDelegate _next;

    public CsrfProtectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var isLogoutRequest = context.Request.Path.Equals("/api/auth/logout", StringComparison.OrdinalIgnoreCase);

        // Only validate authenticated unsafe requests
        if (!isLogoutRequest
            && !SafeMethods.Contains(context.Request.Method)
            && context.User?.Identity?.IsAuthenticated == true)
        {
            var cookieToken = context.Request.Cookies["XSRF-TOKEN"];
            var headerToken = context.Request.Headers["X-CSRF-Token"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(cookieToken) ||
                string.IsNullOrWhiteSpace(headerToken) ||
                !CryptographicOperations.FixedTimeEquals(
                    System.Text.Encoding.UTF8.GetBytes(cookieToken),
                    System.Text.Encoding.UTF8.GetBytes(headerToken)))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    error = new { code = "CSRF_INVALID", message = "CSRF token không hợp lệ." }
                });
                return;
            }
        }

        await _next(context);
    }
}
