using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;

namespace QLQTDT.Api.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public sealed class DenyRolesAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _roles;

    public DenyRolesAttribute(params string[] roles)
    {
        if (roles == null || roles.Length == 0)
            throw new ArgumentException("Phai chi dinh it nhat 1 role bi chan.", nameof(roles));

        _roles = roles;
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (user?.Identity?.IsAuthenticated != true)
            return Task.CompletedTask;

        var hasDeniedRole = user.FindAll(ClaimTypes.Role)
            .Any(claim => _roles.Any(role =>
                string.Equals(claim.Value, role, StringComparison.OrdinalIgnoreCase)));

        if (!hasDeniedRole)
            return Task.CompletedTask;

        var logger = context.HttpContext.RequestServices.GetService<ILogger<DenyRolesAttribute>>();
        logger?.LogWarning(
            "[SECURITY] Role denied — Roles={Roles}, Path={Path}",
            string.Join(",", _roles),
            context.HttpContext.Request.Path);

        context.Result = new ForbidResult();
        return Task.CompletedTask;
    }
}
