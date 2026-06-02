using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Services;

/// <summary>
/// Kiểm tra quyền chi tiết của người dùng bằng cách query DB theo chuỗi:
///   NguoiDung → NguoiDung_KhoaPhong_VaiTro → VaiTro → VaiTro_Quyen → Quyen
///
/// Kết quả được cache trong HttpContext.Items theo userId,
/// đảm bảo chỉ query DB tối đa 1 lần per request.
/// </summary>
public class PermissionService : IPermissionService
{
    private const string CacheKeyPrefix = "UserPermissions:";

    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PermissionService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    /// <inheritdoc />
    public async Task<bool> HasPermissionAsync(int userId, string permission)
    {
        var permissions = await GetPermissionsAsync(userId);
        return permissions.Contains(permission);
    }

    /// <inheritdoc />
    public async Task<IReadOnlySet<string>> GetPermissionsAsync(int userId)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var cacheKey = $"{CacheKeyPrefix}{userId}";

        // 1. Kiểm tra cache per-request
        if (httpContext?.Items.TryGetValue(cacheKey, out var cached) == true
            && cached is IReadOnlySet<string> cachedPermissions)
        {
            return cachedPermissions;
        }

        // 2. Kiểm tra user còn active không — lớp bảo vệ runtime
        var isActive = await _context.NguoiDungs
            .AnyAsync(user => user.Id == userId && user.TrangThaiHoatDong);

        if (!isActive)
        {
            var empty = (IReadOnlySet<string>)new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (httpContext != null)
            {
                httpContext.Items[cacheKey] = empty;
            }
            return empty;
        }

        // 3. Query chuỗi: User → UserRoles → Roles → RolePermissions → Permissions
        //    Filter: VaiTro.DaXoa == false, Quyen.DaXoa == false
        var permissions = await _context.NguoiDungKhoaPhongVaiTros
            .Where(userRole => userRole.NguoiDungId == userId)
            .Select(userRole => userRole.VaiTro)
            .Where(role => !role.DaXoa)
            .SelectMany(role => role.VaiTroQuyens)
            .Select(rolePermission => rolePermission.Quyen)
            .Where(permission => !permission.DaXoa)
            .Select(permission => permission.MaQuyen)
            .Distinct()
            .ToListAsync();

        var result = (IReadOnlySet<string>)new HashSet<string>(
            permissions,
            StringComparer.OrdinalIgnoreCase);

        // 4. Cache vào HttpContext.Items (chỉ sống trong request hiện tại)
        if (httpContext != null)
        {
            httpContext.Items[cacheKey] = result;
        }

        return result;
    }
}
