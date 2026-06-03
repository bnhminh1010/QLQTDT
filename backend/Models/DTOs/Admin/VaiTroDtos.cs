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
