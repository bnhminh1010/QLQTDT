namespace QLQTDT.Api.Models.DTOs.Integration;

public class SyncRequest
{
    public string HeThong { get; set; } = null!;
    public string LoaiDongBo { get; set; } = null!;
    public DateTime? NgayTu { get; set; }
    public string? RequestPayload { get; set; }
}
