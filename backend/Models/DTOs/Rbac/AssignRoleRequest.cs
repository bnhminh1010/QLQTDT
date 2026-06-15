using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.DTOs.Rbac;

public class AssignRoleRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int KhoaPhongId { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int VaiTroId { get; set; }

    public bool LaChinh { get; set; } = true;
}
