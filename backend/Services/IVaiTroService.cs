using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public interface IVaiTroService
{
    Task<List<VaiTro>> GetAllAsync();

    /// <summary>
    /// Gán danh sách quyền cho vai trò (bulk replace: xóa cũ → insert mới trong 1 transaction)
    /// </summary>
    Task GanQuyenAsync(int vaiTroId, List<int> permissionIds);

    /// <summary>
    /// Lấy danh sách quyền hiện tại của vai trò
    /// </summary>
    Task<List<QuyenDto>> GetQuyenAsync(int vaiTroId);
}
