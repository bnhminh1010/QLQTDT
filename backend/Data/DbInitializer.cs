using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data;

/// <summary>
/// Khởi tạo dữ liệu mặc định cho hệ thống: 7 vai trò + 1 tài khoản Admin gốc.
/// Chạy idempotent — chỉ tạo dữ liệu nếu chưa tồn tại.
/// </summary>
public static class DbInitializer
{
    // Danh sách vai trò mặc định theo SRS
    private static readonly (string TenVaiTro, string MoTa)[] DefaultRoles =
    [
        ("ADMIN", "Quản trị hệ thống — quản lý tài khoản, phân quyền, cấu hình"),
        ("KHOA_PHONG", "Nhân viên hành chính khoa/phòng — khởi tạo đề xuất, upload hồ sơ"),
        ("BCN_KHOA_PHONG", "Ban chủ nhiệm khoa/phòng — xem/duyệt hồ sơ nội bộ"),
        ("KE_TOAN", "Kế toán — kiểm tra ngân sách, dự toán, tài chính"),
        ("PHONG_QLDT", "Phòng QLĐT — điều phối chính, kiểm tra hồ sơ, quản lý workflow"),
        ("VIEN_TRUONG", "Viện trưởng — theo dõi báo cáo tổng hợp"),
        ("NHA_THAU", "Nhà thầu bên ngoài — đăng ký, nộp HSDT, xem kết quả")
    ];

    /// <summary>
    /// Seed dữ liệu mặc định vào DB. Gọi trong Program.cs sau khi build app.
    /// </summary>
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        await SeedRolesAsync(context, logger);
        await SeedData.PermissionSeeder.SeedPermissionsAsync(context, logger);
        await SeedAdminAccountAsync(context, logger);
        await SeedKhoaPhongAsync(context, logger);
        await SeedData.WorkflowTemplateSeeder.SeedAsync(context, logger);
    }

    private static async Task SeedRolesAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (tenVaiTro, moTa) in DefaultRoles)
        {
            var exists = await context.VaiTros.AnyAsync(v => v.TenVaiTro == tenVaiTro);
            if (!exists)
            {
                context.VaiTros.Add(new VaiTro
                {
                    TenVaiTro = tenVaiTro,
                    MoTa = moTa,
                    DaXoa = false
                });
                logger.LogInformation("Seed: Tạo vai trò {TenVaiTro}", tenVaiTro);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedKhoaPhongAsync(AppDbContext context, ILogger logger)
    {
        if (await context.KhoaPhongs.AnyAsync())
        {
            logger.LogInformation("Seed: Khoa/phòng đã tồn tại, bỏ qua.");
            return;
        }

        context.KhoaPhongs.Add(new KhoaPhong
        {
            MaKhoaPhong = "KTTH",
            TenKhoaPhong = "Phòng Kỹ thuật tổng hợp"
        });
        await context.SaveChangesAsync();
        logger.LogInformation("Seed: Tạo khoa/phòng mặc định (MaKhoaPhong: KTTH)");
    }

    private static async Task SeedAdminAccountAsync(AppDbContext context, ILogger logger)
    {
        const string adminUsername = "admin";
        const string adminEmail = "admin@qlqtdt.local";
        const string adminPassword = "Admin@123456";
        const string adminFullName = "Quản Trị Viên Hệ Thống";

        // Kiểm tra admin đã tồn tại chưa
        var adminExists = await context.NguoiDungs.AnyAsync(u => u.TenDangNhap == adminUsername);
        if (adminExists)
        {
            logger.LogInformation("Seed: Tài khoản admin đã tồn tại, bỏ qua.");
            return;
        }

        // Lấy KhoaPhong mặc định (đã được seed ở SeedKhoaPhongAsync)
        var defaultKhoaPhong = await context.KhoaPhongs.FirstAsync();

        // Tạo tài khoản admin
        var admin = new NguoiDung
        {
            TenDangNhap = adminUsername,
            MatKhauHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
            HoTen = adminFullName,
            Email = adminEmail,
            TrangThaiHoatDong = true,
            NgayTao = DateTime.UtcNow
        };
        context.NguoiDungs.Add(admin);
        await context.SaveChangesAsync();

        // Gán vai trò ADMIN + KhoaPhong mặc định
        var adminRole = await context.VaiTros.FirstOrDefaultAsync(v => v.TenVaiTro == "ADMIN");
        if (adminRole != null)
        {
            context.NguoiDungKhoaPhongVaiTros.Add(new NguoiDungKhoaPhongVaiTro
            {
                NguoiDungId = admin.Id,
                KhoaPhongId = defaultKhoaPhong.Id,
                VaiTroId = adminRole.Id,
                LaChinh = true
            });
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Seed: Tạo tài khoản admin mặc định (username: {Username})", adminUsername);
    }
}
