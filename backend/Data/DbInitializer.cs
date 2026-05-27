using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data;

/// <summary>
/// Khởi tạo dữ liệu mặc định cho hệ thống: 7 vai trò + 1 tài khoản Admin gốc + danh sách quyền + mapping mặc định.
/// Chạy idempotent — chỉ tạo dữ liệu nếu chưa tồn tại.
/// </summary>
public static class DbInitializer
{
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

    // Format chuẩn: MODULE.ACTION — UPPERCASE, nhất quán với convention DB
    private static readonly (string MaQuyen, string TenQuyen)[] DefaultPermissions =
    [
        // Đề xuất
        ("DEXUAT.CREATE",  "Tạo đề xuất"),
        ("DEXUAT.VIEW",    "Xem đề xuất"),
        ("DEXUAT.EDIT",    "Sửa đề xuất"),
        ("DEXUAT.DELETE",  "Xóa đề xuất"),
        ("DEXUAT.SUBMIT",  "Nộp đề xuất"),
        ("DEXUAT.APPROVE", "Duyệt đề xuất"),
        ("DEXUAT.REJECT",  "Từ chối đề xuất"),
        // Hợp đồng
        ("HOPDONG.CREATE",    "Tạo hợp đồng"),
        ("HOPDONG.VIEW",      "Xem hợp đồng"),
        ("HOPDONG.EDIT",      "Sửa hợp đồng"),
        ("HOPDONG.DELETE",    "Xóa hợp đồng"),
        ("HOPDONG.QUYETTOAN", "Quyết toán hợp đồng"),
        // Báo cáo
        ("REPORT.VIEW",   "Xem báo cáo"),
        ("REPORT.EXPORT", "Xuất báo cáo"),
        // Gói thầu
        ("GOITHAU.CREATE", "Tạo gói thầu"),
        ("GOITHAU.VIEW",   "Xem gói thầu"),
        ("GOITHAU.EDIT",   "Sửa gói thầu"),
        ("GOITHAU.DELETE", "Xóa gói thầu"),
        // Hồ sơ dự thầu
        ("HOSODUTHAU.CREATE", "Tạo hồ sơ dự thầu"),
        ("HOSODUTHAU.VIEW",   "Xem hồ sơ dự thầu"),
        ("HOSODUTHAU.EDIT",   "Sửa hồ sơ dự thầu"),
        ("HOSODUTHAU.DELETE", "Xóa hồ sơ dự thầu"),
        // Workflow
        ("WORKFLOW.CREATE", "Tạo workflow"),
        ("WORKFLOW.VIEW",   "Xem workflow"),
        ("WORKFLOW.EDIT",   "Sửa workflow"),
        ("WORKFLOW.DELETE", "Xóa workflow"),
        // Nhà thầu
        ("NHATHAU.CREATE", "Tạo nhà thầu"),
        ("NHATHAU.VIEW",   "Xem nhà thầu"),
        ("NHATHAU.EDIT",   "Sửa nhà thầu"),
        ("NHATHAU.DELETE", "Xóa nhà thầu"),
    ];

    private static readonly Dictionary<string, string[]> RolePermissionMap = new()
    {
        ["ADMIN"] = DefaultPermissions.Select(p => p.MaQuyen).ToArray(),

        ["KHOA_PHONG"] =
        [
            "DEXUAT.CREATE", "DEXUAT.VIEW", "DEXUAT.EDIT", "DEXUAT.DELETE", "DEXUAT.SUBMIT"
        ],

        ["BCN_KHOA_PHONG"] =
        [
            "DEXUAT.VIEW", "DEXUAT.APPROVE", "DEXUAT.REJECT"
        ],

        ["KE_TOAN"] =
        [
            "HOPDONG.VIEW", "HOPDONG.QUYETTOAN", "REPORT.VIEW"
        ],

        ["PHONG_QLDT"] =
        [
            "GOITHAU.CREATE",    "GOITHAU.VIEW",    "GOITHAU.EDIT",    "GOITHAU.DELETE",
            "HOSODUTHAU.CREATE", "HOSODUTHAU.VIEW", "HOSODUTHAU.EDIT", "HOSODUTHAU.DELETE",
            "WORKFLOW.CREATE",   "WORKFLOW.VIEW",   "WORKFLOW.EDIT",   "WORKFLOW.DELETE",
            "NHATHAU.CREATE",    "NHATHAU.VIEW",    "NHATHAU.EDIT",    "NHATHAU.DELETE",
            "HOPDONG.CREATE",    "HOPDONG.VIEW",    "HOPDONG.EDIT",    "HOPDONG.DELETE",    "HOPDONG.QUYETTOAN"
        ],

        ["VIEN_TRUONG"] =
        [
            "REPORT.VIEW", "REPORT.EXPORT"
        ],

        ["NHA_THAU"] =
        [
            "HOSODUTHAU.CREATE", "HOSODUTHAU.VIEW", "NHATHAU.VIEW"
        ],
    };

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        await SeedRolesAsync(context, logger);
        await SeedAdminAccountAsync(context, logger);
        await SeedPermissionsAsync(context, logger);
        await SeedRolePermissionsAsync(context, logger);
    }

    private static async Task SeedRolesAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (tenVaiTro, moTa) in DefaultRoles)
        {
            var exists = await context.VaiTros.AnyAsync(v => v.TenVaiTro == tenVaiTro);
            if (!exists)
            {
                context.VaiTros.Add(new VaiTro { TenVaiTro = tenVaiTro, MoTa = moTa, DaXoa = false });
                logger.LogInformation("Seed: Tạo vai trò {TenVaiTro}", tenVaiTro);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedAdminAccountAsync(AppDbContext context, ILogger logger)
    {
        const string adminUsername = "admin";
        const string adminEmail = "admin@qlqtdt.local";
        const string adminPassword = "Admin@123456";
        const string adminFullName = "Quản Trị Viên Hệ Thống";

        var adminExists = await context.NguoiDungs.AnyAsync(u => u.TenDangNhap == adminUsername);
        if (adminExists)
        {
            logger.LogInformation("Seed: Tài khoản admin đã tồn tại, bỏ qua.");
            return;
        }

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

        var adminRole = await context.VaiTros.FirstOrDefaultAsync(v => v.TenVaiTro == "ADMIN");
        if (adminRole != null)
        {
            context.NguoiDungKhoaPhongVaiTros.Add(new NguoiDungKhoaPhongVaiTro
            {
                NguoiDungId = admin.Id,
                KhoaPhongId = null,
                VaiTroId = adminRole.Id,
                LaChinh = true
            });
            await context.SaveChangesAsync();
        }

        logger.LogInformation("Seed: Tạo tài khoản admin mặc định (username: {Username})", adminUsername);
    }

    private static async Task SeedPermissionsAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (maQuyen, tenQuyen) in DefaultPermissions)
        {
            // SQL Server dùng case-insensitive collation → tìm được dù tên cũ sai case
            var existing = await context.Quyens.FirstOrDefaultAsync(q => q.MaQuyen == maQuyen && !q.DaXoa);

            if (existing == null)
            {
                context.Quyens.Add(new Quyen { MaQuyen = maQuyen, TenQuyen = tenQuyen, DaXoa = false });
                logger.LogInformation("Seed: Tạo quyền {MaQuyen}", maQuyen);
            }
            else if (existing.MaQuyen != maQuyen)
            {
                // Chuẩn hóa về UPPERCASE nếu entry cũ bị sai format
                var oldMaQuyen = existing.MaQuyen;
                existing.MaQuyen = maQuyen;
                logger.LogInformation("Seed: Chuẩn hóa quyền {Old} -> {New}", oldMaQuyen, maQuyen);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedRolePermissionsAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (tenVaiTro, maCodes) in RolePermissionMap)
        {
            var vaiTro = await context.VaiTros.FirstOrDefaultAsync(v => v.TenVaiTro == tenVaiTro);
            if (vaiTro == null) continue;

            var hasMapping = await context.VaiTroQuyens.AnyAsync(vq => vq.VaiTroId == vaiTro.Id);
            if (hasMapping)
            {
                logger.LogInformation("Seed: Vai trò {TenVaiTro} đã có mapping quyền, bỏ qua.", tenVaiTro);
                continue;
            }

            var permIds = await context.Quyens
                .Where(q => maCodes.Contains(q.MaQuyen) && !q.DaXoa)
                .Select(q => q.Id)
                .ToListAsync();

            foreach (var permId in permIds)
            {
                context.VaiTroQuyens.Add(new VaiTroQuyen { VaiTroId = vaiTro.Id, QuyenId = permId });
            }

            await context.SaveChangesAsync();
            logger.LogInformation("Seed: Gán {Count} quyền cho vai trò {TenVaiTro}", permIds.Count, tenVaiTro);
        }
    }
}
