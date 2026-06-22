namespace QLQTDT.Api.Models.Entities;

public class ChuyenTiepWorkflow : IBaseEntity
{
    public int Id { get; set; }
    public int TuBuocId { get; set; }
    public int DenBuocId { get; set; }
    public string HanhDong { get; set; } = null!;
    public string? DieuKien { get; set; }

    // ── Designer extensions ────────────────────────────────
    public string DieuKienKichHoat { get; set; } = "LUON";   // LUON / THEO_KET_QUA / THEO_VAI_TRO
    public string? KetQuaApDung { get; set; }
    public int? VaiTroApDungId { get; set; }
    public bool BatBuocGhiChu { get; set; }
    public bool BatBuocTaiLieu { get; set; }
    public string? HuongXuLyKhongDuyet { get; set; }          // TRA_VE_BUOC_TRUOC / DUNG_QUY_TRINH

    public BuocWorkflow? TuBuoc { get; set; }
    public BuocWorkflow? DenBuoc { get; set; }
    public VaiTro? VaiTroApDung { get; set; }
}
