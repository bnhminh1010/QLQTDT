namespace QLQTDT.Api.Services;

public interface IFtpService
{
    /// <summary>Upload stream len FTP, tu tao thu muc neu chua ton tai.</summary>
    Task<string> UploadAsync(Stream stream, string remotePath, CancellationToken ct = default);

    /// <summary>Download file tu FTP duoi dang MemoryStream.</summary>
    Task<Stream> DownloadAsync(string remotePath, CancellationToken ct = default);

    /// <summary>Xoa file tren FTP.</summary>
    Task DeleteAsync(string remotePath, CancellationToken ct = default);
}
