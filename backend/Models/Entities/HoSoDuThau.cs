namespace QLQTDT.Api.Models.Entities;

public static class HoSoDuThauTrangThai
{
    public const string CHUA_XU_LY = "CHUA_XU_LY";
    public const string DA_DUYET = "DA_DUYET";
    public const string BI_TU_CHOI = "BI_TU_CHOI";
    public const string TRUNG_THAU = "TRUNG_THAU";

    // Các trạng thái có thể set thủ công (TRUNG_THAU chỉ set qua award endpoint)
    public static readonly string[] CoTheCapNhat = [CHUA_XU_LY, DA_DUYET, BI_TU_CHOI];
    public static readonly string[] All = [CHUA_XU_LY, DA_DUYET, BI_TU_CHOI, TRUNG_THAU];
}

public class HoSoDuThau
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public int NhaThauId { get; set; }
    public decimal GiaDuThau { get; set; }
    public decimal? GiaTrungThau { get; set; }
    public string TrangThai { get; set; } = HoSoDuThauTrangThai.CHUA_XU_LY;
    public string? GhiChu { get; set; }

    // Danh gia ho so
    public decimal? DiemDanhGia { get; set; }
    public string? NhanXet { get; set; }

    public DateTime NgayNop { get; set; }
    public DateTime? NgayCapNhat { get; set; }

    public GoiThau? GoiThau { get; set; }
    public NhaThau? NhaThau { get; set; }
    public ICollection<TaiLieuHoSo> TaiLieus { get; set; } = [];
}
