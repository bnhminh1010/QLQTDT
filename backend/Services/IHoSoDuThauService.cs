using QLQTDT.Api.Models;
using QLQTDT.Api.Models.DTOs.HoSoDuThau;

namespace QLQTDT.Api.Services;

public interface IHoSoDuThauService
{
    Task<HoSoDuThauDetailDto> CreateAsync(CreateHoSoDuThauRequest request);
    Task<PagedResult<HoSoDuThauListItemDto>> GetByGoiThauAsync(int goiThauId, int page, int pageSize);
    Task<HoSoDuThauDetailDto> GetByIdAsync(int id);
    Task UpdateTrangThaiAsync(int id, UpdateTrangThaiHoSoRequest request);
    Task EvaluateAsync(int id, EvaluateHoSoRequest request);
    Task<GoiThauKetQuaDto> GetKetQuaAsync(int goiThauId);
    Task AwardAsync(int goiThauId, AwardGoiThauRequest request);
}
