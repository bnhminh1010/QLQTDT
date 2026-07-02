using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.DTOs.Rbac;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly ILogger<UserService> _logger;
    private readonly IAuthStateInvalidator _authStateInvalidator;

    public UserService(AppDbContext context, ILogger<UserService> logger, IAuthStateInvalidator authStateInvalidator)
    {
        _context = context;
        _logger = logger;
        _authStateInvalidator = authStateInvalidator;
    }

    public async Task AssignRoleAsync(int userId, AssignRoleRequest request)
    {
        var userExists = await _context.NguoiDungs.AnyAsync(u => u.Id == userId);
        if (!userExists)
            throw new NotFoundException($"Không tìm thấy người dùng với Id = {userId}");

        var khoaPhongExists = await _context.KhoaPhongs.AnyAsync(k => k.Id == request.KhoaPhongId && !k.DaXoa);
        if (!khoaPhongExists)
            throw new NotFoundException($"Không tìm thấy khoa/phòng với Id = {request.KhoaPhongId}");

        var vaiTroExists = await _context.VaiTros.AnyAsync(v => v.Id == request.VaiTroId && !v.DaXoa);
        if (!vaiTroExists)
            throw new NotFoundException($"Không tìm thấy vai trò với Id = {request.VaiTroId}");

        var vaiTro = await _context.VaiTros.FindAsync(request.VaiTroId);
        if (vaiTro?.MaVaiTro == "NHA_THAU")
            throw new BadRequestException("Không thể gán vai trò Nhà thầu cho người dùng. Vai trò này chỉ dùng để tham chiếu.");

        var isDuplicate = await _context.NguoiDungKhoaPhongVaiTros.AnyAsync(
            nkv => nkv.NguoiDungId == userId
                && nkv.KhoaPhongId == request.KhoaPhongId
                && nkv.VaiTroId == request.VaiTroId);
        if (isDuplicate)
            throw new ConflictException("Người dùng đã có vai trò này trong khoa/phòng này");

        _context.NguoiDungKhoaPhongVaiTros.Add(new NguoiDungKhoaPhongVaiTro
        {
            NguoiDungId = userId,
            KhoaPhongId = request.KhoaPhongId,
            VaiTroId = request.VaiTroId,
            LaChinh = request.LaChinh
        });

        await _context.SaveChangesAsync();
        await _authStateInvalidator.RevokeUserAuthStateAsync(userId);
        _logger.LogInformation("Assign role: user={UserId}, khoaPhong={KhoaPhongId}, vaiTro={VaiTroId}",
            userId, request.KhoaPhongId, request.VaiTroId);
    }

    public async Task<List<UserRoleDto>> GetRolesAsync(int userId)
    {
        var userExists = await _context.NguoiDungs.AnyAsync(u => u.Id == userId);
        if (!userExists)
            throw new NotFoundException($"Không tìm thấy người dùng với Id = {userId}");

        return await _context.NguoiDungKhoaPhongVaiTros
            .Where(nkv => nkv.NguoiDungId == userId)
            .Include(nkv => nkv.KhoaPhong)
            .Include(nkv => nkv.VaiTro)
            .Select(nkv => new UserRoleDto
            {
                KhoaPhongId = nkv.KhoaPhongId,
                TenKhoaPhong = nkv.KhoaPhong != null ? nkv.KhoaPhong.TenKhoaPhong : null,
                MaKhoaPhong = nkv.KhoaPhong != null ? nkv.KhoaPhong.MaKhoaPhong : null,
                VaiTroId = nkv.VaiTroId,
                TenVaiTro = nkv.VaiTro.TenVaiTro,
                LaChinh = nkv.LaChinh
            })
            .ToListAsync();
    }

    public async Task RemoveRoleAsync(int assignmentId)
    {
        var assignment = await _context.NguoiDungKhoaPhongVaiTros.FindAsync(assignmentId)
            ?? throw new NotFoundException($"Không tìm thấy phân vai trò với Id = {assignmentId}");

        var userId = assignment.NguoiDungId;
        _context.NguoiDungKhoaPhongVaiTros.Remove(assignment);
        await _context.SaveChangesAsync();
        await _authStateInvalidator.RevokeUserAuthStateAsync(userId);
        _logger.LogInformation("Remove role assignment: id={AssignmentId}", assignmentId);
    }
}
