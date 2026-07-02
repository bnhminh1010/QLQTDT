using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models;
using QLQTDT.Api.Security;
using System.Security.Claims;
using System.Text.Json;

namespace QLQTDT.Api.Data;

public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context is null) return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var entries = context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted
                     && e.Entity.GetType().GetProperty("Id") != null
                     && e.Entity is not NhatKyKiemToan)
            .ToList();

        if (entries.Count == 0)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var userId = GetCurrentUserId();
        if (userId == 0)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var ipAddress = GetClientIpAddress();
        var auditLogs = new List<NhatKyKiemToan>();

        foreach (var entry in entries)
        {
            var tableName = context.Model.FindEntityType(entry.Entity.GetType())?.GetTableName()
                            ?? entry.Entity.GetType().Name;
            var recordId = entry.Property("Id")?.CurrentValue ?? entry.Property("Id")?.OriginalValue;
            var goiThauId = ExtractGoiThauId(entry);

            string? duLieuCu = null;
            string? duLieuMoi = null;

            if (entry.State == EntityState.Modified)
            {
                var oldValues = new Dictionary<string, object?>();
                var newValues = new Dictionary<string, object?>();
                foreach (var prop in entry.Properties)
                {
                    if (prop.Metadata.Name is "Id" or "NgayTao" or "NgayCapNhat") continue;
                    if (prop.IsModified)
                    {
                        oldValues[prop.Metadata.Name] = AuditValueRedactor.Redact(prop.Metadata.Name, prop.OriginalValue);
                        newValues[prop.Metadata.Name] = AuditValueRedactor.Redact(prop.Metadata.Name, prop.CurrentValue);
                    }
                }
                duLieuCu = JsonSerializer.Serialize(oldValues, JsonOptions);
                duLieuMoi = JsonSerializer.Serialize(newValues, JsonOptions);
            }

            var log = new NhatKyKiemToan
            {
                GoiThauId = goiThauId,
                HanhDong = entry.State.ToString().ToUpper(),
                Bang = tableName,
                BanGhiId = recordId is not null ? Convert.ToInt64(recordId) : null,
                DuLieuCu = duLieuCu,
                DuLieuMoi = duLieuMoi,
                MoTaChiTiet = FormatChangeDescription(entry),
                DiaChiIP = ipAddress,
                NguoiThucHienId = userId,
                ThoiGianThucHien = BusinessClock.VietnamNow
            };
            auditLogs.Add(log);
        }

        context.Set<NhatKyKiemToan>().AddRange(auditLogs);

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : 0;
    }

    private string? GetClientIpAddress()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext is null) return null;

        var forwarded = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
            return forwarded.Split(',')[0].Trim();

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }

    private static long? ExtractGoiThauId(EntityEntry entry)
    {
        var prop = entry.Properties.FirstOrDefault(p =>
            p.Metadata.Name.Equals("GoiThauId", StringComparison.OrdinalIgnoreCase));
        if (prop?.CurrentValue is null) return null;
        return Convert.ToInt64(prop.CurrentValue);
    }

    private static string FormatChangeDescription(EntityEntry entry)
    {
        var changes = new Dictionary<string, object?>();

        foreach (var prop in entry.Properties)
        {
            if (prop.Metadata.Name is "Id" or "NgayTao" or "NgayCapNhat") continue;

            if (entry.State == EntityState.Added)
            {
                changes[prop.Metadata.Name] = AuditValueRedactor.Redact(prop.Metadata.Name, prop.CurrentValue);
            }
            else if (entry.State == EntityState.Modified && prop.IsModified)
            {
                changes[prop.Metadata.Name] = new
                {
                    cu = AuditValueRedactor.Redact(prop.Metadata.Name, prop.OriginalValue),
                    moi = AuditValueRedactor.Redact(prop.Metadata.Name, prop.CurrentValue)
                };
            }
            else if (entry.State == EntityState.Deleted)
            {
                changes[prop.Metadata.Name] = AuditValueRedactor.Redact(prop.Metadata.Name, prop.OriginalValue);
            }
        }

        var tableName = entry.Context?.Model.FindEntityType(entry.Entity.GetType())?.GetTableName()
            ?? entry.Entity.GetType().Name;
        var recordId = entry.Property("Id")?.CurrentValue ?? entry.Property("Id")?.OriginalValue;

        changes["_bang"] = tableName;
        changes["_banGhiId"] = recordId;

        return JsonSerializer.Serialize(changes, JsonOptions);
    }
}
