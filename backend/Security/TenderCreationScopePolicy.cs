using QLQTDT.Api.Services;

namespace QLQTDT.Api.Security;

public static class TenderCreationScopePolicy
{
    public static bool CanCreateForKhoaPhong(TenderScope scope, int? khoaPhongId)
    {
        if (scope.IsFullScope)
            return true;

        if (!khoaPhongId.HasValue)
            return true;

        if (scope.OwnOnly)
            return false;

        return scope.KhoaPhongIds.Contains(khoaPhongId.Value);
    }
}
