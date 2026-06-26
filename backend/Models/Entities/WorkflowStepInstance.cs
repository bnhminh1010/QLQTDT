namespace QLQTDT.Api.Models.Entities;

public class WorkflowStepInstance
{
    public long Id { get; set; }
    public long WorkflowInstanceId { get; set; }
    public int BuocWorkflowId { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayBatDau { get; set; }
    public DateTime? NgayHoanThanh { get; set; }

    // ── 2-pha: LAP_HO_SO → KY_DUYET ──────────────────────
    public string PhaHienTai { get; set; } = "LAP_HO_SO"; // LAP_HO_SO / KY_DUYET

    // Pha 1 — người xử lý hồ sơ
    public int? NguoiXuLyId { get; set; }
    public DateTime? NgayXuLy { get; set; }

    // Pha 2 — người ký duyệt
    public int? NguoiKyDuyetId { get; set; }
    public DateTime? NgayKyDuyet { get; set; }
    public string? NguoiXuLyText { get; set; }
    public string? NguoiKyDuyetText { get; set; }
    public string? KetQua { get; set; }           // DUYET / KHONG_DUYET
    public string? LyDoKhongDuyet { get; set; }

    // File attachments cho step
    public string? TaiLieuDinhKem { get; set; }   // JSON array of file paths

    public DateTime? HanXuLy { get; set; }
    public bool? QuaHan { get; set; }

    public string? GhiChu { get; set; }
    public byte[]? RowVersion { get; set; }

    // Navigation
    public WorkflowInstance? WorkflowInstance { get; set; }
    public BuocWorkflow? BuocWorkflow { get; set; }
    public NguoiDung? NguoiXuLy { get; set; }
    public NguoiDung? NguoiKyDuyet { get; set; }
    public ICollection<WorkflowAssignment> WorkflowAssignments { get; set; } = [];
}
