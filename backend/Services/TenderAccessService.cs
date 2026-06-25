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
        var scope = await ResolveTenderScopeDetailAsync(userId, fullScopePermission);
        return (scope.KhoaPhongIds, scope.IsFullScope);
    }

    public async Task<TenderScope> ResolveTenderScopeDetailAsync(
        int userId,
        string fullScopePermission = "GOITHAU.VIEW_ALL")
    {
        var permissions = await _permissionService.GetPermissionsAsync(userId);
        var isFullScope = permissions.Contains(fullScopePermission, StringComparer.OrdinalIgnoreCase)
            || permissions.Contains("GOITHAU.VIEW_ALL", StringComparer.OrdinalIgnoreCase);

        if (isFullScope)
            return new TenderScope([], true, false);

        var khoaPhongIds = await _db.NguoiDungKhoaPhongVaiTros
            .AsNoTracking()
            .Where(nkv => nkv.NguoiDungId == userId && nkv.KhoaPhongId.HasValue)
            .Select(nkv => nkv.KhoaPhongId!.Value)
            .Distinct()
            .ToListAsync();

        return new TenderScope(khoaPhongIds.ToHashSet(), false, khoaPhongIds.Count == 0);
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

        var scope = await ResolveTenderScopeDetailAsync(userId);
        if (scope.IsFullScope && !requireFullScope)
            return tender;

        if (scope.OwnOnly && tender.NguoiTaoId == userId)
            return tender;

        if (tender.NguoiTaoId == userId)
            return tender;

        if (tender.KhoaPhongId.HasValue && scope.KhoaPhongIds.Contains(tender.KhoaPhongId.Value))
            return tender;

        throw new ForbiddenException("Bạn không có quyền truy cập gói thầu này.");
    }
}
