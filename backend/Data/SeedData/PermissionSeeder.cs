using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data.SeedData;

public static class PermissionSeeder
{
    private static readonly (string MaQuyen, string TenQuyen)[] DefaultPermissions =
    [
        ("DEXUAT.CREATE", "Tạo đề xuất"),
        ("DEXUAT.VIEW", "Xem đề xuất"),
        ("DEXUAT.EDIT", "Sửa đề xuất"),
        ("DEXUAT.DELETE", "Xóa đề xuất"),
        ("DEXUAT.SUBMIT", "Trình duyệt đề xuất"),
        ("DEXUAT.APPROVE", "Phê duyệt đề xuất"),
        ("DEXUAT.REJECT", "Từ chối đề xuất"),
        ("DEXUAT.ATTACH_FILE", "Đính kèm file đề xuất"),

        ("GOITHAU.CREATE", "Tạo gói thầu"),
        ("GOITHAU.VIEW", "Xem gói thầu"),
        ("GOITHAU.VIEW_INTERNAL", "Xem nội bộ gói thầu"),
        ("GOITHAU.VIEW_ALL", "Xem tất cả gói thầu"),
        ("GOITHAU.EDIT", "Sửa gói thầu"),
        ("GOITHAU.DELETE", "Xóa gói thầu"),
        ("GOITHAU.START_WORKFLOW", "Khởi động quy trình"),
        ("GOITHAU.UPDATE_STATUS", "Cập nhật trạng thái gói thầu"),

        ("HOSODUTHAU.VIEW", "Xem hồ sơ dự thầu"),
        ("HOSODUTHAU.CREATE", "Tạo hồ sơ dự thầu"),
        ("HOSODUTHAU.EVALUATE", "Đánh giá hồ sơ"),
        ("HOSODUTHAU.AWARD", "Trao giải thầu"),

        ("HOPDONG.CREATE", "Tạo hợp đồng"),
        ("HOPDONG.VIEW", "Xem hợp đồng"),
        ("HOPDONG.EDIT", "Sửa hợp đồng"),
        ("HOPDONG.DELETE", "Xóa hợp đồng"),
        ("HOPDONG.NGHIEM_THU", "Nghiệm thu"),
        ("HOPDONG.QUYET_TOAN", "Quyết toán"),

        ("NHATHAU.CREATE", "Tạo nhà thầu"),
        ("NHATHAU.VIEW", "Xem nhà thầu"),
        ("NHATHAU.EDIT", "Sửa nhà thầu"),

        ("WORKFLOW.CONFIG", "Cấu hình workflow"),
        ("WORKFLOW.PROCESS", "Xử lý workflow"),
        ("WORKFLOW.ROLLBACK", "Hoàn tác bước"),
        ("WORKFLOW.REASSIGN", "Gán lại công việc"),

        ("USER.CREATE", "Tạo người dùng"),
        ("USER.VIEW", "Xem người dùng"),
        ("USER.EDIT", "Sửa người dùng"),
        ("USER.LOCK", "Khóa tài khoản"),

        ("ROLE.CREATE", "Tạo vai trò"),
        ("ROLE.VIEW", "Xem vai trò"),
        ("ROLE.EDIT", "Sửa vai trò"),
        ("ROLE.DELETE", "Xóa vai trò"),

        ("REPORT.VIEW", "Xem báo cáo"),
        ("REPORT.VIEW_INTERNAL", "Xem báo cáo nội bộ"),
        ("REPORT.VIEW_ALL", "Xem tất cả báo cáo"),
        ("REPORT.EXPORT", "Xuất báo cáo"),

        ("AUDIT.VIEW", "Xem audit log"),
        ("AUDIT.VIEW_INTERNAL", "Xem audit nội bộ"),
        ("AUDIT.VIEW_ALL", "Xem tất cả audit"),

        ("TAILIEU.UPLOAD", "Tải lên tài liệu"),
        ("TAILIEU.DOWNLOAD", "Tải xuống tài liệu"),
        ("TAILIEU.DELETE", "Xóa tài liệu")
    ];

    
    public static async Task SeedPermissionsAsync(AppDbContext context, ILogger logger)
    {   
        foreach (var (maQuyen, tenQuyen) in DefaultPermissions)
        {
            var exists = await context.Quyens.AnyAsync(q => q.MaQuyen == maQuyen);
            if (!exists)
            {
                context.Quyens.Add(new Quyen
                {
                    MaQuyen = maQuyen,
                    TenQuyen = tenQuyen,
                    DaXoa = false
                });
                logger.LogInformation("Seed: Tạo quyền {MaQuyen}", maQuyen);
            }
        }
        await context.SaveChangesAsync();
    }
}