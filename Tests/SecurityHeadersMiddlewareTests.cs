using Microsoft.AspNetCore.Http;
using QLQTDT.Api.Middleware;

namespace QLQTDT.Api.Tests.Middleware;

public class SecurityHeadersMiddlewareTests
{
    [Fact]
    public async Task HttpRequest_DoesNotEmitHstsHeader()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "http";
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(context);

        Assert.False(context.Response.Headers.ContainsKey("Strict-Transport-Security"));
    }

    [Fact]
    public async Task HttpsRequest_EmitsHstsHeader()
    {
        var context = new DefaultHttpContext();
        context.Request.Scheme = "https";
        var middleware = new SecurityHeadersMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(context);

        Assert.Equal(
            "max-age=31536000; includeSubDomains",
            context.Response.Headers.StrictTransportSecurity);
    }
}
