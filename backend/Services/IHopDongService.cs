using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HopDong;

namespace QLQTDT.Api.Services;

public interface IHopDongService
{
    Task<HopDongDetailDto> CreateAsync(CreateHopDongRequest request);
    Task<PagedResult<HopDongListItemDto>> GetByGoiThauAsync(int goiThauId, int page, int pageSize);
    Task<HopDongDetailDto> GetByIdAsync(int id);
}
