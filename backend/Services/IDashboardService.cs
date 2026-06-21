using QLQTDT.Api.Models.DTOs.Dashboard;

namespace QLQTDT.Api.Services;

public interface IDashboardService
{
    /// <summary>Dashboard tổng quan theo quyền user</summary>
    Task<DashboardTongQuanDto> GetTongQuanAsync(int userId);
}
