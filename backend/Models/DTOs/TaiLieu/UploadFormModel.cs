using Microsoft.AspNetCore.Http;

namespace QLQTDT.Api.Models.DTOs.TaiLieu;

public class UploadFormModel
{
    public List<IFormFile>? Files { get; set; }
    public int? GoiThauId { get; set; }
    public string? LoaiTaiLieu { get; set; }
}
