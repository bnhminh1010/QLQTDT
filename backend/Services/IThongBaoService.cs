using QLQTDT.Api.Models.DTOs.ThongBao;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface IThongBaoService
{
    Task<ThongBaoListResponse> GetListAsync(int nguoiDungId, int page = 1, int pageSize = 20, bool? daDoc = null);
    Task MarkReadAsync(Guid idCongKhai, int nguoiDungId);
    Task<int> MarkAllReadAsync(int nguoiDungId);
    Task CreateAsync(ThongBao thongBao);
}
