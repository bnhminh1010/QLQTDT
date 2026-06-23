using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.DTOs.GoiThau;

public class CreateGoiThauDto
{
    [Required]
    [MaxLength(255)]
    public string TenGoiThau { get; set; } = null!;

    [MaxLength(1000)]
    public string? MoTa { get; set; }

    public int? DeXuatId { get; set; }

    public decimal? NganSach { get; set; }

    /// <summary>Required. FK to HinhThucDauThau.</summary>
    public int HinhThucId { get; set; }

    /// <summary>FK to KhoaPhong. Auto-resolved from current user if omitted.</summary>
    public int? KhoaPhongId { get; set; }

    /// <summary>Nguồn vốn: Ngân sách Nhà nước, Ngân sách BV, Tự chủ tài chính, Nguồn khác</summary>
    [MaxLength(200)]
    public string? NguonVon { get; set; }

    /// <summary>Loại gói thầu: Hàng hóa, Dịch vụ tư vấn, Dịch vụ phi tư vấn, Xây lắp</summary>
    [MaxLength(100)]
    public string? LoaiGoiThau { get; set; }

    /// <summary>Căn cứ/lý do áp dụng quy trình rút gọn.</summary>
    [MaxLength(1000)]
    public string? CanCuApDungRutGon { get; set; }

    /// <summary>JSON array of theo dõi items: ["Khoa/Phòng mua sắm", "BCN"]</summary>
    public string? TheoDoi { get; set; }
}

public class UpdateGoiThauDto
{
    [Required]
    [MaxLength(255)]
    public string TenGoiThau { get; set; } = null!;

    [MaxLength(1000)]
    public string? MoTa { get; set; }

    public decimal? NganSach { get; set; }

    public int? HinhThucId { get; set; }

    [MaxLength(200)]
    public string? NguonVon { get; set; }

    [MaxLength(100)]
    public string? LoaiGoiThau { get; set; }

    /// <summary>Căn cứ/lý do áp dụng quy trình rút gọn.</summary>
    [MaxLength(1000)]
    public string? CanCuApDungRutGon { get; set; }

    public string? TheoDoi { get; set; }
}

public class GoiThauDto
{
    public int Id { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public decimal? NganSach { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public int? KhoaPhongId { get; set; }
    public string? TenKhoaPhong { get; set; }
    public int? HinhThucId { get; set; }
    public string? TenHinhThuc { get; set; }
}

public class GoiThauDetailDto
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? DeXuatId { get; set; }
    public decimal? NganSach { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public int? KhoaPhongId { get; set; }
    public int? HinhThucId { get; set; }
    public string? TenHinhThuc { get; set; }
    public string? NguonVon { get; set; }
    public string? LoaiGoiThau { get; set; }
    public string? CanCuApDungRutGon { get; set; }
    public string? TheoDoi { get; set; }
    public int? WorkflowId { get; set; }
    public string? TenWorkflow { get; set; }
}

public class LichSuTrangThaiGoiThauDto
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public string? TrangThaiCu { get; set; }
    public string TrangThaiMoi { get; set; } = null!;
    public int? NguoiThayDoiId { get; set; }
    public DateTime ThoiGianThayDoi { get; set; }
}
