using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Services;

public static class ScopeResolver
{
    public static async Task<(HashSet<int> Ids, bool IsFull)> ResolveAsync(AppDbContext db, int userId)
    {
        var assignments = await db.NguoiDungKhoaPhongVaiTros
            .Where(nkv => nkv.NguoiDungId == userId)
            .Select(nkv => nkv.KhoaPhongId)
            .Distinct()
            .ToListAsync();

        if (assignments.Any(id => id == null))
            return ([], true);

        var khoaPhongIds = assignments.Where(id => id.HasValue).Select(id => id!.Value).ToHashSet();
        return (khoaPhongIds, false);
    }
}
