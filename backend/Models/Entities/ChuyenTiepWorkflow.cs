namespace QLQTDT.Api.Models.Entities;

public class ChuyenTiepWorkflow
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public BuocWorkflow TuBuoc { get; set; } = null!;
    public int DenBuocId { get; set; }
    public BuocWorkflow DenBuoc { get; set; } = null!;
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }
}
