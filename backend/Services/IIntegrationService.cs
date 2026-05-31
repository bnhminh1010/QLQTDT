using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.Integration;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface IIntegrationService
{
    Task<IntegrationLog> SyncAsync(SyncRequest request);
    Task<PagedResult<IntegrationLog>> GetLogsAsync(int page, int pageSize, string? heThong, string? trangThai);
    Task<IntegrationLog> RetryAsync(long id);
}
