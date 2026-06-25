using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace QLQTDT.Api.Models;

[Table("NhatKyKiemToan")]
public class NhatKyKiemToan
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public long Id { get; set; }

    public long? GoiThauId { get; set; }

    [MaxLength(100)]
    public string HanhDong { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Bang { get; set; }

    public long? BanGhiId { get; set; }

    public string? DuLieuCu { get; set; }

    public string? DuLieuMoi { get; set; }

    public string MoTaChiTiet { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? DiaChiIP { get; set; }

    public int NguoiThucHienId { get; set; }

    public DateTime ThoiGianThucHien { get; set; } = DateTime.UtcNow;
}
