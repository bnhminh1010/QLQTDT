using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HinhThucDauThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface IHinhThucDauThauService : IBaseService<HinhThucDauThau>
{
    Task<PagedResult<HinhThucDauThau>> SearchAsync(int page, int pageSize, string? search);
    Task<HinhThucDauThau> CreateAsync(CreateHinhThucDauThauDto dto);
    Task<HinhThucDauThau> UpdateAsync(int id, UpdateHinhThucDauThauDto dto);
}
