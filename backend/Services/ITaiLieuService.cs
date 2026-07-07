using QLQTDT.Api.Models.DTOs.TaiLieu;

namespace QLQTDT.Api.Services;

public interface ITaiLieuService
{
    Task<List<TaiLieuUploadResultDto>> UploadAsync(
        List<IFormFile>? files, int? goiThauId, long? workflowStepInstanceId, string? loaiTaiLieu, string? documentPhase, CancellationToken ct = default);

    Task<(Stream stream, string fileName, string contentType)> DownloadAsync(
        int id, CancellationToken ct = default);

    Task DeleteAsync(int id, CancellationToken ct = default);

    Task<List<TaiLieuDto>> GetListAsync(int? goiThauId, long? workflowStepInstanceId, string? loaiTaiLieu, string? documentPhase);
}
