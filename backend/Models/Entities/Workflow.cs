using QLQTDT.Api.Models;

namespace QLQTDT.Api.Models.Entities;

public class Workflow : IBaseEntity
{
    public int Id { get; set; }
    public string MaWorkflow { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;

    public HinhThucDauThau? HinhThucDauThau { get; set; }
    public ICollection<BuocWorkflow> BuocWorkflows { get; set; } = [];
}
