namespace QLQTDT.Api.Models.DTOs.HinhThucDauThau;

public class CreateHinhThucDauThauDto
{
    public string MaHinhThuc { get; set; } = null!;
    public string TenHinhThuc { get; set; } = null!;
    public decimal? HanMucToiDa { get; set; }
}

public class UpdateHinhThucDauThauDto
{
    public string? TenHinhThuc { get; set; }
    public decimal? HanMucToiDa { get; set; }
    public bool? TrangThaiHoatDong { get; set; }
}
