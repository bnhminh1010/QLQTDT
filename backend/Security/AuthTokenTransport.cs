using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Net.Http.Headers;

namespace QLQTDT.Api.Security;

public static class AuthTokenTransport
{
    public const string AllowBearerInProductionEnvVar = "AUTH_ALLOW_BEARER_IN_PRODUCTION";

    public static bool AllowBearerHeader(string environmentName, bool allowBearerInProduction) =>
        !string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase)
        || allowBearerInProduction;

    public static void ResolveAccessToken(
        MessageReceivedContext context,
        string environmentName,
        bool allowBearerInProduction,
        string accessCookieName)
    {
        var request = context.Request;
        var hasAuthorizationHeader = request.Headers.ContainsKey(HeaderNames.Authorization);

        if (hasAuthorizationHeader && AllowBearerHeader(environmentName, allowBearerInProduction))
        {
            return;
        }

        if (request.Cookies.TryGetValue(accessCookieName, out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            context.Token = cookieToken;
            return;
        }

        if (hasAuthorizationHeader)
        {
            context.NoResult();
        }
    }
}
