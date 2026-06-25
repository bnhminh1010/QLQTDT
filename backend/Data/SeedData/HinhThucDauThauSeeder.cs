using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data.SeedData;

public static class HinhThucDauThauSeeder
{
    private static readonly (string MaHinhThuc, string TenHinhThuc, decimal? HanMucToiDa)[] DefaultData =
    [
        ("CHI_DINH_THAU", "Chỉ định thầu", 500_000_000),
        ("CHI_DINH_THAU_RUT_GON", "Chỉ định thầu rút gọn", 500_000_000),
        ("CHAO_HANG_CANH_TRANH", "Chào hàng cạnh tranh", 5_000_000_000),
        ("DAU_THAU_RONG_RAI", "Đấu thầu rộng rãi", null),
        ("MUA_SAM_TRUC_TIEP", "Mua sắm trực tiếp", 100_000_000),
        ("CHAO_GIA_TRUC_TUYEN", "Chào giá trực tuyến", 200_000_000),
        ("DAT_HANG", "Đặt hàng", 50_000_000),
    ];

    public static async Task SeedAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (ma, ten, hanMuc) in DefaultData)
        {
            var exists = await context.Set<HinhThucDauThau>()
                .AnyAsync(h => h.MaHinhThuc == ma);

            if (!exists)
            {
                context.Set<HinhThucDauThau>().Add(new HinhThucDauThau
                {
                    MaHinhThuc = ma,
                    TenHinhThuc = ten,
                    HanMucToiDa = hanMuc,
                    TrangThaiHoatDong = true
                });
                logger.LogInformation("Seed: Tạo hình thức đấu thầu {MaHinhThuc}", ma);
            }
        }
        await context.SaveChangesAsync();
    }
}
