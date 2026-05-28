using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Services;

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

    public async Task<bool> HasPermissionAsync(int userId, string permission)
    {
        var permissions = await GetPermissionsAsync(userId);
        return permissions.Contains(permission);
    }

    public async Task<IReadOnlySet<string>> GetPermissionsAsync(int userId)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        var cacheKey = $"{CacheKeyPrefix}{userId}";

        if (httpContext?.Items.TryGetValue(cacheKey, out var cached) == true
            && cached is IReadOnlySet<string> cachedPermissions)
        {
            return cachedPermissions;
        }

        var isActive = await _context.NguoiDungs
            .AnyAsync(user => user.Id == userId && user.TrangThaiHoatDong);

        if (!isActive)
        {
            var empty = (IReadOnlySet<string>)new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            httpContext?.Items.TryAdd(cacheKey, empty);
            return empty;
        }

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

        httpContext?.Items.TryAdd(cacheKey, result);
        return result;
    }
}
