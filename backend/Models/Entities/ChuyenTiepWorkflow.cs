namespace QLQTDT.Api.Models.Entities;

public class ChuyenTiepWorkflow : IBaseEntity
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }

    public BuocWorkflow? TuBuoc { get; set; }
    public BuocWorkflow? DenBuoc { get; set; }
}
