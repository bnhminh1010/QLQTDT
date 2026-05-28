namespace QLQTDT.Api.Services;

public interface IPermissionService
{
    Task<bool> HasPermissionAsync(int userId, string permission);

    Task<IReadOnlySet<string>> GetPermissionsAsync(int userId);
}
