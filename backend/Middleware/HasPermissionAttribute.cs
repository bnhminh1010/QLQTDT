using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace QLQTDT.Api.Middleware;

/// <summary>
/// Authorization attribute kiểm tra quyền chi tiết (fine-grained permission).
///
/// Cách dùng:
///   [HasPermission("DEXUAT.VIEW")]                          — yêu cầu 1 quyền
///   [HasPermission("DEXUAT.VIEW", "DEXUAT.EDIT")]           — any-of (OR logic)

///
/// Cơ chế:
///   1. Kiểm tra user đã authenticated → 401 nếu chưa
///   2. Đọc claim "permissions" từ JWT token (được nhét lúc login bởi Task 4)
///   3. Split chuỗi permissions theo dấu phẩy → HashSet
///   4. So sánh với permissions yêu cầu (OR) → 403 nếu thiếu
///
/// Cache: Permissions đã nằm sẵn trong JWT, ASP.NET Core tự parse
/// ClaimsPrincipal vào memory 1 lần duy nhất per request → 0 DB round-trip.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class HasPermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _permissions;

    public HasPermissionAttribute(params string[] permissions)
    {
        if (permissions == null || permissions.Length == 0)
            throw new ArgumentException("Phải chỉ định ít nhất 1 permission.", nameof(permissions));

        _permissions = permissions;
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // 1. Kiểm tra đã authenticated chưa
        var user = context.HttpContext.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            context.Result = new ChallengeResult(); // 401
            return Task.CompletedTask;
        }

        // 2. Đọc claim "permissions" từ JWT token
        var permissionsClaim = user.FindFirstValue("permissions");
        if (string.IsNullOrEmpty(permissionsClaim))
        {
            context.Result = new ForbidResult(); // 403 — không có quyền nào
            return Task.CompletedTask;
        }

        // 3. Parse chuỗi permissions thành HashSet (cache trong request bởi ClaimsPrincipal)
        var userPermissions = permissionsClaim
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // 4. Kiểm tra OR logic: user cần có ít nhất 1 trong các quyền yêu cầu
        if (!_permissions.Any(p => userPermissions.Contains(p)))
        {
            context.Result = new ForbidResult(); // 403
        }

        return Task.CompletedTask;
    }
}
