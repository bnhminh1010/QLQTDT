namespace QLQTDT.Api.Models.Entities;

public class NguoiDung
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string MatKhauHash { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? SoDienThoai { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;
    public bool DaXoa { get; set; }
    public DateTime? NgayDangNhapCuoi { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }

    public string? AvatarUrl { get; set; }

    // Navigation properties
    public ICollection<NguoiDungKhoaPhongVaiTro> NguoiDungKhoaPhongVaiTros { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
}
