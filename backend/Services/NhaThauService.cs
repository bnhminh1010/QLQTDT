using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Models.DTOs.NhaThau;
using QLQTDT.Api.Models.Entities;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace QLQTDT.Api.Services;

public partial class NhaThauService : BaseService<NhaThau>, INhaThauService
{
    private const long MaxHoSoNangLucFileSizeBytes = 50 * 1024 * 1024;
    private const string HoSoNangLucFolder = "hosonangluc";

    private readonly IFtpService _ftp;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ITenderAccessService _tenderAccess;

    public NhaThauService(
        AppDbContext db,
        IFtpService ftp,
        IHttpContextAccessor httpContextAccessor,
        ITenderAccessService tenderAccess) : base(db)
    {
        _ftp = ftp;
        _httpContextAccessor = httpContextAccessor;
        _tenderAccess = tenderAccess;
    }

    public async Task<PagedResult<NhaThau>> SearchAsync(int page, int pageSize, string? search)
    {
        Expression<Func<NhaThau, bool>>? filter = null;

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            filter = n => n.TenCongTy.Contains(keyword)
                || n.MaSoThue.Contains(keyword)
                || (n.DiaChi != null && n.DiaChi.Contains(keyword))
                || (n.NguoiDaiDien != null && n.NguoiDaiDien.Contains(keyword))
                || (n.Email != null && n.Email.Contains(keyword))
                || (n.SoDienThoai != null && n.SoDienThoai.Contains(keyword));
        }

        return await base.GetAllAsync(page, pageSize, filter, q => q.OrderBy(x => x.TenCongTy));
    }

    public async Task<NhaThau> CreateAsync(CreateNhaThauDto dto)
    {
        var exists = await _set.AnyAsync(n => n.MaSoThue == dto.MaSoThue);
        if (exists)
            throw new ConflictException("Mã số thuế đã tồn tại");

        if (dto.NguoiDungId.HasValue)
        {
            var userExists = await _db.NguoiDungs.AnyAsync(u => u.Id == dto.NguoiDungId.Value);
            if (!userExists)
                throw new NotFoundException($"Không tìm thấy người dùng với Id = {dto.NguoiDungId}");
        }

        var entity = new NhaThau
        {
            MaSoThue = dto.MaSoThue,
            TenCongTy = dto.TenCongTy.Trim(),
            DiaChi = dto.DiaChi != null ? dto.DiaChi.Trim() : null,
            NguoiDaiDien = dto.NguoiDaiDien != null ? dto.NguoiDaiDien.Trim() : null,
            Email = dto.Email,
            SoDienThoai = dto.SoDienThoai,
            TrangThaiHoatDong = dto.TrangThaiHoatDong ?? true,
            NguoiDungId = dto.NguoiDungId
        };

        return await base.CreateAsync(entity);
    }

    public async Task<NhaThau> UpdateAsync(int id, UpdateNhaThauDto dto)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy nhà thầu với Id = {id}");

        if (!string.Equals(existing.MaSoThue, dto.MaSoThue, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _set.AnyAsync(n => n.MaSoThue == dto.MaSoThue && n.Id != id);
            if (exists)
                throw new ConflictException("Mã số thuế đã tồn tại");
        }

        if (dto.NguoiDungId.HasValue)
        {
            var userExists = await _db.NguoiDungs.AnyAsync(u => u.Id == dto.NguoiDungId.Value);
            if (!userExists)
                throw new NotFoundException($"Không tìm thấy người dùng với Id = {dto.NguoiDungId}");
        }

        existing.MaSoThue = dto.MaSoThue;
        existing.TenCongTy = InputSanitizer.Sanitize(dto.TenCongTy);
        existing.DiaChi = dto.DiaChi != null ? InputSanitizer.Sanitize(dto.DiaChi) : null;
        existing.NguoiDaiDien = dto.NguoiDaiDien != null ? InputSanitizer.Sanitize(dto.NguoiDaiDien) : null;
        existing.Email = dto.Email;
        existing.SoDienThoai = dto.SoDienThoai;
        existing.TrangThaiHoatDong = dto.TrangThaiHoatDong;
        existing.NguoiDungId = dto.NguoiDungId;

        await _db.SaveChangesAsync();
        return existing;
    }

    public override async Task DeleteAsync(int id)
    {
        var existing = await _set.FindAsync(id)
            ?? throw new NotFoundException($"Không tìm thấy nhà thầu với Id = {id}");

        if (existing.TrangThaiHoatDong)
            throw new BadRequestException("Không thể xoá nhà thầu đang hoạt động");

        _set.Remove(existing);
        await _db.SaveChangesAsync();
    }

    public async Task<List<HoSoNangLucDto>> GetHoSoNangLucAsync(int nhaThauId)
    {
        await EnsureNhaThauExistsAsync(nhaThauId);

        return await _db.HoSoNangLucs
            .Where(h => h.NhaThauId == nhaThauId)
            .OrderByDescending(h => h.Id)
            .Select(h => new HoSoNangLucDto
            {
                Id = h.Id,
                NhaThauId = h.NhaThauId,
                LoaiTaiLieu = h.LoaiTaiLieu,
                TenFile = h.TenFile,
                DuongDanFile = h.DuongDanFile,
                NgayHetHan = h.NgayHetHan
            })
            .ToListAsync();
    }

    public async Task<HoSoNangLucDto> UploadHoSoNangLucAsync(
        int nhaThauId, UploadHoSoNangLucDto dto, CancellationToken ct = default)
    {
        await EnsureNhaThauExistsAsync(nhaThauId, ct);

        var file = dto.File;
        if (file is null)
            throw new BadRequestException("File ho so nang luc la bat buoc.");

        var displayName = Path.GetFileName(file.FileName);
        if (file.Length == 0)
            throw new BadRequestException($"File '{displayName}' trong.");

        if (file.Length > MaxHoSoNangLucFileSizeBytes)
            throw new BadRequestException($"File '{displayName}' vuot qua gioi han 50MB.");

        var ftpPath = BuildHoSoNangLucFtpPath(nhaThauId, file.FileName);

        try
        {
            using var stream = file.OpenReadStream();
            await _ftp.UploadAsync(stream, ftpPath, ct);

            var entity = new HoSoNangLuc
            {
                NhaThauId = nhaThauId,
                LoaiTaiLieu = LoaiTaiLieu.HO_SO_NANG_LUC,
                TenFile = displayName,
                DuongDanFile = ftpPath,
                NgayHetHan = dto.NgayHetHan?.Date
            };

            _db.HoSoNangLucs.Add(entity);
            await _db.SaveChangesAsync(ct);

            return new HoSoNangLucDto
            {
                Id = entity.Id,
                NhaThauId = entity.NhaThauId,
                LoaiTaiLieu = entity.LoaiTaiLieu,
                TenFile = entity.TenFile,
                DuongDanFile = entity.DuongDanFile,
                NgayHetHan = entity.NgayHetHan
            };
        }
        catch
        {
            try { await _ftp.DeleteAsync(ftpPath, CancellationToken.None); }
            catch { /* best effort cleanup */ }
            throw;
        }
    }

    public async Task DeleteHoSoNangLucAsync(int nhaThauId, long hoSoId, CancellationToken ct = default)
    {
        var entity = await _db.HoSoNangLucs
            .FirstOrDefaultAsync(h => h.Id == hoSoId && h.NhaThauId == nhaThauId, ct)
            ?? throw new NotFoundException($"Khong tim thay ho so nang luc voi Id = {hoSoId}");

        try
        {
            await _ftp.DeleteAsync(entity.DuongDanFile, ct);
        }
        catch (NotFoundException)
        {
            // File da bi xoa tren FTP truoc do, van xoa ban ghi DB.
        }

        _db.HoSoNangLucs.Remove(entity);
        await _db.SaveChangesAsync(CancellationToken.None);
    }

    public async Task<List<LichSuDauThauItemDto>> GetLichSuDauThauAsync(int nhaThauId)
    {
        await EnsureNhaThauExistsAsync(nhaThauId);

        var currentUserId = GetCurrentUserId();
        var scope = await _tenderAccess.ResolveTenderScopeDetailAsync(currentUserId);

        var query = _db.HoSoDuThaus
            .AsNoTracking()
            .Where(h => h.NhaThauId == nhaThauId && h.GoiThau!.TrangThaiHoatDong);

        if (!scope.IsFullScope)
        {
            query = query.Where(h => h.GoiThau!.NguoiTaoId == currentUserId
                || scope.KhoaPhongIds.Contains(h.GoiThau.KhoaPhongId ?? -1));
        }

        return await query
            .OrderByDescending(h => h.NgayNop)
            .Select(h => new LichSuDauThauItemDto
            {
                HoSoDuThauId = h.Id,
                GoiThauId = h.GoiThauId,
                MaGoiThau = h.GoiThau!.MaGoiThau,
                TenGoiThau = h.GoiThau.TenGoiThau,
                TrangThaiGoiThau = h.GoiThau.TrangThai,
                GiaDuThau = h.GiaDuThau,
                GiaTrungThau = h.GiaTrungThau,
                KetQua = h.TrangThai,
                NgayNop = h.NgayNop,
                NgayCapNhat = h.NgayCapNhat
            })
            .ToListAsync();
    }

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        if (claim is null || !int.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("Yêu cầu chưa được xác thực.");
        return id;
    }

    private async Task EnsureNhaThauExistsAsync(int nhaThauId, CancellationToken ct = default)
    {
        var exists = await _set.AnyAsync(n => n.Id == nhaThauId, ct);
        if (!exists)
            throw new NotFoundException($"Khong tim thay nha thau voi Id = {nhaThauId}");
    }

    private static string BuildHoSoNangLucFtpPath(int nhaThauId, string originalFileName)
    {
        var ext = Path.GetExtension(originalFileName).TrimStart('.').ToLowerInvariant();
        ext = ExtSanitizeRegex().Replace(ext, "");
        if (ext.Length > 10) ext = ext[..10];
        if (string.IsNullOrEmpty(ext)) ext = "bin";

        var guid = Guid.NewGuid().ToString("N")[..12];
        return $"{HoSoNangLucFolder}/nt{nhaThauId}/{guid}.{ext}";
    }

    [GeneratedRegex(@"[^A-Za-z0-9]")]
    private static partial Regex ExtSanitizeRegex();
}
