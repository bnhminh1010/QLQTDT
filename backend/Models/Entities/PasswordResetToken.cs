namespace QLQTDT.Api.Models.Entities;

public class PasswordResetToken
{
    public long Id { get; set; }
    public string Token { get; set; } = null!;

    public int NguoiDungId { get; set; }
    public NguoiDung NguoiDung { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }
    public bool Used { get; set; }
    public DateTime CreatedAt { get; set; }
}
