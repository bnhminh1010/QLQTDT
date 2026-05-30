namespace QLQTDT.Api.Models.Entities;

public class WorkflowInstance
{
    public int Id { get; set; }
    public long GioThauId { get; set; }
    public int BuocQuyTrinhId { get; set; }
    public int? NguoiXuLyId { get; set; }
    public string TrangThaiBuoc { get; set; } = null!;
    public DateTime? NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }
    public int QuyTrinhId { get; set; }
}
