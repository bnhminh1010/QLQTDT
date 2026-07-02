using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Services;
using System.Security.Claims;
using System.Text.Json;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly AppDbContext _db;
    private readonly IAuthStateInvalidator _authStateInvalidator;

    public AdminController(IAdminService adminService, AppDbContext db, IAuthStateInvalidator authStateInvalidator)
    {
        _adminService = adminService;
        _db = db;
        _authStateInvalidator = authStateInvalidator;
    }

    /// <summary>
    /// Lấy danh sách người dùng (phân trang, filter, tìm kiếm)
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(AdminUserListDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? trangThai = null,
        [FromQuery] string? search = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;

        var result = await _adminService.GetUsersAsync(page, pageSize, trangThai, search);
        return Ok(result);
    }

    [HttpGet("users/{idCongKhai:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserDetail(Guid idCongKhai)
    {
        var result = await _adminService.GetUserDetailAsync(idCongKhai);
        return Ok(result);
    }

    [HttpPut("users/{idCongKhai:guid}/approve")]
    public async Task<IActionResult> ApproveUser(Guid idCongKhai)
    {
        await _adminService.ApproveUserAsync(idCongKhai);
        return Ok(new MessageResponse { Message = "Phê duyệt tài khoản thành công." });
    }

    [HttpPut("users/{idCongKhai:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid idCongKhai)
    {
        await _adminService.BlockUserAsync(idCongKhai);
        return Ok(new MessageResponse { Message = "Khóa tài khoản thành công." });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserRequest request)
    {
        var entity = new NguoiDung
        {
            IdCongKhai = Guid.NewGuid(),
            HoTen = request.HoTen.Trim(),
            Email = request.Email.Trim(),
            TenDangNhap = request.TenDangNhap.Trim(),
            MatKhauHash = BCrypt.Net.BCrypt.HashPassword(request.MatKhau),
            SoDienThoai = request.SoDienThoai?.Trim(),
            TrangThaiHoatDong = true,
            NgayTao = DateTime.UtcNow
        };
        _db.NguoiDungs.Add(entity);
        await _db.SaveChangesAsync();

        // Gán KhoaPhong + VaiTro nếu có
        if (request.KhoaPhongId.HasValue && request.VaiTroId.HasValue)
        {
            var vaiTro = await _db.VaiTros.FindAsync(request.VaiTroId.Value);
            if (vaiTro?.MaVaiTro == "NHA_THAU")
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không thể gán vai trò Nhà thầu cho người dùng. Vai trò này chỉ dùng để tham chiếu." });

            var nkv = new NguoiDungKhoaPhongVaiTro
            {
                NguoiDungId = entity.Id,
                KhoaPhongId = request.KhoaPhongId.Value,
                VaiTroId = request.VaiTroId.Value,
                LaChinh = true
            };
            _db.NguoiDungKhoaPhongVaiTros.Add(nkv);
            await _db.SaveChangesAsync();
        }

        await WriteUserAuditAsync(entity.Id, "CREATE_USER", "Tạo người dùng");
        return Ok(new MessageResponse { Message = "Tạo người dùng thành công." });
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateAdminUserRequest request)
    {
        var user = await _db.NguoiDungs.FindAsync(id);
        if (user is null)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy người dùng." });

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var normalizedEmail = request.Email.Trim().ToLower();
            var emailExists = await _db.NguoiDungs
                .AnyAsync(u => u.Id != id && u.Email.ToLower() == normalizedEmail && !u.DaXoa);
            if (emailExists)
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Email đã được sử dụng trong hệ thống." });
        }

        if (request.HoTen != null) user.HoTen = request.HoTen.Trim();
        if (request.Email != null) user.Email = request.Email.Trim();
        if (request.SoDienThoai != null) user.SoDienThoai = request.SoDienThoai.Trim();
        user.NgayCapNhat = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await WriteUserAuditAsync(id, "UPDATE_USER", "Cập nhật thông tin người dùng");
        return Ok(new MessageResponse { Message = "Cập nhật người dùng thành công." });
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == id)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không thể xóa tài khoản của chính mình." });

        var user = await _db.NguoiDungs.FindAsync(id);
        if (user is null || user.DaXoa)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy người dùng." });

        var isAdmin = await _db.NguoiDungKhoaPhongVaiTros
            .AnyAsync(r => r.NguoiDungId == id && r.VaiTro.MaVaiTro == "ADMIN");
        if (isAdmin)
        {
            var activeAdminCount = await _db.NguoiDungKhoaPhongVaiTros
                .Where(r => r.VaiTro.MaVaiTro == "ADMIN"
                    && r.NguoiDung.TrangThaiHoatDong
                    && !r.NguoiDung.DaXoa)
                .Select(r => r.NguoiDungId)
                .Distinct()
                .CountAsync();
            if (activeAdminCount <= 1)
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Không thể xóa admin cuối cùng của hệ thống." });
        }

        user.DaXoa = true;
        user.TrangThaiHoatDong = false;
        user.NgayCapNhat = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _authStateInvalidator.RevokeUserAuthStateAsync(id);
        await WriteUserAuditAsync(id, "DELETE_USER", "Xóa người dùng");
        return Ok(new MessageResponse { Message = "Xóa người dùng thành công." });
    }

    [HttpGet("profile-change-requests")]
    [ProducesResponseType(typeof(List<ProfileChangeRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProfileChangeRequests([FromQuery] string status = ProfileChangeRequestStatus.Pending)
    {
        var normalizedStatus = string.IsNullOrWhiteSpace(status)
            ? ProfileChangeRequestStatus.Pending
            : status.Trim().ToUpperInvariant();

        var query = _db.YeuCauThayDoiThongTinNguoiDungs
            .Include(r => r.NguoiDung)
            .Include(r => r.NguoiXuLy)
            .AsQueryable();

        if (normalizedStatus != "ALL")
            query = query.Where(r => r.TrangThai == normalizedStatus);

        var items = await query
            .OrderByDescending(r => r.NgayTao)
            .Take(100)
            .ToListAsync();

        return Ok(items.Select(MapProfileChangeRequest).ToList());
    }

    [HttpPost("profile-change-requests/{idCongKhai:guid}/approve")]
    public async Task<IActionResult> ApproveProfileChangeRequest(Guid idCongKhai)
    {
        var actorId = GetCurrentUserId();
        if (!actorId.HasValue)
            return Unauthorized(new ApiErrorResponse { Status = 401, Error = "Yêu cầu chưa được xác thực." });

        var request = await _db.YeuCauThayDoiThongTinNguoiDungs
            .Include(r => r.NguoiDung)
            .FirstOrDefaultAsync(r => r.IdCongKhai == idCongKhai);
        if (request is null || request.NguoiDung is null)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy yêu cầu thay đổi thông tin." });
        if (request.TrangThai != ProfileChangeRequestStatus.Pending)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Yêu cầu này đã được xử lý." });

        var newValue = DeserializeSnapshot(request.GiaTriMoiJson);
        if (!string.IsNullOrWhiteSpace(newValue.Email))
        {
            var email = newValue.Email.Trim().ToLowerInvariant();
            var emailExists = await _db.NguoiDungs
                .AnyAsync(u => u.Id != request.NguoiDungId && !u.DaXoa && u.Email.ToLower() == email);
            if (emailExists)
                return BadRequest(new ApiErrorResponse { Status = 400, Error = "Email đã được sử dụng trong hệ thống." });
            request.NguoiDung.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(newValue.HoTen))
            request.NguoiDung.HoTen = newValue.HoTen.Trim();
        request.NguoiDung.SoDienThoai = string.IsNullOrWhiteSpace(newValue.SoDienThoai)
            ? null
            : newValue.SoDienThoai.Trim();
        request.NguoiDung.NgayCapNhat = DateTime.UtcNow;

        request.TrangThai = ProfileChangeRequestStatus.Approved;
        request.NguoiXuLyId = actorId.Value;
        request.NgayXuLy = DateTime.UtcNow;

        _db.ThongBaos.Add(new ThongBao
        {
            IdCongKhai = Guid.NewGuid(),
            NguoiDungId = request.NguoiDungId,
            LoaiThongBao = "PROFILE_CHANGE_APPROVED",
            TieuDe = "Yêu cầu thay đổi thông tin đã được duyệt",
            NoiDung = "Thông tin cá nhân của bạn đã được Quản trị viên cập nhật.",
            DaDoc = false,
            UrlDieuHuong = "/profile",
            NotificationKey = $"profile-change-approved:{request.Id}",
            NgayTao = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await WriteUserAuditAsync(request.NguoiDungId, "APPROVE_PROFILE_CHANGE_REQUEST", "Duyệt yêu cầu thay đổi thông tin người dùng");
        return Ok(new MessageResponse { Message = "Đã duyệt yêu cầu thay đổi thông tin." });
    }

    [HttpPost("profile-change-requests/{idCongKhai:guid}/reject")]
    public async Task<IActionResult> RejectProfileChangeRequest(Guid idCongKhai, [FromBody] RejectProfileChangeRequest? requestBody)
    {
        var actorId = GetCurrentUserId();
        if (!actorId.HasValue)
            return Unauthorized(new ApiErrorResponse { Status = 401, Error = "Yêu cầu chưa được xác thực." });
        if (string.IsNullOrWhiteSpace(requestBody?.LyDoTuChoi))
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Vui lòng nhập lý do từ chối." });

        var request = await _db.YeuCauThayDoiThongTinNguoiDungs
            .Include(r => r.NguoiDung)
            .FirstOrDefaultAsync(r => r.IdCongKhai == idCongKhai);
        if (request is null || request.NguoiDung is null)
            return NotFound(new ApiErrorResponse { Status = 404, Error = "Không tìm thấy yêu cầu thay đổi thông tin." });
        if (request.TrangThai != ProfileChangeRequestStatus.Pending)
            return BadRequest(new ApiErrorResponse { Status = 400, Error = "Yêu cầu này đã được xử lý." });

        request.TrangThai = ProfileChangeRequestStatus.Rejected;
        request.NguoiXuLyId = actorId.Value;
        request.NgayXuLy = DateTime.UtcNow;
        request.LyDoTuChoi = requestBody.LyDoTuChoi.Trim();

        _db.ThongBaos.Add(new ThongBao
        {
            IdCongKhai = Guid.NewGuid(),
            NguoiDungId = request.NguoiDungId,
            LoaiThongBao = "PROFILE_CHANGE_REJECTED",
            TieuDe = "Yêu cầu thay đổi thông tin bị từ chối",
            NoiDung = $"Lý do: {request.LyDoTuChoi}",
            DaDoc = false,
            UrlDieuHuong = "/profile",
            NotificationKey = $"profile-change-rejected:{request.Id}",
            NgayTao = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        await WriteUserAuditAsync(request.NguoiDungId, "REJECT_PROFILE_CHANGE_REQUEST", "Từ chối yêu cầu thay đổi thông tin người dùng");
        return Ok(new MessageResponse { Message = "Đã từ chối yêu cầu thay đổi thông tin." });
    }

    [HttpGet("users/{id}/audit-log")]
    public async Task<ActionResult<ApiResponse<List<UserAuditLogDto>>>> GetUserAuditLog(int id)
    {
        var marker = $"\"nguoiDungId\":{id}";
        var items = await _db.NhatKyKiemToans
            .Where(log => log.MoTaChiTiet.Contains(marker))
            .OrderByDescending(log => log.ThoiGianThucHien)
            .Take(50)
            .Select(log => new UserAuditLogDto
            {
                Id = log.Id,
                HanhDong = log.HanhDong,
                MoTaChiTiet = log.MoTaChiTiet,
                ThoiGianThucHien = log.ThoiGianThucHien,
                NguoiThucHienId = log.NguoiThucHienId,
            })
            .ToListAsync();

        return Ok(ApiResponse<List<UserAuditLogDto>>.Ok(items));
    }

    private async Task WriteUserAuditAsync(int userId, string action, string description)
    {
        var actorId = GetCurrentUserId();
        if (!actorId.HasValue) return;

        _db.NhatKyKiemToans.Add(new NhatKyKiemToan
        {
            HanhDong = action,
            MoTaChiTiet = JsonSerializer.Serialize(new
            {
                nguoiDungId = userId,
                moTa = description,
            }),
            NguoiThucHienId = actorId.Value,
            ThoiGianThucHien = BusinessClock.VietnamNow,
        });
        await _db.SaveChangesAsync();
    }

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : null;
    }

    private static readonly JsonSerializerOptions ProfileChangeJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static ProfileChangeRequestDto MapProfileChangeRequest(YeuCauThayDoiThongTinNguoiDung request)
    {
        return new ProfileChangeRequestDto
        {
            IdCongKhai = request.IdCongKhai,
            NguoiDungId = request.NguoiDungId,
            TenDangNhap = request.NguoiDung?.TenDangNhap ?? string.Empty,
            HoTenNguoiDung = request.NguoiDung?.HoTen ?? string.Empty,
            EmailNguoiDung = request.NguoiDung?.Email ?? string.Empty,
            TrangThai = request.TrangThai,
            GiaTriCu = DeserializeSnapshot(request.GiaTriCuJson),
            GiaTriMoi = DeserializeSnapshot(request.GiaTriMoiJson),
            NgayTao = request.NgayTao,
            NgayXuLy = request.NgayXuLy,
            NguoiXuLy = request.NguoiXuLy?.HoTen,
            LyDoTuChoi = request.LyDoTuChoi
        };
    }

    private static ProfileChangeSnapshotDto DeserializeSnapshot(string json)
    {
        return JsonSerializer.Deserialize<ProfileChangeSnapshotDto>(json, ProfileChangeJsonOptions) ?? new ProfileChangeSnapshotDto();
    }
}

public class UserAuditLogDto
{
    public long Id { get; set; }
    public string HanhDong { get; set; } = string.Empty;
    public string MoTaChiTiet { get; set; } = string.Empty;
    public DateTime ThoiGianThucHien { get; set; }
    public int NguoiThucHienId { get; set; }
}

public class CreateAdminUserRequest
{
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string TenDangNhap { get; set; } = null!;
    public string MatKhau { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public int? KhoaPhongId { get; set; }
    public int? VaiTroId { get; set; }
}

public class UpdateAdminUserRequest
{
    public string? HoTen { get; set; }
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
}
