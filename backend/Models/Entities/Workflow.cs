namespace QLQTDT.Api.Models.Entities;

public class Workflow : IBaseEntity
{
    public int Id { get; set; }
    public string MaWorkflow { get; set; } = null!;
    public string TenWorkflow { get; set; } = null!;
    public int HinhThucId { get; set; }
    public HinhThucDauThau HinhThuc { get; set; } = null!;
    public bool TrangThaiHoatDong { get; set; }

    // ── Designer extensions ──────────────────────────────────
    public string? LoaiHinhDauThau { get; set; }
    public string? PhamViApDung { get; set; }
    public string? MoTaNgan { get; set; }
    public bool LaQuyTrinhChuan { get; set; }
    public int? BuocBatDauId { get; set; }
    public int? BuocKetThucId { get; set; }

    public ICollection<BuocWorkflow> BuocWorkflows { get; set; } = [];
    public ICollection<NhomNhanhWorkflow> NhomNhanhWorkflows { get; set; } = [];
}
