namespace QLQTDT.Api.Models.DTOs.Dashboard;

/// <summary>Dashboard tổng quan</summary>
public class DashboardTongQuanDto
{
    public int TongGoiThau { get; set; }
    public int DangXuLy { get; set; }
    public int HoanThanh { get; set; }
    public int QuaHan { get; set; }
    public decimal? TongNganSach { get; set; }
    public GoiThauHienTaiDto? GoiThauNoiBat { get; set; }
    public List<DashboardThongKeDto> ThongKeThang { get; set; } = [];
    public List<DashboardPhanBoDto> PhanBoTrangThai { get; set; } = [];
}

/// <summary>Gói thầu nổi bật (đang xử lý / song song)</summary>
public class GoiThauHienTaiDto
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string? TenKhoaPhong { get; set; }
    public string TrangThai { get; set; } = null!;
    public int TongSoBuoc { get; set; }
    public int SoBuocHoanThanh { get; set; }
    public double PhanTramHoanThanh { get; set; }
    [System.Text.Json.Serialization.JsonIgnore(Condition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull)]
    public List<NhanhSongSongDto>? NhanhSongSong { get; set; }
}

/// <summary>Nhánh song song (hiển thị trên dashboard)</summary>
public class NhanhSongSongDto
{
    public string TenNhanh { get; set; } = null!;
    public int TongSoBuoc { get; set; }
    public int SoBuocHoanThanh { get; set; }
    public string BuocHienTai { get; set; } = null!;
    public string? NguoiXuLy { get; set; }
    public string TrangThai { get; set; } = null!;
}

/// <summary>Thống kê theo tháng cho dashboard</summary>
public class DashboardThongKeDto
{
    public int Thang { get; set; }
    public int Nam { get; set; }
    public int SoLuong { get; set; }
}

/// <summary>Phân bố trạng thái gói thầu</summary>
public class DashboardPhanBoDto
{
    public string TrangThai { get; set; } = null!;
    public int SoLuong { get; set; }
}
