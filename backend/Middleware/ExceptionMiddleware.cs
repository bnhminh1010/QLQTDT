using System.Net;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;
using QLQTDT.Api.Exceptions;

namespace QLQTDT.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            await WriteErrorAsync(context, "NOT_FOUND", ex.Message);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await WriteErrorAsync(context, "VALIDATION_ERROR", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            await WriteErrorAsync(context, "FORBIDDEN", ex.Message);
        }
        catch (AppException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            await WriteErrorAsync(context, ex.ErrorType, ex.Message);
        }
        catch (Exception ex) when (ex is not QLQTDT.Api.Exceptions.AppException)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await WriteErrorAsync(context, "INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống");
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, string code, string message)
    {
        ApplyCorsHeaders(context);
        context.Response.ContentType = "application/json";
        var response = new
        {
            success = false,
            error = new { code, message }
        };
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Encoder = JavaScriptEncoder.Create(UnicodeRanges.All)
        });
        await context.Response.WriteAsync(json);
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

public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class ValidationException : Exception
{
    public ValidationException(string message) : base(message) { }
}
