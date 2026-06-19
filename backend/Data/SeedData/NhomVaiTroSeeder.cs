using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data.SeedData;

public static class NhomVaiTroSeeder
{
    private static readonly (string MaNhom, string TenNhom, int DoUuTien, string MoTa, string[] VaiTroMaCodes)[] DefaultGroups =
    [
        ("CAP_CAO", "Cấp cao", 1, "BGD, GD, PGD, KTT — ưu tiên cao nhất, deadline auto CANH_BAO",
         ["VIEN_TRUONG", "KE_TOAN_TRUONG", "TONG_PHAP_CHE"]),
        ("TRUNG_BINH", "Trung bình", 3, "Trưởng khoa, Trưởng phòng",
         ["BCN_KHOA_PHONG", "BCN_HCQT"]),
        ("THAP", "Thấp", 5, "Chuyên viên, Nhân viên — deadline mặc định",
         ["KHOA_PHONG", "ADMIN"]),
    ];

    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (maNhom, tenNhom, doUuTien, moTa, vaiTroMaCodes) in DefaultGroups)
        {
            var exists = await context.Set<NhomVaiTro>()
                .AnyAsync(n => n.MaNhom == maNhom);

            NhomVaiTro nhom;
            if (!exists)
            {
                nhom = new NhomVaiTro
                {
                    MaNhom = maNhom,
                    TenNhom = tenNhom,
                    DoUuTien = doUuTien,
                    MoTa = moTa,
                    DaXoa = false
                };
                context.NhomVaiTros.Add(nhom);
                await context.SaveChangesAsync();
                logger.LogInformation("Seed: Tạo nhóm vai trò {MaNhom} — {TenNhom}", maNhom, tenNhom);
            }
            else
            {
                nhom = await context.NhomVaiTros.FirstAsync(n => n.MaNhom == maNhom);
            }

            // Map existing VaiTro to this group (if not already mapped)
            var vaiTroIds = await context.VaiTros
                .Where(v => vaiTroMaCodes.Contains(v.MaVaiTro) && !v.DaXoa)
                .Select(v => v.Id)
                .ToListAsync();

            var alreadyMapped = await context.VaiTros
                .Where(v => vaiTroIds.Contains(v.Id) && v.NhomVaiTroId == nhom.Id)
                .Select(v => v.Id)
                .ToListAsync();

            var toMap = vaiTroIds.Except(alreadyMapped).ToList();
            if (toMap.Count > 0)
            {
                foreach (var vaiTroId in toMap)
                {
                    await context.VaiTros
                        .Where(v => v.Id == vaiTroId)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(v => v.NhomVaiTroId, nhom.Id));
                }
                logger.LogInformation("Seed: Gán {Count} vai trò vào nhóm {MaNhom}", toMap.Count, maNhom);
            }
        }
    }
}
