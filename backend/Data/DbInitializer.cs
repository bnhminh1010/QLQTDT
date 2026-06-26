using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data;

/// <summary>
/// Khởi tạo dữ liệu mặc định cho hệ thống: vai trò + tài khoản Admin gốc + danh sách quyền + mapping.
/// Chạy idempotent — chỉ tạo dữ liệu nếu chưa tồn tại.
/// </summary>
public static class DbInitializer
{
    private static readonly (string MaVaiTro, string TenVaiTro, string MoTa)[] DefaultRoles =
    [
        ("ADMIN", "ADMIN", "Quản trị hệ thống — quản lý tài khoản, phân quyền, cấu hình"),
        ("KHOA_PHONG", "KHOA_PHONG", "Nhân viên hành chính khoa/phòng — khởi tạo đề xuất, upload hồ sơ"),
        ("BCN_KHOA_PHONG", "BCN_KHOA_PHONG", "Ban chủ nhiệm khoa/phòng — xem/duyệt hồ sơ nội bộ"),
        ("KE_TOAN_TRUONG", "KE_TOAN_TRUONG", "Kế toán trưởng — kiểm tra nguồn vốn, xác nhận dự toán"),
        ("TONG_PHAP_CHE", "TONG_PHAP_CHE", "Tổ pháp chế — kiểm tra tính pháp lý, điều phối quy trình"),
        ("VIEN_TRUONG", "VIEN_TRUONG", "Viện trưởng — theo dõi báo cáo tổng hợp"),
        ("BCN_HCQT", "BCN_HCQT", "Ban chủ nhiệm phòng HCQT — tạo workflow, xem hồ sơ toàn BV"),
        ("BAN_GIAM_DOC", "BAN_GIAM_DOC", "Ban Giám Đốc — theo dõi, phê duyệt và quản lý toàn diện"),
    ];

    // Union của DbInitializer + PermissionSeeder lists
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
        ("DEXUAT.ATTACH_FILE", "Đính kèm file đề xuất"),
        // Hợp đồng
        ("HOPDONG.CREATE",     "Tạo hợp đồng"),
        ("HOPDONG.VIEW",       "Xem hợp đồng"),
        ("HOPDONG.EDIT",       "Sửa hợp đồng"),
        ("HOPDONG.DELETE",     "Xóa hợp đồng"),
        ("HOPDONG.QUYETTOAN",  "Quyết toán hợp đồng"),
        // Báo cáo
        ("REPORT.VIEW",          "Xem báo cáo nội bộ"),
        ("REPORT.EXPORT",        "Xuất báo cáo"),
        ("REPORT.VIEW_INTERNAL", "Xem báo cáo nội bộ chi tiết"),
        ("REPORT.VIEW_ALL",      "Xem tất cả báo cáo"),
        // Gói thầu
        ("GOITHAU.CREATE",        "Tạo gói thầu"),
        ("GOITHAU.VIEW",          "Xem gói thầu"),
        ("GOITHAU.EDIT",          "Sửa gói thầu"),
        ("GOITHAU.DELETE",        "Xóa gói thầu"),
        ("GOITHAU.VIEW_INTERNAL", "Xem gói thầu nội bộ"),
        ("GOITHAU.VIEW_ALL",      "Xem tất cả gói thầu"),
        ("GOITHAU.UPDATE_STATUS", "Cập nhật trạng thái gói thầu"),
        ("GOITHAU.START_WORKFLOW", "Khởi động quy trình"),
        ("GOITHAU.VIEW_STATUS_HISTORY", "Xem lịch sử trạng thái gói thầu"),
        ("GOITHAU.DISABLE",       "Tắt / ẩn gói thầu"),
        // Hồ sơ dự thầu
        ("HOSODUTHAU.CREATE", "Tạo hồ sơ dự thầu"),
        ("HOSODUTHAU.VIEW",   "Xem hồ sơ dự thầu"),
        ("HOSODUTHAU.EDIT",   "Sửa hồ sơ dự thầu"),
        ("HOSODUTHAU.DELETE", "Xóa hồ sơ dự thầu"),
        ("HOSODUTHAU.EVALUATE", "Đánh giá hồ sơ"),
        ("HOSODUTHAU.AWARD",  "Trao giải thầu"),
        // Workflow
        ("WORKFLOW.CREATE",   "Tạo workflow"),
        ("WORKFLOW.VIEW",     "Xem workflow"),
        ("WORKFLOW.UPDATE",   "Sửa workflow"),
        ("WORKFLOW.DELETE",   "Xóa workflow"),
        ("WORKFLOW.DISABLE",  "Tắt / ẩn workflow"),
        ("WORKFLOW.VIEW_ALL", "Xem tất cả workflow"),
        ("WORKFLOW.CHOOSE",   "Chọn workflow áp dụng"),
        ("WORKFLOW.CONFIG",   "Cấu hình workflow"),
        ("WORKFLOW.PROCESS",  "Xử lý workflow"),
        ("WORKFLOW.ROLLBACK", "Hoàn tác bước"),
        ("WORKFLOW.REASSIGN", "Gán lại công việc"),
        // Nhà thầu
        ("NHATHAU.CREATE", "Tạo nhà thầu"),
        ("NHATHAU.VIEW",   "Xem nhà thầu"),
        ("NHATHAU.EDIT",   "Sửa nhà thầu"),
        ("NHATHAU.DELETE", "Xóa nhà thầu"),
        // Hồ sơ năng lực nhà thầu
        ("HOSONANGLUC.VIEW", "Xem hồ sơ năng lực nhà thầu"),
        ("HOSONANGLUC.CREATE", "Tải lên hồ sơ năng lực nhà thầu"),
        ("HOSONANGLUC.DELETE", "Xóa hồ sơ năng lực nhà thầu"),
        // Người dùng
        ("USER.CREATE",   "Tạo người dùng"),
        ("USER.VIEW",     "Xem người dùng"),
        ("USER.UPDATE",   "Sửa người dùng"),
        ("USER.DELETE",   "Xóa người dùng"),
        ("USER.DISABLE",  "Tắt hoạt động tài khoản"),
        ("USER.LOCK",     "Khóa người dùng"),
        ("USER.VIEW_ALL", "Xem tất cả người dùng"),
        // Vai trò (quản trị)
        ("ROLE.CREATE",   "Tạo vai trò"),
        ("ROLE.VIEW",     "Xem vai trò"),
        ("ROLE.UPDATE",   "Sửa vai trò"),
        ("ROLE.DELETE",   "Xóa vai trò"),
        ("ROLE.DISABLE",  "Tắt / ẩn vai trò"),
        ("ROLE.VIEW_ALL", "Xem tất cả vai trò"),
        // Quyền (quản trị)
        ("QUYEN.CREATE",   "Tạo quyền"),
        ("QUYEN.VIEW",     "Xem quyền"),
        ("QUYEN.UPDATE",   "Sửa quyền"),
        ("QUYEN.DELETE",   "Xóa quyền"),
        ("QUYEN.DISABLE",  "Tắt / ẩn quyền"),
        ("QUYEN.VIEW_ALL", "Xem tất cả quyền"),
        // Phân quyền
        ("ROLE_PERMISSION.ASSIGN", "Phân quyền cho vai trò"),
        ("ROLE_PERMISSION.REVOKE", "Thu hồi quyền vai trò"),
        ("ROLE_PERMISSION.VIEW",   "Xem phân quyền vai trò"),
        // Audit log
        ("AUDIT.VIEW",          "Xem audit log nội bộ"),
        ("AUDIT.VIEW_INTERNAL", "Xem audit log nội bộ chi tiết"),
        ("AUDIT.VIEW_ALL",      "Xem toàn bộ audit log"),
        // Tài liệu
        ("TAILIEU.UPLOAD",   "Upload tài liệu"),
        ("TAILIEU.DOWNLOAD", "Download tài liệu"),
        ("TAILIEU.VIEW",     "Xem tài liệu"),
        ("TAILIEU.UPDATE",   "Cập nhật tài liệu"),
        ("TAILIEU.DELETE",   "Xóa tài liệu"),
        // Danh mục
        ("DANHMUC.CREATE",   "Tạo danh mục"),
        ("DANHMUC.UPDATE",   "Sửa danh mục"),
        ("DANHMUC.DELETE",   "Xóa danh mục"),
        ("DANHMUC.DISABLE",  "Tắt / ẩn danh mục"),
        ("DANHMUC.VIEW",     "Xem danh mục"),
        ("DANHMUC.VIEW_ALL", "Xem tất cả danh mục"),
        ("DANHMUC.CONFIG",   "Tùy chỉnh nội dung danh mục"),
    ];

    private static readonly Dictionary<string, string> PermissionRenames = new()
    {
        ["USER.EDIT"] = "USER.UPDATE",
        ["ROLE.EDIT"] = "ROLE.UPDATE",
        ["QUYEN.EDIT"] = "QUYEN.UPDATE",
        ["WORKFLOW.EDIT"] = "WORKFLOW.UPDATE",
        ["DANHMUC.EDIT"] = "DANHMUC.UPDATE",
        ["TAILIEU.UPDATE_OLD"] = "TAILIEU.UPDATE",
    };

    private static readonly Dictionary<string, string[]> RolePermissionMap = new()
    {
        ["ADMIN"] = DefaultPermissions.Select(p => p.MaQuyen).ToArray(),

        ["KHOA_PHONG"] =
        [
            "DEXUAT.CREATE", "DEXUAT.VIEW", "DEXUAT.EDIT", "DEXUAT.DELETE", "DEXUAT.SUBMIT",
            "DEXUAT.ATTACH_FILE",
            "GOITHAU.CREATE", "GOITHAU.VIEW", "GOITHAU.UPDATE_STATUS", "GOITHAU.VIEW_STATUS_HISTORY",
            "WORKFLOW.VIEW", "WORKFLOW.CHOOSE",
            "REPORT.VIEW", "REPORT.VIEW_INTERNAL"
        ],

        ["BCN_KHOA_PHONG"] =
        [
            "DEXUAT.VIEW", "DEXUAT.APPROVE", "DEXUAT.REJECT",
            "GOITHAU.CREATE", "GOITHAU.VIEW_INTERNAL", "GOITHAU.VIEW", "GOITHAU.VIEW_STATUS_HISTORY",
            "REPORT.VIEW", "REPORT.VIEW_INTERNAL",
            "AUDIT.VIEW", "AUDIT.VIEW_INTERNAL"
        ],

        ["KE_TOAN_TRUONG"] =
        [
            "GOITHAU.CREATE", "GOITHAU.VIEW_ALL", "GOITHAU.VIEW", "GOITHAU.VIEW_STATUS_HISTORY",
            "HOPDONG.VIEW", "HOPDONG.QUYETTOAN",
            "REPORT.VIEW", "REPORT.VIEW_ALL", "REPORT.EXPORT",
            "AUDIT.VIEW_ALL"
        ],

        ["TONG_PHAP_CHE"] =
        [
            "DEXUAT.ATTACH_FILE",
            "GOITHAU.CREATE", "GOITHAU.VIEW", "GOITHAU.VIEW_ALL", "GOITHAU.EDIT", "GOITHAU.DELETE",
            "GOITHAU.UPDATE_STATUS", "GOITHAU.VIEW_STATUS_HISTORY", "GOITHAU.DISABLE",
            "HOSODUTHAU.CREATE", "HOSODUTHAU.VIEW", "HOSODUTHAU.EDIT", "HOSODUTHAU.DELETE",
            "HOSODUTHAU.EVALUATE", "HOSODUTHAU.AWARD",
            "HOSONANGLUC.VIEW", "HOSONANGLUC.CREATE", "HOSONANGLUC.DELETE",
            "WORKFLOW.VIEW", "WORKFLOW.CHOOSE",
            "NHATHAU.CREATE", "NHATHAU.VIEW", "NHATHAU.EDIT", "NHATHAU.DELETE",
            "HOPDONG.CREATE", "HOPDONG.VIEW", "HOPDONG.EDIT", "HOPDONG.DELETE", "HOPDONG.QUYETTOAN",
            "TAILIEU.UPLOAD", "TAILIEU.DOWNLOAD", "TAILIEU.VIEW", "TAILIEU.DELETE",
            "AUDIT.VIEW", "AUDIT.VIEW_ALL",
            "REPORT.VIEW", "REPORT.VIEW_ALL"
        ],

        ["VIEN_TRUONG"] =
        [
            "GOITHAU.CREATE", "GOITHAU.VIEW_ALL", "GOITHAU.VIEW", "GOITHAU.VIEW_STATUS_HISTORY",
            "REPORT.VIEW", "REPORT.VIEW_ALL", "REPORT.EXPORT",
            "AUDIT.VIEW", "AUDIT.VIEW_ALL"
        ],

        ["BCN_HCQT"] =
        [
            "WORKFLOW.CHOOSE",
            "GOITHAU.CREATE", "GOITHAU.VIEW", "GOITHAU.VIEW_STATUS_HISTORY",
            "REPORT.VIEW", "REPORT.VIEW_ALL",
            "AUDIT.VIEW", "AUDIT.VIEW_ALL"
        ],

        ["BAN_GIAM_DOC"] =
        [
            "DEXUAT.VIEW",
            "GOITHAU.CREATE", "GOITHAU.VIEW", "GOITHAU.VIEW_ALL", "GOITHAU.EDIT", "GOITHAU.DELETE",
            "GOITHAU.UPDATE_STATUS", "GOITHAU.VIEW_STATUS_HISTORY", "GOITHAU.DISABLE",
            "HOPDONG.CREATE", "HOPDONG.VIEW", "HOPDONG.EDIT", "HOPDONG.DELETE", "HOPDONG.QUYETTOAN",
            "WORKFLOW.CHOOSE",
            "REPORT.VIEW", "REPORT.VIEW_ALL", "REPORT.EXPORT",
            "AUDIT.VIEW", "AUDIT.VIEW_ALL",
            "TAILIEU.UPLOAD", "TAILIEU.DOWNLOAD", "TAILIEU.VIEW",
            "NHATHAU.VIEW",
            "HOSODUTHAU.VIEW", "HOSODUTHAU.AWARD",
        ],
    };

    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        await SeedRolesAsync(context, logger);
        await SeedKhoaPhongAsync(context, logger);
        await SeedData.HinhThucDauThauSeeder.SeedAsync(context, logger);
        await SeedData.NhomVaiTroSeeder.SeedAsync(context, logger);
        await SeedAdminAccountAsync(context, logger);
        await RenamePermissionsAsync(context, logger);
        await SeedPermissionsAsync(context, logger);
        await SeedRolePermissionsAsync(context, logger);
        await SeedData.WorkflowTemplateSeeder.SeedAsync(context, logger);
    }

    private static async Task SeedRolesAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (maVaiTro, tenVaiTro, moTa) in DefaultRoles)
        {
            var exists = await context.VaiTros.AnyAsync(v => v.MaVaiTro == maVaiTro);
            if (!exists)
            {
                context.VaiTros.Add(new VaiTro
                {
                    MaVaiTro = maVaiTro,
                    TenVaiTro = tenVaiTro,
                    MoTa = moTa,
                    DaXoa = false
                });
                logger.LogInformation("Seed: Tạo vai trò {MaVaiTro}", maVaiTro);
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
        const string adminFullName = "Quản Trị Viên Hệ Thống";

        var adminPassword = Environment.GetEnvironmentVariable("ADMIN_DEFAULT_PASSWORD");
        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            if (env != null && env != "Development")
            {
                logger.LogWarning(
                    "Seed: Bỏ qua tạo admin — ADMIN_DEFAULT_PASSWORD chưa được cấu hình trong môi trường {Env}.",
                    env);
                return;
            }

            adminPassword = "Admin@123456";
            logger.LogWarning("Seed: Đang dùng mật khẩu admin mặc định. " +
                "Hãy set ADMIN_DEFAULT_PASSWORD trong môi trường production.");
        }

        var adminExists = await context.NguoiDungs.AnyAsync(u => u.TenDangNhap == adminUsername);
        if (adminExists)
        {
            logger.LogInformation("Seed: Tài khoản admin đã tồn tại, bỏ qua.");
            return;
        }

        var defaultKhoaPhong = await context.KhoaPhongs.FirstAsync();

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

        var adminRole = await context.VaiTros.FirstOrDefaultAsync(v => v.MaVaiTro == "ADMIN");
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

    private static async Task RenamePermissionsAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (oldCode, newCode) in PermissionRenames)
        {
            var existing = await context.Quyens
                .FirstOrDefaultAsync(q => q.MaQuyen == oldCode && !q.DaXoa);
            if (existing == null) continue;

            var newExists = await context.Quyens.AnyAsync(q => q.MaQuyen == newCode && !q.DaXoa);
            if (newExists)
            {
                logger.LogInformation("Seed: {NewCode} đã tồn tại, xóa bản cũ {OldCode}", newCode, oldCode);
                existing.DaXoa = true;
            }
            else
            {
                existing.MaQuyen = newCode;
                logger.LogInformation("Seed: Đổi tên quyền {Old} -> {New}", oldCode, newCode);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedPermissionsAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (maQuyen, tenQuyen) in DefaultPermissions)
        {
            var existing = await context.Quyens.FirstOrDefaultAsync(q => q.MaQuyen == maQuyen && !q.DaXoa);

            if (existing == null)
            {
                context.Quyens.Add(new Quyen { MaQuyen = maQuyen, TenQuyen = tenQuyen, DaXoa = false });
                logger.LogInformation("Seed: Tạo quyền {MaQuyen}", maQuyen);
            }
            else if (existing.MaQuyen != maQuyen)
            {
                var oldMaQuyen = existing.MaQuyen;
                existing.MaQuyen = maQuyen;
                logger.LogInformation("Seed: Chuẩn hóa quyền {Old} -> {New}", oldMaQuyen, maQuyen);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedRolePermissionsAsync(AppDbContext context, ILogger logger)
    {
        foreach (var (maVaiTro, maCodes) in RolePermissionMap)
        {
            var vaiTro = await context.VaiTros.FirstOrDefaultAsync(v => v.MaVaiTro == maVaiTro);
            if (vaiTro == null) continue;

            var existingPermIds = await context.VaiTroQuyens
                .Where(vq => vq.VaiTroId == vaiTro.Id)
                .Select(vq => vq.QuyenId)
                .ToListAsync();

            var targetPermIds = await context.Quyens
                .Where(q => maCodes.Contains(q.MaQuyen) && !q.DaXoa)
                .Select(q => q.Id)
                .ToListAsync();

            var newPermIds = targetPermIds.Except(existingPermIds).ToList();
            var stalePermIds = existingPermIds.Except(targetPermIds).ToList();

            if (stalePermIds.Count > 0)
            {
                await context.VaiTroQuyens
                    .Where(vq => vq.VaiTroId == vaiTro.Id && stalePermIds.Contains(vq.QuyenId))
                    .ExecuteDeleteAsync();
            }

            foreach (var permId in newPermIds)
            {
                context.VaiTroQuyens.Add(new VaiTroQuyen { VaiTroId = vaiTro.Id, QuyenId = permId });
            }

            await context.SaveChangesAsync();
            logger.LogInformation(
                "Seed: Đồng bộ quyền vai trò {MaVaiTro}: thêm {Added}, xóa {Removed}",
                maVaiTro,
                newPermIds.Count,
                stalePermIds.Count);
        }
    }
}
