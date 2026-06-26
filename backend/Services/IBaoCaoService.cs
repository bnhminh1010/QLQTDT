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

    /// <summary>Thống kê tiến độ workflow step (REPORT.VIEW_ALL)</summary>
    Task<List<WorkflowStepReportDto>> GetStepReportAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);

    /// <summary>Phân tích tiết kiệm ngân sách theo khoa (REPORT.VIEW_ALL)</summary>
    Task<List<BaoCaoTietKiemDto>> GetTietKiemAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);

    /// <summary>Hiệu suất xử lý của người dùng (REPORT.VIEW_ALL)</summary>
    Task<List<BaoCaoHieuSuatNguoiDungDto>> GetHieuSuatNguoiDungAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);

    /// <summary>Bottleneck workflow (REPORT.VIEW_ALL)</summary>
    Task<List<WorkflowBottleneckDto>> GetWorkflowBottleneckAsync(int userId, DateTime? tuNgay, DateTime? denNgay, int? hinhThucId);
}
