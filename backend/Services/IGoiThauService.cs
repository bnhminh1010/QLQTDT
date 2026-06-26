using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface IGoiThauService : IBaseService<GoiThau>
{
    Task<PagedResult<GoiThauDto>> SearchAsync(int page, int pageSize, string? trangThai);
    Task<GoiThauDetailDto> CreateAsync(CreateGoiThauDto dto);
    Task<GoiThauDetailDto> UpdateAsync(int id, UpdateGoiThauDto dto);
    Task<GoiThauDetailDto> GetChiTietAsync(int id);
    Task<IReadOnlyList<LichSuTrangThaiGoiThauDto>> GetLichSuTrangThaiAsync(int id);
    Task CancelAsync(int id);
}
