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

    public string MoTaChiTiet { get; set; } = string.Empty;

    public int NguoiThucHienId { get; set; }

    public DateTime ThoiGianThucHien { get; set; } = DateTime.UtcNow;
}
