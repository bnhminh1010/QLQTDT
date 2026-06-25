using QLQTDT.Api.Models.DTOs.BaoCao;

namespace QLQTDT.Api.Services;

public interface IBaoCaoService
{
    /// <summary>Danh sách gói thầu theo filter (user bị giới hạn chỉ xem khoa/phòng của mình)</summary>
    Task<BaoCaoGoiThauResponse> GetGoiThauListAsync(int userId, BaoCaoGoiThauFilterDto filter);

    /// <summary>Tổng hợp KPI, thống kê theo đơn vị, tháng, hình thức</summary>
    Task<BaoCaoTongHopDto> GetTongHopAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);

    /// <summary>Chi tiêu giải ngân theo từng khoa (REPORT.VIEW_ALL)</summary>
    Task<List<BaoCaoChiTieuTheoKhoaDto>> GetChiTieuTheoKhoaAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);

    /// <summary>Xuất CSV báo cáo tổng hợp (REPORT.EXPORT)</summary>
    Task<byte[]> ExportCsvAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);
}
