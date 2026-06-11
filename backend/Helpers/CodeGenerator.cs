using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Helpers;

public static class CodeGenerator
{
    /// <summary>
    /// Sinh MaDeXuat = DX-{year}-{seq padded 4 số}.
    /// Phải gọi TRONG transaction Serializable đã mở sẵn bởi caller để tránh race conditions.
    /// </summary>
    public static async Task<string> GenerateMaDeXuatAsync(AppDbContext context)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"DX-{year}-";

        var maxCode = await context.DeXuatMuaSams
            .Where(d => d.MaDeXuat.StartsWith(prefix))
            .OrderByDescending(d => d.MaDeXuat)
            .Select(d => d.MaDeXuat)
            .FirstOrDefaultAsync();

        var seq = 1;
        if (maxCode != null)
        {
            var parts = maxCode.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var lastSeq))
                seq = lastSeq + 1;
        }

        return $"{prefix}{seq:D4}";
    }
}
