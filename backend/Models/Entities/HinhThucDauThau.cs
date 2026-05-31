namespace QLQTDT.Api.Models.Entities;

public class HinhThucDauThau : IBaseEntity
{
    public int Id { get; set; }
    public string MaHinhThuc { get; set; } = null!;
    public string TenHinhThuc { get; set; } = null!;
    public decimal? HanMucToiDa { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;
}
