namespace QLQTDT.Api.Models.Entities;

public class NhaThau
{
    public int Id { get; set; }
    public string MaSoThue { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? NguoiDaiDien { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;

    // Liên kết với tài khoản người dùng khi nhà thầu đăng ký
    public int? NguoiDungId { get; set; }
    public NguoiDung? NguoiDung { get; set; }
}
