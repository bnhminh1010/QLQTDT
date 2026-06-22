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

    // ── Designer extensions ────────────────────────────────
    public int ThuTu { get; set; }
    public string? NhomGiaiDoan { get; set; }
    public string? MoTa { get; set; }
    public int? DonViXuLyId { get; set; }           // FK → KhoaPhong
    public int? DonViKyHoSoId { get; set; }          // FK → KhoaPhong
    public bool BatBuocGhiChu { get; set; }
    public bool BatBuocTaiLieu { get; set; }
    public bool BatBuocKyTruocChuyenBuoc { get; set; } = true;
    public bool BatBuocDungSLA { get; set; }
    public int? NhanhWorkflowId { get; set; }         // nullable — steps inside a branch

    // ── Giữ nguyên ────────────────────────────────────────
    public bool ChoPhepTuChoi { get; set; } = true;
    public bool ChoPhepBoQua { get; set; }
    public bool WorkflowDuocChonThuCong { get; set; }
    public string? LyDoChonWorkflow { get; set; }

    // Navigation
    public Workflow? Workflow { get; set; }
    public VaiTro? VaiTroXuLyHoSo { get; set; }
    public VaiTro? VaiTroKyDuyet { get; set; }
    public KhoaPhong? DonViXuLy { get; set; }
    public KhoaPhong? DonViKyHoSo { get; set; }
    public NhanhWorkflow? NhanhWorkflow { get; set; }
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDi { get; set; } = [];
    public ICollection<ChuyenTiepWorkflow> ChuyenTiepDen { get; set; } = [];
    public ICollection<WorkflowStepInstance> WorkflowStepInstances { get; set; } = [];
}
