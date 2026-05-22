using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Auth;

namespace QLQTDT.Api.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminService> _logger;

    public AdminService(AppDbContext context, ILogger<AdminService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AdminUserListDto> GetUsersAsync(int page, int pageSize, bool? trangThai, string? search)
    {
        var query = _context.NguoiDungs.AsQueryable();

        // Filter theo trạng thái hoạt động
        if (trangThai.HasValue)
        {
            query = query.Where(u => u.TrangThaiHoatDong == trangThai.Value);
        }

        // Tìm kiếm theo tên, email, tên đăng nhập
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLowerInvariant();
            query = query.Where(u =>
                u.HoTen.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower) ||
                u.TenDangNhap.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.NgayTao)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserItemDto
            {
                IdCongKhai = u.IdCongKhai,
                TenDangNhap = u.TenDangNhap,
                HoTen = u.HoTen,
                Email = u.Email,
                TrangThaiHoatDong = u.TrangThaiHoatDong,
                NgayTao = u.NgayTao,
                Roles = u.NguoiDungKhoaPhongVaiTros
                    .Select(r => new UserRoleDto
                    {
                        KhoaPhongId = r.KhoaPhongId,
                        TenKhoaPhong = r.KhoaPhong != null ? r.KhoaPhong.TenKhoaPhong : null,
                        MaKhoaPhong = r.KhoaPhong != null ? r.KhoaPhong.MaKhoaPhong : null,
                        VaiTroId = r.VaiTroId,
                        TenVaiTro = r.VaiTro.TenVaiTro,
                        LaChinh = r.LaChinh
                    }).ToList(),
                // LEFT JOIN thông tin nhà thầu
                TenCongTy = _context.NhaThaus
                    .Where(n => n.NguoiDungId == u.Id)
                    .Select(n => n.TenCongTy)
                    .FirstOrDefault(),
                MaSoThue = _context.NhaThaus
                    .Where(n => n.NguoiDungId == u.Id)
                    .Select(n => n.MaSoThue)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return new AdminUserListDto
        {
            Data = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminUserDetailDto> GetUserDetailAsync(Guid idCongKhai)
    {
        var user = await _context.NguoiDungs
            .Include(u => u.NguoiDungKhoaPhongVaiTros)
                .ThenInclude(r => r.VaiTro)
            .Include(u => u.NguoiDungKhoaPhongVaiTros)
                .ThenInclude(r => r.KhoaPhong)
            .FirstOrDefaultAsync(u => u.IdCongKhai == idCongKhai)
            ?? throw new NotFoundException($"Không tìm thấy người dùng với ID: {idCongKhai}");

        // Lấy thông tin nhà thầu nếu có
        var nhaThau = await _context.NhaThaus
            .FirstOrDefaultAsync(n => n.NguoiDungId == user.Id);

        return new AdminUserDetailDto
        {
            IdCongKhai = user.IdCongKhai,
            TenDangNhap = user.TenDangNhap,
            HoTen = user.HoTen,
            Email = user.Email,
            TrangThaiHoatDong = user.TrangThaiHoatDong,
            NgayTao = user.NgayTao,
            AvatarUrl = user.AvatarUrl,
            Roles = user.NguoiDungKhoaPhongVaiTros.Select(r => new UserRoleDto
            {
                KhoaPhongId = r.KhoaPhongId,
                TenKhoaPhong = r.KhoaPhong?.TenKhoaPhong,
                MaKhoaPhong = r.KhoaPhong?.MaKhoaPhong,
                VaiTroId = r.VaiTroId,
                TenVaiTro = r.VaiTro.TenVaiTro,
                LaChinh = r.LaChinh
            }).ToList(),
            NhaThau = nhaThau != null ? new AdminNhaThauDto
            {
                MaSoThue = nhaThau.MaSoThue,
                TenCongTy = nhaThau.TenCongTy,
                DiaChi = nhaThau.DiaChi,
                NguoiDaiDien = nhaThau.NguoiDaiDien,
                TrangThaiHoatDong = nhaThau.TrangThaiHoatDong
            } : null
        };
    }

    public async Task ApproveUserAsync(Guid idCongKhai)
    {
        var user = await _context.NguoiDungs
            .FirstOrDefaultAsync(u => u.IdCongKhai == idCongKhai)
            ?? throw new NotFoundException($"Không tìm thấy người dùng với ID: {idCongKhai}");

        if (user.TrangThaiHoatDong)
            throw new BadRequestException("Tài khoản này đã được kích hoạt trước đó.");

        user.TrangThaiHoatDong = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin đã phê duyệt tài khoản: {TenDangNhap} (ID: {IdCongKhai})", user.TenDangNhap, idCongKhai);
    }

    public async Task BlockUserAsync(Guid idCongKhai)
    {
        var user = await _context.NguoiDungs
            .FirstOrDefaultAsync(u => u.IdCongKhai == idCongKhai)
            ?? throw new NotFoundException($"Không tìm thấy người dùng với ID: {idCongKhai}");

        if (!user.TrangThaiHoatDong)
            throw new BadRequestException("Tài khoản này đã bị khóa trước đó.");

        user.TrangThaiHoatDong = false;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin đã khóa tài khoản: {TenDangNhap} (ID: {IdCongKhai})", user.TenDangNhap, idCongKhai);
    }
}
