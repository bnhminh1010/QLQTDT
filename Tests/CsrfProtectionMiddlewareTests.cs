using Microsoft.AspNetCore.Http;
using QLQTDT.Api.Middleware;

namespace QLQTDT.Api.Tests.Middleware;

public class CsrfProtectionMiddlewareTests
{
    private static DefaultHttpContext CreateContext(string method, string? cookieToken, string? headerToken, bool authenticated)
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Method = method;

        if (cookieToken != null)
            ctx.Request.Headers.Cookie = $"XSRF-TOKEN={cookieToken}";

        if (headerToken != null)
            ctx.Request.Headers["X-CSRF-Token"] = headerToken;

        if (authenticated)
        {
            var identity = new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim(
                    System.Security.Claims.ClaimTypes.NameIdentifier, "1")
            }, "test");
            ctx.User = new System.Security.Claims.ClaimsPrincipal(identity);
        }

        return ctx;
    }

    [Fact]
    public async Task GetRequest_SkipsValidation()
    {
        var ctx = CreateContext("GET", null, null, true);
        var middleware = new CsrfProtectionMiddleware(c => Task.CompletedTask);
        await middleware.InvokeAsync(ctx);
        Assert.NotEqual(403, ctx.Response.StatusCode);
    }

    [Fact]
    public async Task PostRequest_MatchingTokens_Passes()
    {
        var ctx = CreateContext("POST", "abc123", "abc123", true);
        var middleware = new CsrfProtectionMiddleware(c => Task.CompletedTask);
        await middleware.InvokeAsync(ctx);
        Assert.NotEqual(403, ctx.Response.StatusCode);
    }

    [Fact]
    public async Task PostRequest_MismatchedTokens_Returns403()
    {
        var ctx = CreateContext("POST", "abc123", "xyz789", true);
        var middleware = new CsrfProtectionMiddleware(c => Task.CompletedTask);
        await middleware.InvokeAsync(ctx);
        Assert.Equal(403, ctx.Response.StatusCode);
    }

    [Fact]
    public async Task PostRequest_MissingHeader_Returns403()
    {
        var ctx = CreateContext("POST", "abc123", null, true);
        var middleware = new CsrfProtectionMiddleware(c => Task.CompletedTask);
        await middleware.InvokeAsync(ctx);
        Assert.Equal(403, ctx.Response.StatusCode);
    }

    [Fact]
    public async Task PostRequest_NotAuthenticated_SkipsValidation()
    {
        var ctx = CreateContext("POST", null, null, false);
        var middleware = new CsrfProtectionMiddleware(c => Task.CompletedTask);
        await middleware.InvokeAsync(ctx);
        Assert.NotEqual(403, ctx.Response.StatusCode);
    }

    [Fact]
    public async Task DeleteRequest_MatchingTokens_Passes()
    {
        var ctx = CreateContext("DELETE", "token123", "token123", true);
        var middleware = new CsrfProtectionMiddleware(c => Task.CompletedTask);
        await middleware.InvokeAsync(ctx);
        Assert.NotEqual(403, ctx.Response.StatusCode);
    }
}
