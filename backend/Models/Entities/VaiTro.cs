using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.Entities;

public class VaiTro
{
    public int Id { get; set; }

    [MaxLength(50)]
    public string MaVaiTro { get; set; } = null!;
    public string TenVaiTro { get; set; } = null!;
    public string? MoTa { get; set; }
    public bool DaXoa { get; set; }

    public ICollection<VaiTroQuyen> VaiTroQuyens { get; set; } = [];
    public ICollection<NguoiDungKhoaPhongVaiTro> NguoiDungKhoaPhongVaiTros { get; set; } = [];
}
