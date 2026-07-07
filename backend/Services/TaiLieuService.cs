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
    private readonly IPermissionService _permissionService;
    private readonly ITenderAccessService _tenderAccess;

    public TaiLieuService(
        AppDbContext db,
        IFtpService ftp,
        IHttpContextAccessor httpContextAccessor,
        IPermissionService permissionService,
        ITenderAccessService tenderAccess)
    {
        _db = db;
        _ftp = ftp;
        _httpContextAccessor = httpContextAccessor;
        _permissionService = permissionService;
        _tenderAccess = tenderAccess;
    }

    public async Task<List<TaiLieuUploadResultDto>> UploadAsync(
        List<IFormFile>? files,
        int? goiThauId,
        long? workflowStepInstanceId,
        string? loaiTaiLieu,
        string? documentPhase,
        CancellationToken ct = default)
    {
        if (files == null || files.Count == 0)
            throw new BadRequestException("Khong co file nao duoc upload.");

        if (files.Count > MaxFilesPerRequest)
            throw new BadRequestException($"Toi da {MaxFilesPerRequest} file moi lan upload.");

        var normalizedLoai = loaiTaiLieu?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(normalizedLoai) || !LoaiTaiLieu.All.Contains(normalizedLoai))
            throw new BadRequestException($"loaiTaiLieu khong hop le. Gia tri hop le: {string.Join(", ", LoaiTaiLieu.All)}");

        var normalizedPhase = NormalizeDocumentPhase(documentPhase);

        foreach (var file in files)
        {
            var displayName = Path.GetFileName(file.FileName);
            if (file.Length == 0)
                throw new BadRequestException($"File '{displayName}' trong.");
            if (file.Length > MaxFileSizeBytes)
                throw new BadRequestException($"File '{displayName}' vuot qua gioi han 50MB.");

            using var validationStream = file.OpenReadStream();
            FileSignatureValidator.Validate(file.FileName, validationStream);
        }

        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yeu cau chua duoc xac thuc.");
        var accessContext = await ResolveUploadAccessAsync(userId, goiThauId, workflowStepInstanceId, normalizedPhase, ct);
        goiThauId = accessContext.GoiThauId;

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
                    WorkflowStepInstanceId = workflowStepInstanceId,
                    TenFile = Path.GetFileName(file.FileName),
                    DuongDanFtp = ftpPath,
                    KichThuoc = file.Length,
                    LoaiTaiLieu = normalizedLoai,
                    DocumentPhase = normalizedPhase,
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
            foreach (var path in uploadedPaths)
            {
                try { await _ftp.DeleteAsync(path, CancellationToken.None); }
                catch { }
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
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (entity is null || entity.DaXoa)
            throw new NotFoundException($"Khong tim thay tai lieu voi Id = {id}");

        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yeu cau chua duoc xac thuc.");
        await EnsureCanReadDocumentAsync(userId, entity, ct);

        var stream = await _ftp.DownloadAsync(entity.DuongDanFtp, ct);
        return (stream, entity.TenFile, entity.ContentType);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _db.TaiLieuHoSos
            .FindAsync(new object[] { id }, ct);

        if (entity is null || entity.DaXoa)
            throw new NotFoundException($"Khong tim thay tai lieu voi Id = {id}");

        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yeu cau chua duoc xac thuc.");
        if (entity.GoiThauId.HasValue)
            await _tenderAccess.EnsureCanEditAsync(userId, entity.GoiThauId.Value);
        else if (entity.NguoiUploadId != userId)
            throw new ForbiddenException("Ban khong co quyen xoa tai lieu nay.");

        try
        {
            await _ftp.DeleteAsync(entity.DuongDanFtp, ct);
        }
        catch (NotFoundException)
        {
        }

        entity.DaXoa = true;
        await _db.SaveChangesAsync(CancellationToken.None);
    }

    public async Task<List<TaiLieuDto>> GetListAsync(
        int? goiThauId,
        long? workflowStepInstanceId,
        string? loaiTaiLieu,
        string? documentPhase)
    {
        var normalizedLoai = loaiTaiLieu?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(normalizedLoai) && !LoaiTaiLieu.All.Contains(normalizedLoai))
            throw new BadRequestException($"loaiTaiLieu khong hop le. Gia tri hop le: {string.Join(", ", LoaiTaiLieu.All)}");

        var normalizedPhase = NormalizeDocumentPhase(documentPhase);
        var userId = GetCurrentUserId() ?? throw new UnauthorizedException("Yeu cau chua duoc xac thuc.");

        var accessContext = await ResolveDocumentAccessAsync(userId, goiThauId, workflowStepInstanceId);
        goiThauId = accessContext.GoiThauId;

        var query = from t in _db.TaiLieuHoSos.Where(t => !t.DaXoa)
                    join uploader in _db.NguoiDungs.AsNoTracking() on t.NguoiUploadId equals uploader.Id into uploaderJoin
                    from uploader in uploaderJoin.DefaultIfEmpty()
                    select new { TaiLieu = t, NguoiUpload = uploader };

        if (goiThauId.HasValue)
            query = query.Where(x => x.TaiLieu.GoiThauId == goiThauId);
        else
            query = query.Where(x => x.TaiLieu.NguoiUploadId == userId);

        if (workflowStepInstanceId.HasValue)
            query = query.Where(x => x.TaiLieu.WorkflowStepInstanceId == workflowStepInstanceId);

        if (!string.IsNullOrWhiteSpace(normalizedLoai))
            query = query.Where(x => x.TaiLieu.LoaiTaiLieu == normalizedLoai);

        if (!string.IsNullOrWhiteSpace(normalizedPhase))
            query = query.Where(x => x.TaiLieu.DocumentPhase == normalizedPhase);

        return await query
            .OrderByDescending(x => x.TaiLieu.NgayTao)
            .Select(x => new TaiLieuDto
            {
                Id = x.TaiLieu.Id,
                TenFile = x.TaiLieu.TenFile,
                KichThuoc = x.TaiLieu.KichThuoc,
                LoaiTaiLieu = x.TaiLieu.LoaiTaiLieu,
                DocumentPhase = x.TaiLieu.DocumentPhase,
                ContentType = x.TaiLieu.ContentType,
                GoiThauId = x.TaiLieu.GoiThauId,
                WorkflowStepInstanceId = x.TaiLieu.WorkflowStepInstanceId,
                NguoiUploadId = x.TaiLieu.NguoiUploadId,
                NguoiUploadTen = x.NguoiUpload != null ? x.NguoiUpload.HoTen : null,
                NgayTao = x.TaiLieu.NgayTao
            })
            .ToListAsync();
    }

    private async Task<DocumentAccessContext> ResolveDocumentAccessAsync(int userId, int? goiThauId, long? workflowStepInstanceId)
    {
        StepAccessContext? stepAccess = null;

        if (workflowStepInstanceId.HasValue)
        {
            stepAccess = await ResolveStepAccessContextAsync(workflowStepInstanceId.Value);
            if (goiThauId.HasValue && goiThauId.Value != stepAccess.GoiThauId)
                throw new BadRequestException("workflowStepInstanceId khong khop voi goiThauId.");

            goiThauId = stepAccess.GoiThauId;
        }

        if (await _permissionService.HasPermissionAsync(userId, "TAILIEU.DOWNLOAD")
            || await _permissionService.HasPermissionAsync(userId, "TAILIEU.VIEW"))
        {
            return new DocumentAccessContext(goiThauId, stepAccess);
        }

        if (goiThauId.HasValue)
        {
            if (await CanViewTenderAsync(userId, goiThauId.Value))
                return new DocumentAccessContext(goiThauId, stepAccess);

            if (stepAccess is not null && await CanViewStepDocumentsAsync(userId, stepAccess))
                return new DocumentAccessContext(goiThauId, stepAccess);

            await _tenderAccess.EnsureCanViewAsync(userId, goiThauId.Value);
            return new DocumentAccessContext(goiThauId, stepAccess);
        }

        if (stepAccess is not null)
        {
            if (await CanViewStepDocumentsAsync(userId, stepAccess))
                return new DocumentAccessContext(stepAccess.GoiThauId, stepAccess);

            await _tenderAccess.EnsureCanViewAsync(userId, stepAccess.GoiThauId);
            return new DocumentAccessContext(stepAccess.GoiThauId, stepAccess);
        }

        return new DocumentAccessContext(goiThauId, null);
    }

    private async Task EnsureCanReadDocumentAsync(int userId, TaiLieuHoSo entity, CancellationToken ct)
    {
        if (entity.WorkflowStepInstanceId.HasValue)
        {
            var stepAccess = await ResolveStepAccessContextAsync(entity.WorkflowStepInstanceId.Value, ct);

            if (entity.GoiThauId.HasValue && entity.GoiThauId.Value != stepAccess.GoiThauId)
                throw new BadRequestException("Tai lieu khong khop voi workflowStepInstanceId va goiThauId.");

            if (await _permissionService.HasPermissionAsync(userId, "TAILIEU.DOWNLOAD")
                || await _permissionService.HasPermissionAsync(userId, "TAILIEU.VIEW"))
            {
                return;
            }

            if (await CanViewStepDocumentsAsync(userId, stepAccess))
                return;

            await _tenderAccess.EnsureCanViewAsync(userId, stepAccess.GoiThauId);
            return;
        }

        if (await _permissionService.HasPermissionAsync(userId, "TAILIEU.DOWNLOAD")
            || await _permissionService.HasPermissionAsync(userId, "TAILIEU.VIEW"))
        {
            return;
        }

        if (entity.GoiThauId.HasValue)
        {
            await _tenderAccess.EnsureCanViewAsync(userId, entity.GoiThauId.Value);
            return;
        }

        if (entity.NguoiUploadId == userId)
            return;

        throw new ForbiddenException("Ban khong co quyen truy cap tai lieu nay.");
    }

    private async Task<UploadAccessContext> ResolveUploadAccessAsync(
        int userId,
        int? goiThauId,
        long? workflowStepInstanceId,
        string? normalizedPhase,
        CancellationToken ct)
    {
        StepAccessContext? stepAccess = null;

        if (workflowStepInstanceId.HasValue)
        {
            stepAccess = await ResolveStepAccessContextAsync(workflowStepInstanceId.Value, ct);
            if (goiThauId.HasValue && goiThauId.Value != stepAccess.GoiThauId)
                throw new BadRequestException("workflowStepInstanceId khong khop voi goiThauId.");

            goiThauId = stepAccess.GoiThauId;
        }

        var tender = goiThauId.HasValue
            ? await _db.GoiThaus
                .AsNoTracking()
                .FirstOrDefaultAsync(g => g.Id == goiThauId.Value && g.TrangThaiHoatDong, ct)
            : null;

        if (goiThauId.HasValue && tender is null)
            throw new NotFoundException($"Khong tim thay goi thau voi Id = {goiThauId.Value}");

        if (await _permissionService.HasPermissionAsync(userId, "TAILIEU.UPLOAD"))
            return new UploadAccessContext(goiThauId, stepAccess);

        if (tender?.NguoiTaoId == userId)
            return new UploadAccessContext(goiThauId, stepAccess);

        if (stepAccess is not null && CanUploadStepDocuments(userId, stepAccess, normalizedPhase))
            return new UploadAccessContext(goiThauId, stepAccess);

        throw new ForbiddenException("Bạn không có quyền upload tài liệu cho bước này.");
    }

    private async Task<bool> CanViewTenderAsync(int userId, int goiThauId)
    {
        try
        {
            await _tenderAccess.EnsureCanViewAsync(userId, goiThauId);
            return true;
        }
        catch (ForbiddenException)
        {
            return false;
        }
    }

    private async Task<bool> CanViewStepDocumentsAsync(int userId, StepAccessContext stepAccess)
    {
        if (stepAccess.NguoiXuLyId == userId || stepAccess.NguoiKyDuyetId == userId)
            return true;

        var userKhoaPhongIds = await _db.NguoiDungKhoaPhongVaiTros
            .AsNoTracking()
            .Where(nkv => nkv.NguoiDungId == userId && nkv.KhoaPhongId.HasValue)
            .Select(nkv => nkv.KhoaPhongId!.Value)
            .Distinct()
            .ToListAsync();

        if (userKhoaPhongIds.Count == 0)
            return false;

        if (stepAccess.DonViXuLyId.HasValue && userKhoaPhongIds.Contains(stepAccess.DonViXuLyId.Value))
            return true;

        if (stepAccess.DonViKyHoSoId.HasValue && userKhoaPhongIds.Contains(stepAccess.DonViKyHoSoId.Value))
            return true;

        return false;
    }

    private static bool CanUploadStepDocuments(int userId, StepAccessContext stepAccess, string? normalizedPhase)
    {
        var phase = normalizedPhase;
        if (string.IsNullOrWhiteSpace(phase))
            phase = string.Equals(stepAccess.PhaHienTai, "KY_DUYET", StringComparison.OrdinalIgnoreCase)
                ? DocumentPhase.Approval
                : DocumentPhase.Processing;

        return string.Equals(phase, DocumentPhase.Approval, StringComparison.OrdinalIgnoreCase)
            ? stepAccess.NguoiKyDuyetId == userId
            : stepAccess.NguoiXuLyId == userId;
    }

    private async Task<StepAccessContext> ResolveStepAccessContextAsync(long workflowStepInstanceId, CancellationToken ct = default)
    {
        var stepInfo = await _db.WorkflowStepInstances
            .AsNoTracking()
            .Where(s => s.Id == workflowStepInstanceId)
            .Select(s => new StepAccessContext(
                s.WorkflowInstance!.GoiThauId,
                s.PhaHienTai,
                s.BuocWorkflow!.DonViXuLyId,
                s.BuocWorkflow!.DonViKyHoSoId,
                s.NguoiXuLyId,
                s.NguoiKyDuyetId))
            .FirstOrDefaultAsync(ct);

        return stepInfo ?? throw new NotFoundException($"Khong tim thay buoc workflow voi Id = {workflowStepInstanceId}");
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

    private static string? NormalizeDocumentPhase(string? phase)
    {
        if (string.IsNullOrWhiteSpace(phase))
            return null;

        var normalized = phase.Trim();
        return DocumentPhase.All.FirstOrDefault(value => string.Equals(value, normalized, StringComparison.OrdinalIgnoreCase))
            ?? throw new BadRequestException($"documentPhase khong hop le. Gia tri hop le: {string.Join(", ", DocumentPhase.All)}");
    }

    [GeneratedRegex(@"[^A-Za-z0-9]")]
    private static partial Regex ExtSanitizeRegex();

    private sealed record StepAccessContext(
        int GoiThauId,
        string PhaHienTai,
        int? DonViXuLyId,
        int? DonViKyHoSoId,
        int? NguoiXuLyId,
        int? NguoiKyDuyetId);

    private sealed record UploadAccessContext(int? GoiThauId, StepAccessContext? StepAccess);

    private sealed record DocumentAccessContext(int? GoiThauId, StepAccessContext? StepAccess);
}
