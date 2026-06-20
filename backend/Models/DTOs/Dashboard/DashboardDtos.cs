namespace QLQTDT.Api.Models.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int TongGoiThau { get; set; }
    public Dictionary<string, int> TrangThai { get; set; } = [];
    public decimal TongGiaTriDuToan { get; set; }
    public decimal TongGiaTrungThau { get; set; }
    public decimal TiLeTietKiem { get; set; }
}

public class DashboardStatisticsDto
{
    public IReadOnlyList<DashboardMonthlyStatisticDto> TheoThang { get; set; } = [];
    public IReadOnlyList<DashboardDepartmentStatisticDto> TheoKhoaPhong { get; set; } = [];
    public IReadOnlyList<DashboardMethodStatisticDto> TheoHinhThuc { get; set; } = [];
}

public class DashboardMonthlyStatisticDto
{
    public int Thang { get; set; }
    public int SoLuong { get; set; }
    public decimal TongGiaTri { get; set; }
}

public class DashboardDepartmentStatisticDto
{
    public string KhoaPhong { get; set; } = string.Empty;
    public int SoLuong { get; set; }
    public decimal TongGiaTri { get; set; }
}

public class DashboardMethodStatisticDto
{
    public string HinhThuc { get; set; } = string.Empty;
    public int SoLuong { get; set; }
    public decimal TiLe { get; set; }
}

public class DashboardPendingDto
{
    public int TongHoSo { get; set; }
    public Dictionary<string, int> TrangThai { get; set; } = [];
    public int ChuaXuLy { get; set; }
    public int DaDuyet { get; set; }
    public int BiTuChoi { get; set; }
    public int TrungThau { get; set; }
}

public class DashboardExportFile
{
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}

