using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class HoSoDuThauService : IHoSoDuThauService
{
    private readonly AppDbContext _db;

    public HoSoDuThauService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<HoSoDuThauDetailDto> CreateAsync(CreateHoSoDuThauRequest request)
    {
        // Validate GoiThau tồn tại
        var goiThau = await _db.GoiThaus.FindAsync(request.GoiThauId)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {request.GoiThauId}");

        // Không được nộp hồ sơ khi gói thầu đã hủy hoặc đã chọn nhà thầu
        if (goiThau.TrangThai == GoiThauTrangThai.HUY_BO)
            throw new BadRequestException("Không thể nộp hồ sơ cho gói thầu đã hủy.");
        if (goiThau.TrangThai == GoiThauTrangThai.DA_CHON_NHA_THAU)
            throw new BadRequestException("Gói thầu đã chọn nhà thầu, không thể nộp thêm hồ sơ.");

        // Validate NhaThau tồn tại và đang hoạt động
        var nhaThau = await _db.NhaThaus.FindAsync(request.NhaThauId)
            ?? throw new NotFoundException($"Không tìm thấy nhà thầu với Id = {request.NhaThauId}");
        if (!nhaThau.TrangThaiHoatDong)
            throw new BadRequestException("Nhà thầu không còn hoạt động.");

        // 1 nhà thầu chỉ được có 1 hồ sơ cho 1 gói thầu
        var duplicate = await _db.HoSoDuThaus.AnyAsync(h =>
            h.GoiThauId == request.GoiThauId && h.NhaThauId == request.NhaThauId);
        if (duplicate)
            throw new ConflictException("Nhà thầu đã có hồ sơ dự thầu cho gói thầu này.");

        // Validate fileIds
        var distinctFileIds = request.FileIds.Distinct().ToList();
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

            var alreadyLinked = files.Where(f => f.HoSoDuThauId != null).ToList();
            if (alreadyLinked.Count > 0)
                throw new ConflictException($"Tài liệu đã được liên kết với hồ sơ khác: {string.Join(", ", alreadyLinked.Select(f => f.Id))}");
        }

        var entity = new HoSoDuThau
        {
            GoiThauId = request.GoiThauId,
            NhaThauId = request.NhaThauId,
            GiaDuThau = request.GiaDuThau,
            GhiChu = request.GhiChu?.Trim(),
            TrangThai = HoSoDuThauTrangThai.CHUA_XU_LY,
            NgayNop = DateTime.UtcNow
        };

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.HoSoDuThaus.Add(entity);
            await _db.SaveChangesAsync();

            if (distinctFileIds.Count > 0)
            {
                await _db.TaiLieuHoSos
                    .Where(f => distinctFileIds.Contains(f.Id))
                    .ExecuteUpdateAsync(s => s.SetProperty(f => f.HoSoDuThauId, entity.Id));
            }

            await transaction.CommitAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            await transaction.RollbackAsync();
            throw new ConflictException("Nhà thầu đã có hồ sơ dự thầu cho gói thầu này.");
        }

        return await BuildDetailDtoAsync(entity.Id);
    }

    public async Task<PagedResult<HoSoDuThauListItemDto>> GetByGoiThauAsync(int goiThauId, int page, int pageSize)
    {
        if (goiThauId <= 0)
            throw new BadRequestException("goiThauId không hợp lệ.");

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var goiThauExists = await _db.GoiThaus.AnyAsync(g => g.Id == goiThauId);
        if (!goiThauExists)
            throw new NotFoundException($"Không tìm thấy gói thầu với Id = {goiThauId}");

        var query = _db.HoSoDuThaus
            .Where(h => h.GoiThauId == goiThauId)
            .Join(_db.NhaThaus, h => h.NhaThauId, n => n.Id,
                (h, n) => new HoSoDuThauListItemDto
                {
                    Id = h.Id,
                    GoiThauId = h.GoiThauId,
                    NhaThauId = h.NhaThauId,
                    TenNhaThau = n.TenCongTy,
                    MaSoThue = n.MaSoThue,
                    GiaDuThau = h.GiaDuThau,
                    GiaTrungThau = h.GiaTrungThau,
                    TrangThai = h.TrangThai,
                    NgayNop = h.NgayNop
                });

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(h => h.NgayNop)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<HoSoDuThauListItemDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<HoSoDuThauDetailDto> GetByIdAsync(int id)
    {
        return await BuildDetailDtoAsync(id);
    }

    public async Task UpdateTrangThaiAsync(int id, UpdateTrangThaiHoSoRequest request)
    {
        var entity = await _db.HoSoDuThaus.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy hồ sơ dự thầu với Id = {id}");

        if (!HoSoDuThauTrangThai.CoTheCapNhat.Contains(request.TrangThai))
            throw new BadRequestException($"Trạng thái không hợp lệ. Các giá trị được phép: {string.Join(", ", HoSoDuThauTrangThai.CoTheCapNhat)}");

        if (entity.TrangThai == HoSoDuThauTrangThai.TRUNG_THAU)
            throw new BadRequestException("Không thể thay đổi trạng thái hồ sơ đã trúng thầu.");

        // Không cho phép quay về CHUA_XU_LY từ trạng thái đã xử lý
        if (request.TrangThai == HoSoDuThauTrangThai.CHUA_XU_LY
            && entity.TrangThai != HoSoDuThauTrangThai.CHUA_XU_LY)
            throw new BadRequestException("Không thể đổi trạng thái về CHUA_XU_LY sau khi đã xử lý.");

        entity.TrangThai = request.TrangThai;
        entity.NgayCapNhat = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task AwardAsync(int goiThauId, AwardGoiThauRequest request)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.RepeatableRead);

        var goiThau = await _db.GoiThaus.FindAsync(goiThauId)
            ?? throw new NotFoundException($"Không tìm thấy gói thầu với Id = {goiThauId}");

        if (goiThau.TrangThai == GoiThauTrangThai.DA_CHON_NHA_THAU)
            throw new ConflictException("Gói thầu đã được chọn nhà thầu trước đó.");

        if (goiThau.TrangThai == GoiThauTrangThai.HUY_BO)
            throw new BadRequestException("Không thể award gói thầu đã hủy.");

        var hoSo = await _db.HoSoDuThaus.FindAsync(request.HoSoDuThauId)
            ?? throw new NotFoundException($"Không tìm thấy hồ sơ dự thầu với Id = {request.HoSoDuThauId}");

        if (hoSo.GoiThauId != goiThauId)
            throw new BadRequestException("Hồ sơ dự thầu không thuộc gói thầu này.");

        if (hoSo.TrangThai == HoSoDuThauTrangThai.BI_TU_CHOI)
            throw new BadRequestException("Không thể chọn hồ sơ đã bị từ chối.");

        if (hoSo.TrangThai == HoSoDuThauTrangThai.TRUNG_THAU)
            throw new ConflictException("Hồ sơ này đã được chọn trúng thầu trước đó.");

        if (request.GiaTrungThau > hoSo.GiaDuThau)
            throw new BadRequestException("Giá trúng thầu không được cao hơn giá dự thầu.");

        hoSo.TrangThai = HoSoDuThauTrangThai.TRUNG_THAU;
        hoSo.GiaTrungThau = request.GiaTrungThau;
        hoSo.NgayCapNhat = DateTime.UtcNow;

        goiThau.TrangThai = GoiThauTrangThai.DA_CHON_NHA_THAU;
        goiThau.NgayCapNhat = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    private async Task<HoSoDuThauDetailDto> BuildDetailDtoAsync(int id)
    {
        var dto = await _db.HoSoDuThaus
            .Where(h => h.Id == id)
            .Select(h => new HoSoDuThauDetailDto
            {
                Id = h.Id,
                GoiThauId = h.GoiThauId,
                TenGoiThau = h.GoiThau!.TenGoiThau,
                NhaThauId = h.NhaThauId,
                TenNhaThau = h.NhaThau!.TenCongTy,
                MaSoThue = h.NhaThau!.MaSoThue,
                GiaDuThau = h.GiaDuThau,
                GiaTrungThau = h.GiaTrungThau,
                TrangThai = h.TrangThai,
                GhiChu = h.GhiChu,
                NgayNop = h.NgayNop,
                NgayCapNhat = h.NgayCapNhat,
                TaiLieus = h.TaiLieus
                    .Where(f => !f.DaXoa)
                    .Select(f => new TaiLieuTomTatDto
                    {
                        Id = f.Id,
                        TenFile = f.TenFile,
                        KichThuoc = f.KichThuoc,
                        LoaiTaiLieu = f.LoaiTaiLieu,
                        ContentType = f.ContentType
                    }).ToList()
            })
            .FirstOrDefaultAsync();

        return dto ?? throw new NotFoundException($"Không tìm thấy hồ sơ dự thầu với Id = {id}");
    }
}
