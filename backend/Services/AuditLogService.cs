using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;

namespace QLQTDT.Api.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;

    public AuditLogService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<NhatKyKiemToan>> GetAllAsync(int page, int pageSize, string? hanhDong, string? bang)
    {
        if (page < 1)
            throw new BadRequestException("page phải >= 1");
        if (pageSize < 1 || pageSize > 100)
            throw new BadRequestException("pageSize phải từ 1-100");

        var query = _db.NhatKyKiemToans.AsQueryable();

        if (!string.IsNullOrWhiteSpace(hanhDong))
            query = query.Where(l => l.HanhDong.Contains(hanhDong));

        if (!string.IsNullOrWhiteSpace(bang))
            query = query.Where(l => l.Bang != null && l.Bang.Contains(bang));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.ThoiGianThucHien)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<NhatKyKiemToan>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<NhatKyKiemToan>> GetByGoiThauAsync(long goiThauId, int page, int pageSize)
    {
        if (page < 1)
            throw new BadRequestException("page phải >= 1");
        if (pageSize < 1 || pageSize > 100)
            throw new BadRequestException("pageSize phải từ 1-100");

        var query = _db.NhatKyKiemToans.Where(l => l.GoiThauId == goiThauId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.ThoiGianThucHien)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync();

        return new PagedResult<NhatKyKiemToan>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }
}
