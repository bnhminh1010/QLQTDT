using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Integration;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public static class TrangThaiDongBo
{
    public const string DangXuLy = "DANG_XU_LY";
    public const string ThanhCong = "THANH_CONG";
    public const string ThatBai = "THAT_BAI";
}

public class IntegrationService : IIntegrationService
{
    private readonly AppDbContext _db;

    public IntegrationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IntegrationLog> SyncAsync(SyncRequest request)
    {
        var log = new IntegrationLog
        {
            HeThong = request.HeThong,
            LoaiDongBo = request.LoaiDongBo,
            RequestPayload = request.RequestPayload,
            TrangThai = TrangThaiDongBo.DangXuLy
        };
        _db.IntegrationLogs.Add(log);
        await _db.SaveChangesAsync();

        try
        {
            // TODO: Gọi API ngoài thực tế (HIS/kho)
            // Mock thành công
            log.TrangThai = TrangThaiDongBo.ThanhCong;
            log.ResponsePayload = @"{""status"":""ok""}";
        }
        catch
        {
            log.TrangThai = TrangThaiDongBo.ThatBai;
            log.ResponsePayload = @"{""error"":""Lỗi đồng bộ hệ thống""}";
        }

        await _db.SaveChangesAsync();
        return log;
    }

    public async Task<PagedResult<IntegrationLog>> GetLogsAsync(int page, int pageSize, string? heThong, string? trangThai)
    {
        if (page < 1)
            throw new BadRequestException("page phải >= 1");
        if (pageSize < 1 || pageSize > 100)
            throw new BadRequestException("pageSize phải từ 1-100");

        var query = _db.IntegrationLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(heThong))
            query = query.Where(l => l.HeThong == heThong);
        if (!string.IsNullOrWhiteSpace(trangThai))
            query = query.Where(l => l.TrangThai == trangThai);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.ThoiGianDongBo)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<IntegrationLog>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IntegrationLog> RetryAsync(long id)
    {
        var log = await _db.IntegrationLogs.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy log đồng bộ với Id = {id}");

        if (log.TrangThai != TrangThaiDongBo.ThatBai)
            throw new ConflictException("Chỉ có thể retry log có trạng thái THẤT BẠI");

        log.TrangThai = TrangThaiDongBo.DangXuLy;
        await _db.SaveChangesAsync();

        try
        {
            // TODO: Gọi lại API ngoài
            log.TrangThai = TrangThaiDongBo.ThanhCong;
            log.ResponsePayload = @"{""status"":""ok"",""retry"":true}";
        }
        catch
        {
            log.TrangThai = TrangThaiDongBo.ThatBai;
            log.ResponsePayload = @"{""error"":""Lỗi đồng bộ hệ thống""}";
        }

        await _db.SaveChangesAsync();
        return log;
    }
}
