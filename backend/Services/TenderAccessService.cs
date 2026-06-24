using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class TenderAccessService : ITenderAccessService
{
    private readonly AppDbContext _db;
    private readonly IPermissionService _permissionService;

    public TenderAccessService(AppDbContext db, IPermissionService permissionService)
    {
        _db = db;
        _permissionService = permissionService;
    }

    public async Task<(HashSet<int> KhoaPhongIds, bool IsFullScope)> ResolveTenderScopeAsync(
        int userId,
        string fullScopePermission = "GOITHAU.VIEW_ALL")
    {
        var permissions = await _permissionService.GetPermissionsAsync(userId);
        var isFullScope = permissions.Contains(fullScopePermission, StringComparer.OrdinalIgnoreCase)
            || permissions.Contains("GOITHAU.VIEW_ALL", StringComparer.OrdinalIgnoreCase)
            || permissions.Contains("REPORT.VIEW_ALL", StringComparer.OrdinalIgnoreCase);

        if (isFullScope)
            return ([], true);

        var khoaPhongIds = await _db.NguoiDungKhoaPhongVaiTros
            .AsNoTracking()
            .Where(nkv => nkv.NguoiDungId == userId && nkv.KhoaPhongId.HasValue)
            .Select(nkv => nkv.KhoaPhongId!.Value)
            .Distinct()
            .ToListAsync();

        return (khoaPhongIds.ToHashSet(), false);
    }

    public Task EnsureCanViewAsync(int userId, int goiThauId)
        => GetAccessibleTenderAsync(userId, goiThauId);

    public Task EnsureCanEditAsync(int userId, int goiThauId)
        => GetAccessibleTenderAsync(userId, goiThauId);

    public Task EnsureCanProcessAsync(int userId, int goiThauId)
        => GetAccessibleTenderAsync(userId, goiThauId);

    public async Task<GoiThau> GetAccessibleTenderAsync(int userId, int goiThauId, bool requireFullScope = false)
    {
        var tender = await _db.GoiThaus
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == goiThauId && g.TrangThaiHoatDong)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {goiThauId}");

        var (allowedKhoaPhongIds, isFullScope) = await ResolveTenderScopeAsync(userId);
        if (isFullScope && !requireFullScope)
            return tender;

        if (tender.KhoaPhongId.HasValue && allowedKhoaPhongIds.Contains(tender.KhoaPhongId.Value))
            return tender;

        throw new ForbiddenException("Bạn không có quyền truy cập gói thầu này.");
    }
}
