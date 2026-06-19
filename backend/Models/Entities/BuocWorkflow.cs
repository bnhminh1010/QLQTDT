namespace QLQTDT.Api.Models.Entities;

public class BuocWorkflow : IBaseEntity
{
    public int Id { get; set; }
    public int WorkflowId { get; set; }
    public string MaBuoc { get; set; } = null!;
    public string TenBuoc { get; set; } = null!;
    public string LoaiBuoc { get; set; } = null!;

    // ── 2-pha: LAP_HO_SO → KY_DUYET ──────────────────────
    public int? VaiTroXuLyHoSoId { get; set; }
    public int SoNgayLapHoSo { get; set; }     // =0 nếu ko áp
    public int? VaiTroKyDuyetId { get; set; }
    public int SoNgayXuLy { get; set; }         // SLA cho ký duyệt

    // Deadline check: BAT_BUOC / CANH_BAO
    public string LoaiHan { get; set; } = "CANH_BAO";

    // Parallel / join branches
    public string? NhomSongSong { get; set; }
    public bool LaBuocJoin { get; set; }

    // ── Giữ nguyên ────────────────────────────────────────
    public bool ChoPhepTuChoi { get; set; } = true;
    public bool ChoPhepBoQua { get; set; }
    public bool WorkflowDuocChonThuCong { get; set; }
    public string? LyDoChonWorkflow { get; set; }

    // Navigation
    public Workflow? Workflow { get; set; }
    public VaiTro? VaiTroXuLyHoSo { get; set; }
    public VaiTro? VaiTroKyDuyet { get; set; }
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDi { get; set; } = [];
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDen { get; set; } = [];
    public ICollection<WorkflowStepInstance> WorkflowStepInstances { get; set; } = [];
}
