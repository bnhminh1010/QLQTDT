namespace QLQTDT.Api.Models.DTOs.Quyen;

/// <summary>
/// DTO cho tạo mới Quyền
/// </summary>
public class CreateQuyenDto
{
    public string MaQuyen { get; set; } = null!;
    public string TenQuyen { get; set; } = null!;
}

/// <summary>
/// DTO cho cập nhật Quyền (chỉ cho phép sửa TenQuyen)
/// </summary>
public class UpdateQuyenDto
{
    public string TenQuyen { get; set; } = null!;
}
