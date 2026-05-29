using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.DeXuat;

namespace QLQTDT.Api.Services;

public interface IDeXuatService
{
    Task<PagedResult<DeXuatResponseDto>> GetAllAsync(DeXuatQueryParams queryParams, int userId);
    Task<DeXuatResponseDto> GetByIdAsync(long id, int userId);
    Task<DeXuatResponseDto> CreateAsync(CreateDeXuatDto dto, int userId);
    Task<DeXuatResponseDto> UpdateAsync(long id, UpdateDeXuatDto dto, int userId);
    Task DeleteAsync(long id, int userId);
    Task<List<ChiTietResponseDto>> GetChiTietAsync(long id, int userId);
}
