namespace QLQTDT.Api.Models.DTOs.HoSoDuThau;

public class CreateHoSoDuThauRequest
{
    public int GoiThauId { get; set; }
    public int NhaThauId { get; set; }
    public decimal GiaDuThau { get; set; }
    public List<int> FileIds { get; set; } = [];
    public string? GhiChu { get; set; }
}

public class UpdateTrangThaiHoSoRequest
{
    public string TrangThai { get; set; } = null!;
}

public class AwardGoiThauRequest
{
    public int HoSoDuThauId { get; set; }
    public decimal GiaTrungThau { get; set; }
}

public class EvaluateHoSoRequest
{
    public decimal DiemDanhGia { get; set; }
    public string? NhanXet { get; set; }
}

public class GoiThauKetQuaDto
{
    public int GoiThauId { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string TrangThai { get; set; } = null!;
    public List<HoSoKetQuaDto> DanhSachHoSo { get; set; } = [];
    public HoSoKetQuaDto? HoSoTrungThau { get; set; }
}

public class HoSoKetQuaDto
{
    public int Id { get; set; }
    public string TenNhaThau { get; set; } = null!;
    public string MaSoThue { get; set; } = null!;
    public decimal GiaDuThau { get; set; }
    public decimal? GiaTrungThau { get; set; }
    public string TrangThai { get; set; } = null!;
    public decimal? DiemDanhGia { get; set; }
    public string? NhanXet { get; set; }
    public DateTime NgayNop { get; set; }
}

public class HoSoDuThauListItemDto
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public int NhaThauId { get; set; }
    public string TenNhaThau { get; set; } = null!;
    public string MaSoThue { get; set; } = null!;
    public decimal GiaDuThau { get; set; }
    public decimal? GiaTrungThau { get; set; }
    public string TrangThai { get; set; } = null!;
    public DateTime NgayNop { get; set; }
}

public class TaiLieuTomTatDto
{
    public int Id { get; set; }
    public string TenFile { get; set; } = null!;
    public long KichThuoc { get; set; }
    public string LoaiTaiLieu { get; set; } = null!;
    public string ContentType { get; set; } = null!;
}

public class HoSoDuThauDetailDto
{
    public int Id { get; set; }
    public int GoiThauId { get; set; }
    public string TenGoiThau { get; set; } = null!;
    public int NhaThauId { get; set; }
    public string TenNhaThau { get; set; } = null!;
    public string MaSoThue { get; set; } = null!;
    public decimal GiaDuThau { get; set; }
    public decimal? GiaTrungThau { get; set; }
    public string TrangThai { get; set; } = null!;
    public string? GhiChu { get; set; }
    public decimal? DiemDanhGia { get; set; }
    public string? NhanXet { get; set; }
    public DateTime NgayNop { get; set; }
    public DateTime? NgayCapNhat { get; set; }
    public List<TaiLieuTomTatDto> TaiLieus { get; set; } = [];
}

public class LichSuDauThauItemDto
{
    public int HoSoDuThauId { get; set; }
    public int GoiThauId { get; set; }
    public string MaGoiThau { get; set; } = null!;
    public string TenGoiThau { get; set; } = null!;
    public string TrangThaiGoiThau { get; set; } = null!;
    public decimal GiaDuThau { get; set; }
    public decimal? GiaTrungThau { get; set; }
    public string KetQua { get; set; } = null!;
    public DateTime NgayNop { get; set; }
    public DateTime? NgayCapNhat { get; set; }
}
