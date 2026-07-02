using Microsoft.AspNetCore.Http;

namespace QLQTDT.Api.Security;

public static class FileDownloadHeaderPolicy
{
    public static void Apply(HttpResponse response)
    {
        response.Headers.XContentTypeOptions = "nosniff";
        response.Headers.CacheControl = "no-store";
        response.Headers.ContentSecurityPolicy = "sandbox";
        response.Headers["X-Download-Options"] = "noopen";
    }
}
