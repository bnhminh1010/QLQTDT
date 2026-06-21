namespace QLQTDT.Api.Models.Entities;

public class NhanhWorkflow
{
    public int Id { get; set; }
    public int NhomNhanhWorkflowId { get; set; }
    public string MaNhanh { get; set; } = null!;
    public string TenNhanh { get; set; } = null!;
    public int ThuTu { get; set; }
    public int? DonViXuLyId { get; set; }
    public int? VaiTroXuLyId { get; set; }
    public decimal ThoiHanNgay { get; set; }
    public string LoaiHan { get; set; } = "CANH_BAO";       // BAT_BUOC / CANH_BAO
    public int BuocDauTienId { get; set; }

    // Navigation
    public NhomNhanhWorkflow? NhomNhanhWorkflow { get; set; }
    public KhoaPhong? DonViXuLy { get; set; }
    public VaiTro? VaiTroXuLy { get; set; }
    public BuocWorkflow? BuocDauTien { get; set; }
    public ICollection<BuocWorkflow> BuocWorkflows { get; set; } = [];
}
