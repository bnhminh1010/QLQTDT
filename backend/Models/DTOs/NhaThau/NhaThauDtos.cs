namespace QLQTDT.Api.Models.DTOs.NhaThau;

public class CreateNhaThauDto
{
    public string MaSoThue { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? NguoiDaiDien { get; set; }
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
    public bool? TrangThaiHoatDong { get; set; }
    public int? NguoiDungId { get; set; }
}

public class UpdateNhaThauDto
{
    public string MaSoThue { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? NguoiDaiDien { get; set; }
    public string? Email { get; set; }
    public string? SoDienThoai { get; set; }
    public bool TrangThaiHoatDong { get; set; }
    public int? NguoiDungId { get; set; }
}
