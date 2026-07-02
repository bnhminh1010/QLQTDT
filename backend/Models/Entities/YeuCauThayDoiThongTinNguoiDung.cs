namespace QLQTDT.Api.Models.Entities;

public class YeuCauThayDoiThongTinNguoiDung
{
    public int Id { get; set; }
    public Guid IdCongKhai { get; set; }
    public int NguoiDungId { get; set; }
    public string TrangThai { get; set; } = ProfileChangeRequestStatus.Pending;
    public string GiaTriCuJson { get; set; } = null!;
    public string GiaTriMoiJson { get; set; } = null!;
    public int? NguoiXuLyId { get; set; }
    public DateTime NgayTao { get; set; }
    public DateTime? NgayXuLy { get; set; }
    public string? LyDoTuChoi { get; set; }

    public NguoiDung? NguoiDung { get; set; }
    public NguoiDung? NguoiXuLy { get; set; }
}

public static class ProfileChangeRequestStatus
{
    public const string Pending = "PENDING";
    public const string Approved = "APPROVED";
    public const string Rejected = "REJECTED";
}
