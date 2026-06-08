using Microsoft.AspNetCore.Http;

namespace QLQTDT.Api.Models.DTOs.NhaThau;

public class UploadHoSoNangLucDto
{
    public IFormFile? File { get; set; }
    public DateTime? NgayHetHan { get; set; }
}

public class HoSoNangLucDto
{
    public long Id { get; set; }
    public int NhaThauId { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string TenFile { get; set; } = null!;
    public string DuongDanFile { get; set; } = null!;
    public DateTime? NgayHetHan { get; set; }
}
