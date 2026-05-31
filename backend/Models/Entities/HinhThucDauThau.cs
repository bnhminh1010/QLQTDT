namespace QLQTDT.Api.Models.Entities;

public class HinhThucDauThau
{
    public int Id { get; set; }
    public string MaHinhThuc { get; set; } = null!;
    public string TenHinhThuc { get; set; } = null!;
    public decimal? HanMucToiDa { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;

    public ICollection<Workflow> Workflows { get; set; } = [];
}
