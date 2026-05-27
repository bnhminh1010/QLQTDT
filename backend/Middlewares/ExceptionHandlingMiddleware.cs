using System.Text.Json;
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
            _logger.LogWarning(ex, "Application exception: {Message}", ex.Message);
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

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
