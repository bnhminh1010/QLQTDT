namespace QLQTDT.Api.Models.Entities;

public class IntegrationLog
{
    public long Id { get; set; }
    public string HeThong { get; set; } = null!;
    public string LoaiDongBo { get; set; } = null!;
    public string? RequestPayload { get; set; }
    public string? ResponsePayload { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime ThoiGianDongBo { get; set; }
}
