using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.ThongBao;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class ThongBaoService : IThongBaoService
{
    private readonly AppDbContext _db;

    public ThongBaoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ThongBaoListResponse> GetListAsync(int nguoiDungId, int page = 1, int pageSize = 20, bool? daDoc = null)
    {
        var query = _db.ThongBaos
            .Where(t => t.NguoiDungId == nguoiDungId);

        if (daDoc.HasValue)
            query = query.Where(t => t.DaDoc == daDoc.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.NgayTao)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new ThongBaoListItemDto
            {
                IdCongKhai = t.IdCongKhai,
                LoaiThongBao = t.LoaiThongBao,
                TieuDe = t.TieuDe,
                NoiDung = t.NoiDung,
                DaDoc = t.DaDoc,
                UrlDieuHuong = t.UrlDieuHuong,
                NgayTao = t.NgayTao
            })
            .ToListAsync();

        return new ThongBaoListResponse
        {
            TotalCount = totalCount,
            Items = items
        };
    }

    public async Task MarkReadAsync(Guid idCongKhai, int nguoiDungId)
    {
        var thongBao = await _db.ThongBaos
            .FirstOrDefaultAsync(t => t.IdCongKhai == idCongKhai);

        if (thongBao is null)
            throw new NotFoundException("Không tìm thấy thông báo.");

        if (thongBao.NguoiDungId != nguoiDungId)
            throw new ForbiddenException("Bạn không có quyền thao tác thông báo này.");

        thongBao.DaDoc = true;
        thongBao.NgayDoc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<int> MarkAllReadAsync(int nguoiDungId)
    {
        var count = await _db.ThongBaos
            .CountAsync(t => t.NguoiDungId == nguoiDungId && !t.DaDoc);

        await _db.ThongBaos
            .Where(t => t.NguoiDungId == nguoiDungId && !t.DaDoc)
            .ExecuteUpdateAsync(set => set
                .SetProperty(t => t.DaDoc, true)
                .SetProperty(t => t.NgayDoc, DateTime.UtcNow));

        return count;
    }

    public async Task CreateAsync(ThongBao thongBao)
    {
        _db.ThongBaos.Add(thongBao);
        await _db.SaveChangesAsync();
    }
}
