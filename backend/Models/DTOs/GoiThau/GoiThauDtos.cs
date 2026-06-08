using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.DTOs.GoiThau;

public class CreateGoiThauDto
{
    public string TenGoiThau { get; set; } = null!;
    [MaxLength(1000)]
    public string? MoTa { get; set; }
    public int? DeXuatId { get; set; }
    public decimal? NganSach { get; set; }
}

public class UpdateGoiThauDto
{
    public string TenGoiThau { get; set; } = null!;
    [MaxLength(1000)]
    public string? MoTa { get; set; }
    public decimal? NganSach { get; set; }
}

public class GoiThauDto
{
    public int Id { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public decimal? NganSach { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayTao { get; set; }
}

public class GoiThauDetailDto
{
    public int Id { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string? MoTa { get; set; }
    public int? DeXuatId { get; set; }
    public decimal? NganSach { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayTao { get; set; }
    public DateTime? NgayCapNhat { get; set; }
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
