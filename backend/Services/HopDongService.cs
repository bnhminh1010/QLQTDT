using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HopDong;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class HopDongService : IHopDongService
{
    private readonly AppDbContext _db;

    public HopDongService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<HopDongDetailDto> CreateAsync(CreateHopDongRequest request)
    {
        var distinctFileIds = (request.FileIds ?? []).Distinct().ToList();

        var entity = new HopDong
        {
            GoiThauId   = request.GoiThauId,
            SoHopDong   = request.SoHopDong.Trim(),
            TongGiaTri  = request.TongGiaTri,
            NgayKy      = request.NgayKy,
            NgayTao     = DateTime.UtcNow
        };

        // RepeatableRead: lock GoiThau để tránh race khi trạng thái bị đổi đồng thời
        await using var transaction = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead);
        try
        {
            var goiThau = await _db.GoiThaus.FindAsync(request.GoiThauId)
                ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {request.GoiThauId}");

            if (goiThau.TrangThai != GoiThauTrangThai.DA_CHON_NHA_THAU)
            {
                var msg = goiThau.TrangThai switch
                {
                    GoiThauTrangThai.DU_THAO          => "Gói thầu chưa được công bố.",
                    GoiThauTrangThai.DANG_XU_LY        => "Gói thầu đang trong quá trình đấu thầu, chưa chọn nhà thầu.",
                    GoiThauTrangThai.HOAN_THANH        => "Gói thầu đã hoàn tất.",
                    GoiThauTrangThai.HUY_BO            => "Gói thầu đã bị hủy.",
                    _                                  => "Gói thầu chưa ở trạng thái có thể lập hợp đồng."
                };
                throw new BadRequestException(msg);
            }

            var duplicate = await _db.HopDongs.AnyAsync(h => h.GoiThauId == request.GoiThauId);
            if (duplicate)
                throw new ConflictException("Gói thầu này đã có hợp đồng.");

            if (distinctFileIds.Count > 0)
            {
                var files = await _db.TaiLieuHoSos
                    .Where(f => distinctFileIds.Contains(f.Id))
                    .ToListAsync();

                var foundIds = files.Select(f => f.Id).ToHashSet();
                var missingIds = distinctFileIds.Where(id => !foundIds.Contains(id)).ToList();
                if (missingIds.Count > 0)
                    throw new NotFoundException($"Không tìm thấy tài liệu với Id: {string.Join(", ", missingIds)}");

                var deletedFiles = files.Where(f => f.DaXoa).ToList();
                if (deletedFiles.Count > 0)
                    throw new BadRequestException($"Tài liệu đã bị xóa: {string.Join(", ", deletedFiles.Select(f => f.Id))}");

                var wrongGoiThau = files.Where(f => f.GoiThauId != request.GoiThauId).ToList();
                if (wrongGoiThau.Count > 0)
                    throw new BadRequestException($"Tài liệu không thuộc gói thầu này: {string.Join(", ", wrongGoiThau.Select(f => f.Id))}");

                var invalidType = files.Where(f => !LoaiTaiLieu.HopDongTypes.Contains(f.LoaiTaiLieu)).ToList();
                if (invalidType.Count > 0)
                    throw new BadRequestException(
                        $"Tài liệu có loại không hợp lệ cho hợp đồng (phải là {string.Join(", ", LoaiTaiLieu.HopDongTypes)}): " +
                        $"{string.Join(", ", invalidType.Select(f => f.Id))}");

                // TODO: sau khi task-027 merge vào develop, thêm || f.HoSoDuThauId != null
                var alreadyLinked = files.Where(f => f.HopDongId != null).ToList();
                if (alreadyLinked.Count > 0)
                    throw new ConflictException($"Tài liệu đã được liên kết với hợp đồng khác: {string.Join(", ", alreadyLinked.Select(f => f.Id))}");
            }

            _db.HopDongs.Add(entity);
            await _db.SaveChangesAsync();

            if (distinctFileIds.Count > 0)
            {
                await _db.TaiLieuHoSos
                    .Where(f => distinctFileIds.Contains(f.Id))
                    .ExecuteUpdateAsync(s => s.SetProperty(f => f.HopDongId, entity.Id));
            }

            await transaction.CommitAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            await transaction.RollbackAsync();
            throw new ConflictException("Gói thầu này đã có hợp đồng hoặc số hợp đồng đã tồn tại.");
        }

        return await BuildDetailDtoAsync(entity.Id);
    }

    public async Task<PagedResult<HopDongListItemDto>> GetByGoiThauAsync(int goiThauId, int page, int pageSize)
    {
        if (goiThauId <= 0)
            throw new BadRequestException("goiThauId không hợp lệ.");

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var goiThauExists = await _db.GoiThaus.AnyAsync(g => g.Id == goiThauId);
        if (!goiThauExists)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {goiThauId}");

        var query = _db.HopDongs
            .Where(h => h.GoiThauId == goiThauId)
            .Select(h => new HopDongListItemDto
            {
                Id          = h.Id,
                GoiThauId   = h.GoiThauId,
                TenGoiThau  = h.GoiThau!.TenGoiThau,
                SoHopDong   = h.SoHopDong,
                TongGiaTri  = h.TongGiaTri,
                NgayKy      = h.NgayKy,
                NgayTao     = h.NgayTao
            });

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(h => h.NgayTao)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<HopDongListItemDto>
        {
            Items    = items,
            Total    = total,
            Page     = page,
            PageSize = pageSize
        };
    }

    public async Task<HopDongDetailDto> GetByIdAsync(int id)
    {
        return await BuildDetailDtoAsync(id);
    }

    private async Task<HopDongDetailDto> BuildDetailDtoAsync(int id)
    {
        var dto = await _db.HopDongs
            .Where(h => h.Id == id)
            .Select(h => new HopDongDetailDto
            {
                Id          = h.Id,
                GoiThauId   = h.GoiThauId,
                TenGoiThau  = h.GoiThau!.TenGoiThau,
                SoHopDong   = h.SoHopDong,
                TongGiaTri  = h.TongGiaTri,
                NgayKy      = h.NgayKy,
                NgayTao     = h.NgayTao,
                NgayCapNhat = h.NgayCapNhat,
                TaiLieus    = h.TaiLieus
                    .Where(f => !f.DaXoa)
                    .Select(f => new TaiLieuTomTatDto
                    {
                        Id           = f.Id,
                        TenFile      = f.TenFile,
                        KichThuoc    = f.KichThuoc,
                        LoaiTaiLieu  = f.LoaiTaiLieu,
                        ContentType  = f.ContentType
                    }).ToList()
            })
            .FirstOrDefaultAsync();

        return dto ?? throw new NotFoundException($"Không tìm thấy hợp đồng với Id = {id}");
    }
}
