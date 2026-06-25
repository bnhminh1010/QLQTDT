using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using QLQTDT.Api.Models;
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

        // Không audit khi không có user đăng nhập (ví dụ: seed data khi khởi động)
        if (userId == 0)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var auditLogs = new List<NhatKyKiemToan>();

        foreach (var entry in entries)
        {
            var tableName = context.Model.FindEntityType(entry.Entity.GetType())?.GetTableName()
                            ?? entry.Entity.GetType().Name;
            var recordId = entry.Property("Id")?.CurrentValue;
            var goiThauId = ExtractGoiThauId(entry);

            var log = new NhatKyKiemToan
            {
                GoiThauId = goiThauId,
                HanhDong = entry.State.ToString().ToUpper(),
                MoTaChiTiet = FormatChangeDescription(entry),
                NguoiThucHienId = userId,
                ThoiGianThucHien = DateTime.UtcNow
            };
            auditLogs.Add(log);
        }

        context.Set<NhatKyKiemToan>().AddRange(auditLogs);

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : 0;
    }

    private static long? ExtractGoiThauId(EntityEntry entry)
    {
        var prop = entry.Properties.FirstOrDefault(p =>
            p.Metadata.Name.Equals("GoiThauId", StringComparison.OrdinalIgnoreCase));
        if (prop?.CurrentValue is null) return null;
        // Handle both int and long GoiThauId
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
                changes[prop.Metadata.Name] = prop.CurrentValue;
            }
            else if (entry.State == EntityState.Modified && prop.IsModified)
            {
                changes[prop.Metadata.Name] = new
                {
                    cu = prop.OriginalValue,
                    moi = prop.CurrentValue
                };
            }
            else if (entry.State == EntityState.Deleted)
            {
                changes[prop.Metadata.Name] = prop.OriginalValue;
            }
        }

        var tableName = entry.Context?.Model.FindEntityType(entry.Entity.GetType())?.GetTableName()
            ?? entry.Entity.GetType().Name;
        var recordId = entry.Property("Id")?.CurrentValue ?? entry.Property("Id")?.OriginalValue;

        changes["_bang"] = tableName;
        changes["_banGhiId"] = recordId;

        return JsonSerializer.Serialize(changes, new JsonSerializerOptions
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }
}
