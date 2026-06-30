using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Common;

namespace QLQTDT.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            if (ex.StatusCode >= StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(ex, "Application exception: {Message}", ex.Message);
            }
            await WriteErrorResponse(context, ex.StatusCode, ex.ErrorType, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            var detail = _env.IsDevelopment() ? ex.ToString() : null;
            await WriteErrorResponse(context, 500, "Internal Server Error",
                "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.", detail);
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, int statusCode, string error, string message, string? detail = null)
    {
        ApplyCorsHeaders(context);
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new ApiErrorResponse
        {
            Timestamp = DateTime.UtcNow,
            Status = statusCode,
            Error = error,
            Message = message,
            Detail = detail
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = JavaScriptEncoder.Create(UnicodeRanges.All)
        };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }

    private static void ApplyCorsHeaders(HttpContext context)
    {
        var origin = context.Request.Headers.Origin.ToString();
        if (string.IsNullOrWhiteSpace(origin))
            return;

        var allowedOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS")?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? ["http://localhost:5173"];

        if (!allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            return;

        context.Response.Headers.AccessControlAllowOrigin = origin;
        context.Response.Headers.AccessControlAllowCredentials = "true";
        context.Response.Headers.Vary = "Origin";
    }
}
