using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Models.DTOs.Rbac;

namespace QLQTDT.Api.Services;

public interface IUserService
{
    Task AssignRoleAsync(int userId, AssignRoleRequest request);
    Task<List<UserRoleDto>> GetRolesAsync(int userId);
    Task RemoveRoleAsync(int assignmentId);
}
