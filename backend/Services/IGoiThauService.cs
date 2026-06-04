using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.GoiThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface IGoiThauService : IBaseService<GoiThau>
{
    Task<PagedResult<GoiThauDto>> SearchAsync(int page, int pageSize, string? trangThai);
    Task<GoiThau> CreateAsync(CreateGoiThauDto dto);
    Task<GoiThau> UpdateAsync(int id, UpdateGoiThauDto dto);
    Task<GoiThauDetailDto> GetChiTietAsync(int id);
}
