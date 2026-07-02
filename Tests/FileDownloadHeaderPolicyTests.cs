using Microsoft.AspNetCore.Http;
using QLQTDT.Api.Security;

namespace QLQTDT.Api.Tests.Security;

public class FileDownloadHeaderPolicyTests
{
    [Fact]
    public void Apply_SetsDownloadHardeningHeaders()
    {
        var context = new DefaultHttpContext();

        FileDownloadHeaderPolicy.Apply(context.Response);

        Assert.Equal("nosniff", context.Response.Headers.XContentTypeOptions);
        Assert.Equal("no-store", context.Response.Headers.CacheControl);
        Assert.Equal("sandbox", context.Response.Headers.ContentSecurityPolicy);
        Assert.Equal("noopen", context.Response.Headers["X-Download-Options"]);
    }
}
