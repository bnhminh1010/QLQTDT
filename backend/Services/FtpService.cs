using System.Text.RegularExpressions;
using FluentFTP;
using FluentFTP.Exceptions;
using Microsoft.Extensions.Options;
using QLQTDT.Api.Exceptions;
using AppFtpConfig = QLQTDT.Api.Config.FtpConfig;

namespace QLQTDT.Api.Services;

public partial class FtpService : IFtpService
{
    private const int TimeoutMilliseconds = 15000;

    private readonly AppFtpConfig _config;
    private readonly ILogger<FtpService> _logger;

    public FtpService(IOptions<AppFtpConfig> options, ILogger<FtpService> logger)
    {
        _config = options.Value;
        _logger = logger;
    }

    public async Task<string> UploadAsync(Stream stream, string remotePath, CancellationToken ct = default)
    {
        if (stream is null)
        {
            throw new BadRequestException("Stream upload khong hop le.");
        }

        var normalizedPath = NormalizeRemotePath(remotePath);

        try
        {
            using var client = CreateClient();
            await client.Connect(ct);

            await client.UploadStream(stream, normalizedPath, createRemoteDir: true, token: ct);

            long? bytes = stream.CanSeek ? stream.Length : null;
            _logger.LogInformation("FTP upload completed: {RemotePath}, {Bytes} bytes", normalizedPath, bytes);
            return normalizedPath;
        }
        catch (FtpException ex) when (IsPermissionDenied(ex))
        {
            _logger.LogWarning(ex, "FTP upload permission denied: {RemotePath}", normalizedPath);
            throw new ForbiddenException("Khong co quyen upload file len FTP server.");
        }
    }

    public async Task<Stream> DownloadAsync(string remotePath, CancellationToken ct = default)
    {
        var normalizedPath = NormalizeRemotePath(remotePath);

        try
        {
            using var client = CreateClient();
            await client.Connect(ct);

            if (!await client.FileExists(normalizedPath, ct))
            {
                throw new NotFoundException("Khong tim thay file tren FTP server.");
            }

            var memoryStream = new MemoryStream();
            var downloaded = await client.DownloadStream(memoryStream, normalizedPath, token: ct);
            if (!downloaded)
            {
                await memoryStream.DisposeAsync();
                throw new NotFoundException("Khong tim thay file tren FTP server.");
            }

            memoryStream.Position = 0;
            _logger.LogInformation("FTP download completed: {RemotePath}, {Bytes} bytes", normalizedPath, memoryStream.Length);
            return memoryStream;
        }
        catch (FtpException ex) when (IsPermissionDenied(ex))
        {
            _logger.LogWarning(ex, "FTP download permission denied: {RemotePath}", normalizedPath);
            throw new ForbiddenException("Khong co quyen download file tu FTP server.");
        }
    }

    public async Task DeleteAsync(string remotePath, CancellationToken ct = default)
    {
        var normalizedPath = NormalizeRemotePath(remotePath);

        try
        {
            using var client = CreateClient();
            await client.Connect(ct);

            if (!await client.FileExists(normalizedPath, ct))
            {
                throw new NotFoundException("Khong tim thay file tren FTP server.");
            }

            await client.DeleteFile(normalizedPath, ct);
            _logger.LogInformation("FTP delete completed: {RemotePath}", normalizedPath);
        }
        catch (FtpException ex) when (IsPermissionDenied(ex))
        {
            _logger.LogWarning(ex, "FTP delete permission denied: {RemotePath}", normalizedPath);
            throw new ForbiddenException("Khong co quyen xoa file tren FTP server.");
        }
    }

    private AsyncFtpClient CreateClient()
    {
        var client = new AsyncFtpClient(_config.Server, _config.User, _config.Password, _config.Port);
        client.Config.DataConnectionType = _config.UsePassive
            ? FtpDataConnectionType.AutoPassive
            : FtpDataConnectionType.AutoActive;
        client.Config.EncryptionMode = ParseEncryptionMode(_config.EncryptionMode);
        client.Config.ConnectTimeout = TimeoutMilliseconds;
        client.Config.DataConnectionConnectTimeout = TimeoutMilliseconds;
        return client;
    }

    private string NormalizeRemotePath(string remotePath)
    {
        if (string.IsNullOrWhiteSpace(remotePath))
        {
            throw new BadRequestException("Duong dan FTP khong duoc de trong.");
        }

        var candidate = remotePath.Trim();
        if (candidate.Contains('\\'))
        {
            throw new BadRequestException("Duong dan FTP chi duoc dung dau '/' lam path separator.");
        }

        if (candidate.StartsWith('/') || candidate.Contains("//") || candidate.EndsWith('/'))
        {
            throw new BadRequestException("Duong dan FTP phai la duong dan tuong doi hop le.");
        }

        var segments = candidate.Split('/');
        if (segments.Any(segment => segment is "" or "." or ".."))
        {
            throw new BadRequestException("Duong dan FTP khong duoc chua thanh phan traversal.");
        }

        if (!RemotePathRegex().IsMatch(candidate))
        {
            throw new BadRequestException("Duong dan FTP chi duoc chua chu, so, '/', '-', '_' va '.'.");
        }

        var basePath = NormalizeBasePath(_config.BasePath);
        return $"{basePath}/{candidate}";
    }

    private static string NormalizeBasePath(string? basePath)
    {
        var normalized = string.IsNullOrWhiteSpace(basePath)
            ? "/qlqtdt/uploads"
            : basePath.Trim().Replace('\\', '/').TrimEnd('/');

        if (!normalized.StartsWith('/'))
        {
            normalized = "/" + normalized;
        }

        return normalized;
    }

    private static FtpEncryptionMode ParseEncryptionMode(string? value)
    {
        if (string.Equals(value, "Explicit", StringComparison.OrdinalIgnoreCase))
        {
            return FtpEncryptionMode.Explicit;
        }

        return FtpEncryptionMode.None;
    }

    private static bool IsPermissionDenied(FtpException ex)
    {
        var message = ex.Message;
        return message.Contains("permission", StringComparison.OrdinalIgnoreCase)
            || message.Contains("denied", StringComparison.OrdinalIgnoreCase)
            || message.Contains("unauthorized", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(@"^[A-Za-z0-9/_\-.]+$")]
    private static partial Regex RemotePathRegex();
}
