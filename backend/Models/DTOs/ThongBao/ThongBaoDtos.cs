namespace QLQTDT.Api.Models.DTOs.ThongBao;

public class ThongBaoListItemDto
{
    public Guid IdCongKhai { get; set; }
    public string? LoaiThongBao { get; set; }
    public string TieuDe { get; set; } = null!;
    public string? NoiDung { get; set; }
    public bool DaDoc { get; set; }
    public string? UrlDieuHuong { get; set; }
    public DateTime NgayTao { get; set; }
}

public class ThongBaoListResponse
{
    public int TotalCount { get; set; }
    public List<ThongBaoListItemDto> Items { get; set; } = [];
}
