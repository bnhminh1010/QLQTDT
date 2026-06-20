using QLQTDT.Api.Models.DTOs.Dashboard;

namespace QLQTDT.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync();
    Task<DashboardStatisticsDto> GetStatisticsAsync(int? nam, int? quy);
    Task<DashboardPendingDto> GetPendingAsync();
    Task<DashboardExportFile> ExportAsync(string? loai, DateTime? tuNgay, DateTime? denNgay);
}

