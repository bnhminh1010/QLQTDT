using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using QLQTDT.Api.Services;

namespace QLQTDT.Api.Middleware;

/// <summary>
/// Authorization attribute kiểm tra quyền chi tiết (fine-grained permission).
/// Sử dụng IAsyncAuthorizationFilter để hỗ trợ async DB query.
///
/// Cách dùng:
///   [HasPermission("DeXuat.Approve")]                    — yêu cầu 1 quyền
///   [HasPermission("DeXuat.Read", "DeXuat.Write")]       — any-of (OR logic)
///
/// Cơ chế:
///   1. Kiểm tra user đã authenticated → 401 ChallengeResult nếu chưa
///   2. Lấy userId từ JWT claim (fallback sub → NameIdentifier)
///   3. Gọi IPermissionService.GetPermissionsAsync() để lấy quyền từ DB
///   4. So sánh với permissions yêu cầu → 403 ForbidResult nếu thiếu
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class HasPermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string[] _permissions;

    /// <summary>
    /// Tạo attribute yêu cầu ít nhất 1 trong các quyền được liệt kê (OR logic).
    /// </summary>
    /// <param name="permissions">Danh sách MaQuyen cần kiểm tra (VD: "DeXuat.Approve")</param>
    public HasPermissionAttribute(params string[] permissions)
    {
        if (permissions == null || permissions.Length == 0)
            throw new ArgumentException("Phải chỉ định ít nhất 1 permission.", nameof(permissions));

        _permissions = permissions;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // 1. Kiểm tra đã authenticated chưa
        var user = context.HttpContext.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            context.Result = new ChallengeResult(); // 401
            return;
        }

        // 2. Lấy userId — fallback sub → ClaimTypes.NameIdentifier (giống AuthController)
        var userIdClaim = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                       ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, out var userId))
        {
            context.Result = new ChallengeResult(); // 401 — token không hợp lệ
            return;
        }

        // 3. Resolve IPermissionService từ DI container của request hiện tại
        var permissionService = context.HttpContext.RequestServices
            .GetRequiredService<IPermissionService>();

        // 4. Lấy quyền của user (đã cache per-request trong service)
        var userPermissions = await permissionService.GetPermissionsAsync(userId);

        // 5. Kiểm tra OR logic: user cần có ít nhất 1 trong các quyền yêu cầu
        var hasAny = _permissions.Any(p => userPermissions.Contains(p));

        if (!hasAny)
        {
            context.Result = new ForbidResult(); // 403
        }
    }
}
