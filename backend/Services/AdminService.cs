using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.Entities;
using System.Security.Claims;

namespace QLQTDT.Api.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminService(AppDbContext context, ILogger<AdminService> logger, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<AdminUserListDto> GetUsersAsync(int page, int pageSize, bool? trangThai, string? search)
    {
        var query = _context.NguoiDungs
            .Where(u => !u.DaXoa)
            .AsQueryable();

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
                Id = u.Id,
                IdCongKhai = u.IdCongKhai,
                TenDangNhap = u.TenDangNhap,
                HoTen = u.HoTen,
                Email = u.Email,
                SoDienThoai = u.SoDienThoai,
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
                Quyen = u.NguoiDungKhoaPhongVaiTros
                    .SelectMany(r => r.VaiTro.VaiTroQuyens)
                    .Where(vq => !vq.Quyen.DaXoa)
                    .Select(vq => vq.Quyen.MaQuyen)
                    .Distinct()
                    .OrderBy(maQuyen => maQuyen)
                    .ToList(),
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
            .FirstOrDefaultAsync(u => u.IdCongKhai == idCongKhai && !u.DaXoa)
            ?? throw new NotFoundException($"Không tìm thấy người dùng với ID: {idCongKhai}");

        // Thông tin nhà thầu không còn gắn với user (NhaThau info only)
        NhaThau? nhaThau = null;

        return new AdminUserDetailDto
        {
            IdCongKhai = user.IdCongKhai,
            TenDangNhap = user.TenDangNhap,
            HoTen = user.HoTen,
            Email = user.Email,
            SoDienThoai = user.SoDienThoai,
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
            Quyen = user.NguoiDungKhoaPhongVaiTros
                .SelectMany(r => r.VaiTro.VaiTroQuyens)
                .Where(vq => !vq.Quyen.DaXoa)
                .Select(vq => vq.Quyen.MaQuyen)
                .Distinct()
                .OrderBy(maQuyen => maQuyen)
                .ToList(),
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

        // Prevent self-block
        var currentUserId = GetCurrentUserId();
        if (currentUserId.HasValue && user.Id == currentUserId.Value)
            throw new BadRequestException("Không thể tự khóa tài khoản của chính mình.");

        // Prevent blocking last admin
        var adminCount = await _context.NguoiDungKhoaPhongVaiTros
            .Where(r => r.VaiTro.TenVaiTro == "ADMIN" && r.NguoiDung.TrangThaiHoatDong)
            .Select(r => r.NguoiDungId)
            .Distinct()
            .CountAsync();
        if (adminCount <= 1)
            throw new BadRequestException("Không thể khóa admin cuối cùng của hệ thống.");

        user.TrangThaiHoatDong = false;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin đã khóa tài khoản: {TenDangNhap} (ID: {IdCongKhai})", user.TenDangNhap, idCongKhai);
    }

    private int? GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : null;
    }
}
