namespace QLQTDT.Api.Models.DTOs.BaoCao;

/// <summary>Filter cho báo cáo gói thầu</summary>
public class BaoCaoGoiThauFilterDto
{
    public int? KhoaPhongId { get; set; }
    public DateTime? TuNgay { get; set; }
    public DateTime? DenNgay { get; set; }
    public string? TrangThai { get; set; }
    public int? HinhThucId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>Dòng trong bảng báo cáo gói thầu (dùng cho user bị giới hạn khoa/phòng)</summary>
public class BaoCaoGoiThauItemDto
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string? TenHinhThuc { get; set; }
    public int? HinhThucId { get; set; }
    public decimal? GiaTri { get; set; }
    public string TrangThai { get; set; } = null!;
    public int TongSoBuoc { get; set; }
    public int SoBuocHoanThanh { get; set; }
    public double PhanTramHoanThanh { get; set; }
    public string? TenKhoaPhong { get; set; }
    public int? KhoaPhongId { get; set; }
    public DateTime? NgayTao { get; set; }
}

/// <summary>Thống kê gói thầu theo từng đơn vị (dùng cho user toàn quyền)</summary>
public class BaoCaoTheoDonViDto
{
    public int? KhoaPhongId { get; set; }
    public string TenKhoaPhong { get; set; } = null!;
    public int TongGoiThau { get; set; }
    public int DangXuLy { get; set; }
    public int HoanThanh { get; set; }
    public int DaHuy { get; set; }
    public decimal? TongGiaTri { get; set; }
}

/// <summary>Dữ liệu thống kê theo tháng</summary>
public class BaoCaoTheoThangDto
{
    public int Thang { get; set; }
    public int Nam { get; set; }
    public int SoLuong { get; set; }
}

/// <summary>Dữ liệu thống kê theo hình thức đấu thầu</summary>
public class BaoCaoTheoHinhThucDto
{
    public int HinhThucId { get; set; }
    public string TenHinhThuc { get; set; } = null!;
    public int SoLuong { get; set; }
    public decimal? TongGiaTri { get; set; }
}

/// <summary>KPI tổng hợp cho báo cáo & thống kê</summary>
public class BaoCaoTongHopDto
{
    public int TongGoiThau { get; set; }
    public int DangXuLy { get; set; }
    public int HoanThanh { get; set; }
    public int DaHuy { get; set; }
    public int QuaHan { get; set; }
    public decimal? TongNganSach { get; set; }
    public List<BaoCaoTheoDonViDto> TheoDonVi { get; set; } = [];
    public List<BaoCaoTheoThangDto> TheoThang { get; set; } = [];
    public List<BaoCaoTheoHinhThucDto> TheoHinhThuc { get; set; } = [];
}

/// <summary>Response danh sách gói thầu cho báo cáo</summary>
public class BaoCaoGoiThauResponse
{
    public List<BaoCaoGoiThauItemDto> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

/// <summary>Báo cáo tiến độ workflow step</summary>
public class WorkflowStepReportDto
{
    public string TenBuoc { get; set; } = null!;
    public int TongSo { get; set; }
    public int HoanThanh { get; set; }
    public int DangXuLy { get; set; }
    public int ChoDuyet { get; set; }
    public int QuaHan { get; set; }
    public double TiLeHoanThanh { get; set; }
}

/// <summary>Phân tích tiết kiệm ngân sách theo khoa/phòng</summary>
public class BaoCaoTietKiemDto
{
    public int? KhoaPhongId { get; set; }
    public string TenKhoaPhong { get; set; } = null!;
    public int TongGoiThau { get; set; }
    public decimal TongNganSach { get; set; }
    public decimal? TongGiaTriHopDong { get; set; }
    public decimal? TienTietKiem { get; set; }
    public double PhanTramTietKiem { get; set; }
}

/// <summary>Hiệu suất xử lý của từng người dùng</summary>
public class BaoCaoHieuSuatNguoiDungDto
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = null!;
    public string TenDangNhap { get; set; } = null!;
    public int TongBuocXuLy { get; set; }
    public int SoBuocHoanThanh { get; set; }
    public int SoBuocQuaHan { get; set; }
    public double ThoiGianXuLyTrungBinhGio { get; set; }
    public double TiLeQuaHan { get; set; }
}

/// <summary>Bottleneck workflow: thời gian + backlog theo từng bước</summary>
public class WorkflowBottleneckDto
{
    public string TenBuoc { get; set; } = null!;
    public int TongSo { get; set; }
    public int DangXuLy { get; set; }
    public int ChoDuyet { get; set; }
    public int HoanThanh { get; set; }
    public int QuaHan { get; set; }
    public double ThoiGianTrungBinhGio { get; set; }
    public string MucDoCanhBao { get; set; } = "OK"; // OK / WARN / CRITICAL
}

/// <summary>Báo cáo chi tiêu theo khoa (dành cho ADMIN/CAP_CAO)</summary>
public class BaoCaoChiTieuTheoKhoaDto
{
    public int? KhoaPhongId { get; set; }
    public string TenKhoaPhong { get; set; } = null!;
    public int TongGoiThau { get; set; }
    public decimal? TongNganSach { get; set; }
    public decimal? TongGiaiNgan { get; set; }
    public double PhanTramGiaiNgan { get; set; }
    public int DangXuLy { get; set; }
    public int HoanThanh { get; set; }
    public int DaHuy { get; set; }
}
