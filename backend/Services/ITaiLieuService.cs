using QLQTDT.Api.Models.DTOs.TaiLieu;

namespace QLQTDT.Api.Services;

public interface ITaiLieuService
{
    Task<List<TaiLieuUploadResultDto>> UploadAsync(
        List<IFormFile>? files, int? goiThauId, string? loaiTaiLieu, CancellationToken ct = default);

    Task<(Stream stream, string fileName, string contentType)> DownloadAsync(
        int id, CancellationToken ct = default);

    Task DeleteAsync(int id, CancellationToken ct = default);

    Task<List<TaiLieuDto>> GetListAsync(int? goiThauId, string? loaiTaiLieu);
}
