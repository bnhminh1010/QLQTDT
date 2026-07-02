namespace QLQTDT.Api.Services;

public interface IAuthStateInvalidator
{
    Task RevokeUserAuthStateAsync(int userId, CancellationToken ct = default);
}
