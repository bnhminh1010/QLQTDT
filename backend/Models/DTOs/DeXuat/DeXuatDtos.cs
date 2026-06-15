namespace QLQTDT.Api.Models.DTOs.DeXuat;

// === Request DTOs ===

public class CreateDeXuatDto
{
    public string TieuDe { get; set; } = null!;
    public string? MoTa { get; set; }
    public int KhoaPhongId { get; set; }
    // TongDuToan — server tự tính, KHÔNG nhận từ client
    public List<ChiTietDeXuatDto> ChiTiet { get; set; } = [];
}

public class UpdateDeXuatDto
{
    public string TieuDe { get; set; } = null!;
    public string? MoTa { get; set; }
    // Không cho đổi KhoaPhongId
    public List<ChiTietDeXuatDto> ChiTiet { get; set; } = [];
}

public class ChiTietDeXuatDto
{
    public string MaVatTu { get; set; } = null!;
    public string TenVatTu { get; set; } = null!;
    public string? DonViTinh { get; set; }
    public decimal SoLuong { get; set; }
    public decimal DonGiaDuToan { get; set; }
}

public class ApproveDeXuatDto
{
    public string? GhiChu { get; set; }
}

public class RejectDeXuatDto
{
    public string LyDo { get; set; } = null!;
}

public class DeXuatQueryParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? TrangThai { get; set; }
    public int? KhoaPhongId { get; set; }
    public string? TuKhoa { get; set; }
    public DateTime? TuNgay { get; set; }
    public DateTime? DenNgay { get; set; }
}

// === Response DTOs ===

public class DeXuatResponseDto
{
    public long Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public string MaDeXuat { get; set; } = null!;
    public string TieuDe { get; set; } = null!;
    public string? MoTa { get; set; }
    public int KhoaPhongId { get; set; }
    public string TenKhoaPhong { get; set; } = null!;
    public int NguoiDeXuatId { get; set; }
    public string TenNguoiDeXuat { get; set; } = null!;
    public decimal TongDuToan { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayDeXuat { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public List<ChiTietResponseDto>? ChiTiet { get; set; }
}

public class ChiTietResponseDto
{
    public long Id { get; set; }
    public string MaVatTu { get; set; } = null!;
    public string TenVatTu { get; set; } = null!;
    public string? DonViTinh { get; set; }
    public decimal SoLuong { get; set; }
    public decimal DonGiaDuToan { get; set; }
    public decimal ThanhTien { get; set; }
}
