using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;
using QLQTDT.Api.Models.DTOs.NhaThau;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface INhaThauService : IBaseService<NhaThau>
{
    Task<PagedResult<NhaThau>> SearchAsync(int page, int pageSize, string? search);
    Task<NhaThau> CreateAsync(CreateNhaThauDto dto);
    Task<NhaThau> UpdateAsync(int id, UpdateNhaThauDto dto);
    Task<List<HoSoNangLucDto>> GetHoSoNangLucAsync(int nhaThauId);
    Task<HoSoNangLucDto> UploadHoSoNangLucAsync(int nhaThauId, UploadHoSoNangLucDto dto, CancellationToken ct = default);
    Task DeleteHoSoNangLucAsync(int nhaThauId, long hoSoId, CancellationToken ct = default);
    Task<List<LichSuDauThauItemDto>> GetLichSuDauThauAsync(int nhaThauId);
}
