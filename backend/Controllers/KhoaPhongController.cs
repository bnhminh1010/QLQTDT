using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Common;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/khoa-phong")]
public class KhoaPhongController : ControllerBase
{
    private readonly AppDbContext _db;

    public KhoaPhongController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<KhoaPhongDto>>>> GetAll()
    {
        var items = await _db.KhoaPhongs
            .Where(k => !k.DaXoa)
            .Select(k => new KhoaPhongDto
            {
                Id = k.Id,
                IdCongKhai = k.IdCongKhai,
                TenKhoaPhong = k.TenKhoaPhong,
                MaKhoaPhong = k.MaKhoaPhong,
                TrangThaiHoatDong = !k.DaXoa
            })
            .ToListAsync();

        return Ok(ApiResponse<List<KhoaPhongDto>>.Ok(items));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<KhoaPhongDto>>> GetById(int id)
    {
        var item = await _db.KhoaPhongs.FindAsync(id);
        if (item is null || item.DaXoa)
            return NotFound(ApiResponse<KhoaPhongDto>.Fail("Không tìm thấy khoa phòng."));

        return Ok(ApiResponse<KhoaPhongDto>.Ok(new KhoaPhongDto
        {
            Id = item.Id,
            IdCongKhai = item.IdCongKhai,
            TenKhoaPhong = item.TenKhoaPhong,
            MaKhoaPhong = item.MaKhoaPhong,
            TrangThaiHoatDong = !item.DaXoa
        }));
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse<KhoaPhongDto>>> Create([FromBody] KhoaPhongCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TenKhoaPhong))
            return BadRequest(ApiResponse<KhoaPhongDto>.Fail("Tên khoa phòng là bắt buộc."));

        var entity = new KhoaPhong
        {
            IdCongKhai = Guid.NewGuid(),
            TenKhoaPhong = request.TenKhoaPhong.Trim(),
            MaKhoaPhong = request.MaKhoaPhong?.Trim() ?? "",
            DaXoa = false
        };

        _db.KhoaPhongs.Add(entity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entity.Id },
            ApiResponse<KhoaPhongDto>.Ok(new KhoaPhongDto
            {
                Id = entity.Id,
                IdCongKhai = entity.IdCongKhai,
                TenKhoaPhong = entity.TenKhoaPhong,
                MaKhoaPhong = entity.MaKhoaPhong,
                TrangThaiHoatDong = true
            }, "Tạo khoa phòng thành công"));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] KhoaPhongUpdateRequest request)
    {
        var entity = await _db.KhoaPhongs.FindAsync(id);
        if (entity is null || entity.DaXoa)
            return NotFound(ApiResponse.Fail("Không tìm thấy khoa phòng."));

        if (request.TenKhoaPhong != null)
            entity.TenKhoaPhong = request.TenKhoaPhong.Trim();
        if (request.MaKhoaPhong != null)
            entity.MaKhoaPhong = request.MaKhoaPhong.Trim();

        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Cập nhật khoa phòng thành công"));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        var entity = await _db.KhoaPhongs.FindAsync(id);
        if (entity is null || entity.DaXoa)
            return NotFound(ApiResponse.Fail("Không tìm thấy khoa phòng."));

        var hasUsers = await _db.NguoiDungKhoaPhongVaiTros
            .AnyAsync(nkv => nkv.KhoaPhongId == id
                && nkv.NguoiDung.TrangThaiHoatDong
                && !nkv.NguoiDung.DaXoa);
        if (hasUsers)
            return Conflict(ApiResponse.Fail("Không thể xóa khoa/phòng đang có người dùng. Vui lòng chuyển người dùng sang khoa/phòng khác trước."));

        entity.DaXoa = true;
        await _db.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Xóa khoa phòng thành công"));
    }
}

public class KhoaPhongDto
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string TenKhoaPhong { get; set; } = null!;
    public string? MaKhoaPhong { get; set; }
    public bool TrangThaiHoatDong { get; set; }
}

public class KhoaPhongCreateRequest
{
    public string TenKhoaPhong { get; set; } = null!;
    public string? MaKhoaPhong { get; set; }
}

public class KhoaPhongUpdateRequest
{
    public string? TenKhoaPhong { get; set; }
    public string? MaKhoaPhong { get; set; }
}
