using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.DTOs.Admin;

public class GanQuyenRequest
{
    [Required]
    public List<int>? PermissionIds { get; set; }
}

public class QuyenDto
{
    public int Id { get; set; }
    public string MaQuyen { get; set; } = null!;
    public string TenQuyen { get; set; } = null!;
}

public class VaiTroListItemDto
{
    public int Id { get; set; }
    public string MaVaiTro { get; set; } = null!;
    public string TenVaiTro { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? NhomVaiTroId { get; set; }
    public string? MaNhomVaiTro { get; set; }
    public string? TenNhomVaiTro { get; set; }
    public int? DoUuTienNhomVaiTro { get; set; }
}
