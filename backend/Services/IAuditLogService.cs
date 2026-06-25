using QLQTDT.Api.Models;

namespace QLQTDT.Api.Services;

public interface IAuditLogService
{
    Task<PagedResult<NhatKyKiemToan>> GetAllAsync(int page, int pageSize, string? hanhDong, string? bang);
    Task<PagedResult<NhatKyKiemToan>> GetByGoiThauAsync(long goiThauId, int page, int pageSize);
}
