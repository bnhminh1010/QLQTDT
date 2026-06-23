namespace QLQTDT.Api.Middleware;

/// <summary>
/// Middleware gắn security headers vào mọi HTTP response.
/// Chống XSS, clickjacking, MIME sniffing, force HTTPS.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Chặn clickjacking — không cho iframe ngoài domain
        headers["X-Frame-Options"] = "DENY";

        // Chặn MIME sniffing — trình duyệt ko tự đoán content-type
        headers["X-Content-Type-Options"] = "nosniff";

        // Force HTTPS — bảo trình duyệt luôn dùng HTTPS trong tương lai
        // max-age=1 năm, includeSubDomains áp dụng cho subdomain
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

        // Chặn referrer leak — ko gửi URL đầy đủ sang domain khác
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Content-Security-Policy — chống XSS cơ bản
        // Cho phép: self, inline style, fonts, images từ data: và self
        // Script: self + unsafe-inline (cần cho Vite dev) + strict-dynamic
        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
            "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
            "img-src 'self' data: blob:; " +
            "connect-src 'self' https://api.thinkai.id.vn; " +
            "frame-ancestors 'none';";

        // X-Permitted-Cross-Domain-Policies — chặn PDF/Flash cross-domain
        headers["X-Permitted-Cross-Domain-Policies"] = "none";

        await _next(context);
    }
}
