namespace QLQTDT.Api.Models.Entities;

public class NhaThau
{
    public int Id { get; set; }
    public string MaSoThue { get; set; } = null!;
    public string TenCongTy { get; set; } = null!;
    public string? DiaChi { get; set; }
    public string? NguoiDaiDien { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;
}
