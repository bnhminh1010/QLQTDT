namespace QLQTDT.Api.Models.Entities;

public class NhomVaiTro
{
    public int Id { get; set; }

    /// <summary>MaNhom: "CAP_CAO", "TRUNG_BINH", "THAP"</summary>
    public string MaNhom { get; set; } = null!;
    public string TenNhom { get; set; } = null!;
    public int DoUuTien { get; set; }
    public string? MoTa { get; set; }
    public bool DaXoa { get; set; }

    public ICollection<VaiTro> VaiTros { get; set; } = [];
}
