namespace QLQTDT.Api.Services;

/// <summary>
/// Service kiểm tra quyền chi tiết (fine-grained permission) của người dùng.
/// Quyền được lấy từ chuỗi: NguoiDung → VaiTro → VaiTro_Quyen → Quyen.
/// Kết quả được cache per-request trong HttpContext.Items.
/// </summary>
public interface IPermissionService
{
    /// <summary>
    /// Kiểm tra người dùng có quyền cụ thể hay không.
    /// </summary>
    Task<bool> HasPermissionAsync(int userId, string permission);

    /// <summary>
    /// Lấy toàn bộ danh sách MaQuyen của người dùng (distinct, chỉ lấy active).
    /// </summary>
    Task<IReadOnlySet<string>> GetPermissionsAsync(int userId);
}
