using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.TaiLieu;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public partial class TaiLieuService : ITaiLieuService
{
    private const long MaxFileSizeBytes = 50 * 1024 * 1024; // 50MB
    private const int MaxFilesPerRequest = 10;

    private readonly AppDbContext _db;
    private readonly IFtpService _ftp;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TaiLieuService(AppDbContext db, IFtpService ftp, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _ftp = ftp;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<TaiLieuUploadResultDto>> UploadAsync(
        IFormFileCollection files, int? goiThauId, string? loaiTaiLieu, CancellationToken ct = default)
    {
        if (files == null || files.Count == 0)
            throw new BadRequestException("Không có file nào được upload.");

        if (files.Count > MaxFilesPerRequest)
            throw new BadRequestException($"Tối đa {MaxFilesPerRequest} file mỗi lần upload.");

        var normalizedLoai = loaiTaiLieu?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalizedLoai) || !LoaiTaiLieu.All.Contains(normalizedLoai))
            throw new BadRequestException($"loaiTaiLieu không hợp lệ. Giá trị hợp lệ: {string.Join(", ", LoaiTaiLieu.All)}");

        foreach (var file in files)
        {
            var displayName = Path.GetFileName(file.FileName);
            if (file.Length == 0)
                throw new BadRequestException($"File '{displayName}' trống.");
            if (file.Length > MaxFileSizeBytes)
                throw new BadRequestException($"File '{displayName}' vượt quá giới hạn 50MB.");
        }

        var userId = GetCurrentUserId();
        var entities = new List<TaiLieuHoSo>();
        var uploadedPaths = new List<string>();

        try
        {
            foreach (var file in files)
            {
                var ftpPath = BuildFtpPath(goiThauId, normalizedLoai, file.FileName);
                using var stream = file.OpenReadStream();
                await _ftp.UploadAsync(stream, ftpPath, ct);
                uploadedPaths.Add(ftpPath);

                entities.Add(new TaiLieuHoSo
                {
                    GoiThauId = goiThauId,
                    TenFile = Path.GetFileName(file.FileName), // tránh lưu full path từ client
                    DuongDanFtp = ftpPath,
                    KichThuoc = file.Length,
                    LoaiTaiLieu = normalizedLoai,
                    ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                        ? "application/octet-stream"
                        : file.ContentType,
                    NguoiUploadId = userId,
                    NgayTao = DateTime.UtcNow
                });
            }

            _db.TaiLieuHoSos.AddRange(entities);
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            // Dọn FTP nếu DB save thất bại hoặc upload trung gian lỗi
            // Dùng CancellationToken.None để cleanup chạy dù request đã bị cancel
            foreach (var path in uploadedPaths)
            {
                try { await _ftp.DeleteAsync(path, CancellationToken.None); }
                catch { /* best effort */ }
            }
            throw;
        }

        return entities.Select(e => new TaiLieuUploadResultDto
        {
            Id = e.Id,
            FileName = e.TenFile,
            Size = e.KichThuoc,
            LoaiTaiLieu = e.LoaiTaiLieu
        }).ToList();
    }

    public async Task<(Stream stream, string fileName, string contentType)> DownloadAsync(
        int id, CancellationToken ct = default)
    {
        var entity = await _db.TaiLieuHoSos
            .FindAsync(new object[] { id }, ct);

        if (entity is null || entity.DaXoa)
            throw new NotFoundException($"Không tìm thấy tài liệu với Id = {id}");

        var stream = await _ftp.DownloadAsync(entity.DuongDanFtp, ct);
        return (stream, entity.TenFile, entity.ContentType);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TaiLieuHoSos
            .FindAsync(new object[] { id }, ct);

        if (entity is null || entity.DaXoa)
            throw new NotFoundException($"Không tìm thấy tài liệu với Id = {id}");

        try
        {
            await _ftp.DeleteAsync(entity.DuongDanFtp, ct);
        }
        catch (NotFoundException)
        {
            // File đã bị xóa khỏi FTP trước đó → vẫn soft-delete DB
        }

        entity.DaXoa = true;
        // Dùng None để DB luôn được cập nhật dù request bị cancel sau khi FTP đã xóa
        await _db.SaveChangesAsync(CancellationToken.None);
    }

    public async Task<List<TaiLieuDto>> GetListAsync(int? goiThauId, string? loaiTaiLieu)
    {
        var normalizedLoai = loaiTaiLieu?.Trim().ToUpperInvariant();

        if (!string.IsNullOrWhiteSpace(normalizedLoai) && !LoaiTaiLieu.All.Contains(normalizedLoai))
            throw new BadRequestException($"loaiTaiLieu không hợp lệ. Giá trị hợp lệ: {string.Join(", ", LoaiTaiLieu.All)}");

        var query = _db.TaiLieuHoSos.Where(t => !t.DaXoa);

        if (goiThauId.HasValue)
            query = query.Where(t => t.GoiThauId == goiThauId);

        if (!string.IsNullOrWhiteSpace(normalizedLoai))
            query = query.Where(t => t.LoaiTaiLieu == normalizedLoai);

        return await query
            .OrderByDescending(t => t.NgayTao)
            .Select(t => new TaiLieuDto
            {
                Id = t.Id,
                TenFile = t.TenFile,
                KichThuoc = t.KichThuoc,
                LoaiTaiLieu = t.LoaiTaiLieu,
                ContentType = t.ContentType,
                GoiThauId = t.GoiThauId,
                NguoiUploadId = t.NguoiUploadId,
                NgayTao = t.NgayTao
            })
            .ToListAsync();
    }

    private static string BuildFtpPath(int? goiThauId, string loaiTaiLieu, string originalFileName)
    {
        var year = DateTime.UtcNow.Year;
        var month = DateTime.UtcNow.Month.ToString("D2");
        var goiThauFolder = goiThauId.HasValue ? $"gt{goiThauId}" : "general";

        var ext = Path.GetExtension(originalFileName).TrimStart('.').ToLowerInvariant();
        ext = ExtSanitizeRegex().Replace(ext, "");
        if (ext.Length > 10) ext = ext[..10];
        if (string.IsNullOrEmpty(ext)) ext = "bin";

        var guid = Guid.NewGuid().ToString("N")[..12];
        return $"{year}/{month}/{goiThauFolder}/{loaiTaiLieu}/{guid}.{ext}";
    }

    private int? GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : null;
    }

    [GeneratedRegex(@"[^A-Za-z0-9]")]
    private static partial Regex ExtSanitizeRegex();
}
