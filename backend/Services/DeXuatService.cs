using System.Data;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.DeXuat;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class DeXuatService : IDeXuatService
{
    private readonly AppDbContext _context;

    public DeXuatService(AppDbContext context)
    {
        _context = context;
    }

    // ──────────────────────────────────────────────
    // GET ALL — filter theo KhoaPhong của user
    // ──────────────────────────────────────────────
    public async Task<PagedResult<DeXuatResponseDto>> GetAllAsync(DeXuatQueryParams p, int userId)
    {
        var userKhoaPhongIds = await GetUserKhoaPhongIdsAsync(userId);

        var query = _context.DeXuatMuaSams
            .Where(d => !d.DaXoa)
            .Where(d => userKhoaPhongIds.Contains(d.KhoaPhongId))
            .Include(d => d.KhoaPhong)
            .Include(d => d.NguoiDeXuat)
            .AsQueryable();

        // Filter trạng thái
        if (!string.IsNullOrWhiteSpace(p.TrangThai))
            query = query.Where(d => d.TrangThai == p.TrangThai);

        // Filter theo KhoaPhong cụ thể (phải nằm trong phạm vi user)
        if (p.KhoaPhongId.HasValue)
        {
            if (!userKhoaPhongIds.Contains(p.KhoaPhongId.Value))
                throw new ForbiddenException("Bạn không có quyền xem đề xuất của khoa/phòng này.");
            query = query.Where(d => d.KhoaPhongId == p.KhoaPhongId.Value);
        }

        // Search theo tiêu đề
        if (!string.IsNullOrWhiteSpace(p.TuKhoa))
            query = query.Where(d => d.TieuDe.Contains(p.TuKhoa));

        // Filter date range
        if (p.TuNgay.HasValue)
            query = query.Where(d => d.NgayDeXuat >= p.TuNgay.Value);
        if (p.DenNgay.HasValue)
            query = query.Where(d => d.NgayDeXuat <= p.DenNgay.Value);

        // Order by mới nhất
        query = query.OrderByDescending(d => d.NgayDeXuat);

        var total = await query.CountAsync();
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(d => MapToResponseDto(d, includeChiTiet: false))
            .ToListAsync();

        return new PagedResult<DeXuatResponseDto>
        {
            Items = items,
            Total = total,
            Page = p.Page,
            PageSize = p.PageSize
        };
    }

    // ──────────────────────────────────────────────
    // GET BY ID — include chi tiết
    // ──────────────────────────────────────────────
    public async Task<DeXuatResponseDto> GetByIdAsync(long id, int userId)
    {
        var deXuat = await _context.DeXuatMuaSams
            .Where(d => d.Id == id && !d.DaXoa)
            .Include(d => d.KhoaPhong)
            .Include(d => d.NguoiDeXuat)
            .Include(d => d.ChiTiet)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"Không tìm thấy đề xuất với Id = {id}");

        await EnsureUserCanViewAsync(userId, deXuat.KhoaPhongId);

        return MapToResponseDto(deXuat, includeChiTiet: true);
    }

    // ──────────────────────────────────────────────
    // CREATE — Serializable transaction chống race condition
    // ──────────────────────────────────────────────
    public async Task<DeXuatResponseDto> CreateAsync(CreateDeXuatDto dto, int userId)
    {
        // Validate KhoaPhong
        var khoaPhong = await _context.KhoaPhongs.FindAsync(dto.KhoaPhongId)
            ?? throw new BadRequestException($"Khoa/Phòng với Id = {dto.KhoaPhongId} không tồn tại.");
        if (khoaPhong.DaXoa)
            throw new BadRequestException("Khoa/Phòng đã bị xóa, không thể tạo đề xuất.");

        // Validate user thuộc KhoaPhong
        var userBelongs = await _context.NguoiDungKhoaPhongVaiTros
            .AnyAsync(r => r.NguoiDungId == userId && r.KhoaPhongId == dto.KhoaPhongId);
        if (!userBelongs)
            throw new ForbiddenException("Bạn không thuộc khoa/phòng này, không thể tạo đề xuất.");

        // Tính TongDuToan server-side
        var tongDuToan = dto.ChiTiet.Sum(c => c.SoLuong * c.DonGiaDuToan);

        // ExecutionStrategy + Serializable transaction
        var strategy = _context.Database.CreateExecutionStrategy();
        DeXuatMuaSam? created = null;

        await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database
                .BeginTransactionAsync(IsolationLevel.Serializable);

            try
            {
                // Sinh MaDeXuat trong transaction Serializable
                var maDeXuat = await GenerateMaDeXuatAsync();

                var deXuat = new DeXuatMuaSam
                {
                    MaDeXuat = maDeXuat,
                    TieuDe = InputSanitizer.Sanitize(dto.TieuDe),
                    MoTa = dto.MoTa != null ? InputSanitizer.Sanitize(dto.MoTa) : null,
                    KhoaPhongId = dto.KhoaPhongId,
                    NguoiDeXuatId = userId,
                    TongDuToan = tongDuToan,
                    TrangThai = "DRAFT",
                    NgayDeXuat = DateTime.UtcNow
                };

                _context.DeXuatMuaSams.Add(deXuat);
                await _context.SaveChangesAsync();

                // Insert chi tiết
                var chiTiets = dto.ChiTiet.Select(c => new ChiTietDeXuat
                {
                    DeXuatId = deXuat.Id,
                    MaVatTu = InputSanitizer.Sanitize(c.MaVatTu),
                    TenVatTu = InputSanitizer.Sanitize(c.TenVatTu),
                    DonViTinh = c.DonViTinh != null ? InputSanitizer.Sanitize(c.DonViTinh) : null,
                    SoLuong = c.SoLuong,
                    DonGiaDuToan = c.DonGiaDuToan
                }).ToList();

                _context.ChiTietDeXuats.AddRange(chiTiets);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                created = deXuat;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });

        // Reload với navigation properties
        return await GetByIdAsync(created!.Id, userId);
    }

    // ──────────────────────────────────────────────
    // UPDATE — chỉ DRAFT + owner, transaction
    // ──────────────────────────────────────────────
    public async Task<DeXuatResponseDto> UpdateAsync(long id, UpdateDeXuatDto dto, int userId)
    {
        var deXuat = await _context.DeXuatMuaSams
            .Where(d => d.Id == id && !d.DaXoa)
            .Include(d => d.ChiTiet)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"Không tìm thấy đề xuất với Id = {id}");

        if (deXuat.TrangThai != "DRAFT")
            throw new ConflictException("Chỉ được sửa đề xuất ở trạng thái DRAFT.");

        if (deXuat.NguoiDeXuatId != userId)
            throw new ForbiddenException("Chỉ người tạo mới có quyền sửa đề xuất này.");

        var strategy = _context.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Xóa chi tiết cũ
                _context.ChiTietDeXuats.RemoveRange(deXuat.ChiTiet);

                // Thêm chi tiết mới
                var chiTiets = dto.ChiTiet.Select(c => new ChiTietDeXuat
                {
                    DeXuatId = deXuat.Id,
                    MaVatTu = InputSanitizer.Sanitize(c.MaVatTu),
                    TenVatTu = InputSanitizer.Sanitize(c.TenVatTu),
                    DonViTinh = c.DonViTinh != null ? InputSanitizer.Sanitize(c.DonViTinh) : null,
                    SoLuong = c.SoLuong,
                    DonGiaDuToan = c.DonGiaDuToan
                }).ToList();

                _context.ChiTietDeXuats.AddRange(chiTiets);

                // Tính lại TongDuToan
                deXuat.TieuDe = InputSanitizer.Sanitize(dto.TieuDe);
                deXuat.MoTa = dto.MoTa != null ? InputSanitizer.Sanitize(dto.MoTa) : null;
                deXuat.TongDuToan = dto.ChiTiet.Sum(c => c.SoLuong * c.DonGiaDuToan);
                deXuat.NgayCapNhat = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });

        return await GetByIdAsync(id, userId);
    }

    // ──────────────────────────────────────────────
    // DELETE — soft delete, chỉ DRAFT + owner
    // ──────────────────────────────────────────────
    public async Task DeleteAsync(long id, int userId)
    {
        var deXuat = await _context.DeXuatMuaSams
            .Where(d => d.Id == id && !d.DaXoa)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"Không tìm thấy đề xuất với Id = {id}");

        if (deXuat.TrangThai != "DRAFT")
            throw new ConflictException("Chỉ được xóa đề xuất ở trạng thái DRAFT.");

        if (deXuat.NguoiDeXuatId != userId)
            throw new ForbiddenException("Chỉ người tạo mới có quyền xóa đề xuất này.");

        deXuat.DaXoa = true;
        deXuat.NgayCapNhat = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    // ──────────────────────────────────────────────
    // GET CHI TIẾT — danh sách vật tư của 1 đề xuất
    // ──────────────────────────────────────────────
    public async Task<List<ChiTietResponseDto>> GetChiTietAsync(long id, int userId)
    {
        var deXuat = await _context.DeXuatMuaSams
            .Where(d => d.Id == id && !d.DaXoa)
            .FirstOrDefaultAsync()
            ?? throw new NotFoundException($"Không tìm thấy đề xuất với Id = {id}");

        await EnsureUserCanViewAsync(userId, deXuat.KhoaPhongId);

        return await _context.ChiTietDeXuats
            .Where(c => c.DeXuatId == id)
            .Select(c => new ChiTietResponseDto
            {
                Id = c.Id,
                MaVatTu = c.MaVatTu,
                TenVatTu = c.TenVatTu,
                DonViTinh = c.DonViTinh,
                SoLuong = c.SoLuong,
                DonGiaDuToan = c.DonGiaDuToan,
                ThanhTien = c.SoLuong * c.DonGiaDuToan  // Tính trong code, không phụ thuộc EF reload
            })
            .ToListAsync();
    }

    // ══════════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════════

    /// <summary>
    /// Sinh MaDeXuat = DX-{year}-{seq padded 4 số}.
    /// Phải gọi TRONG transaction Serializable đã mở sẵn bởi caller.
    /// </summary>
    private async Task<string> GenerateMaDeXuatAsync()
    {
        return await QLQTDT.Api.Helpers.CodeGenerator.GenerateMaDeXuatAsync(_context);
    }

    /// <summary>
    /// Lấy danh sách KhoaPhongId mà user được gán qua NguoiDung_KhoaPhong_VaiTro.
    /// </summary>
    private async Task<List<int>> GetUserKhoaPhongIdsAsync(int userId)
    {
        return await _context.NguoiDungKhoaPhongVaiTros
            .Where(r => r.NguoiDungId == userId && r.KhoaPhongId != null)
            .Select(r => r.KhoaPhongId!.Value)
            .Distinct()
            .ToListAsync();
    }

    /// <summary>
    /// Kiểm tra user có quyền xem đề xuất thuộc KhoaPhong này không.
    /// </summary>
    private async Task EnsureUserCanViewAsync(int userId, int khoaPhongId)
    {
        var userKhoaPhongIds = await GetUserKhoaPhongIdsAsync(userId);
        if (!userKhoaPhongIds.Contains(khoaPhongId))
            throw new ForbiddenException("Bạn không có quyền xem đề xuất của khoa/phòng này.");
    }

    /// <summary>
    /// Map entity sang response DTO. ThanhTien tính bằng code thay vì phụ thuộc EF reload.
    /// </summary>
    private static DeXuatResponseDto MapToResponseDto(DeXuatMuaSam d, bool includeChiTiet)
    {
        var dto = new DeXuatResponseDto
        {
            Id = d.Id,
            IdCongKhai = d.IdCongKhai,
            MaDeXuat = d.MaDeXuat,
            TieuDe = d.TieuDe,
            MoTa = d.MoTa,
            KhoaPhongId = d.KhoaPhongId,
            TenKhoaPhong = d.KhoaPhong.TenKhoaPhong,
            NguoiDeXuatId = d.NguoiDeXuatId,
            TenNguoiDeXuat = d.NguoiDeXuat.HoTen,
            TongDuToan = d.TongDuToan,
            TrangThai = d.TrangThai,
            NgayDeXuat = d.NgayDeXuat,
            NgayCapNhat = d.NgayCapNhat
        };

        if (includeChiTiet && d.ChiTiet.Any())
        {
            dto.ChiTiet = d.ChiTiet.Select(c => new ChiTietResponseDto
            {
                Id = c.Id,
                MaVatTu = c.MaVatTu,
                TenVatTu = c.TenVatTu,
                DonViTinh = c.DonViTinh,
                SoLuong = c.SoLuong,
                DonGiaDuToan = c.DonGiaDuToan,
                ThanhTien = c.SoLuong * c.DonGiaDuToan
            }).ToList();
        }

        return dto;
    }
}
