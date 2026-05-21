namespace QLQTDT.Api.Models.Entities;

public class NguoiDung
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string TenDangNhap { get; set; } = null!;
    public string MatKhauHash { get; set; } = null!;
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool TrangThaiHoatDong { get; set; } = true;
    public DateTime NgayTao { get; set; }

    // Google OAuth
    public string? GoogleId { get; set; }
    public string? AvatarUrl { get; set; }

    // Navigation properties
    public ICollection<NguoiDungKhoaPhongVaiTro> NguoiDungKhoaPhongVaiTros { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
}
