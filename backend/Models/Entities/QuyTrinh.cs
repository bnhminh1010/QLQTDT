using QLQTDT.Api.Models;

namespace QLQTDT.Api.Models.Entities;

public class QuyTrinh : ISoftDeletable, IBaseEntity
{
	public int Id { get; set; }
	public string MaQuyTrinh { get; set; } = null!;
	public string TenQuyTrinh { get; set; } = null!;
	public string? MoTa { get; set; }
	public int? HinhThucDauThauId { get; set; }
	public bool TrangThaiHoatDong { get; set; } = true;
	public bool DaXoa { get; set; }
	public int? NguoiTaoId { get; set; }
	public int? NguoiCapNhatId { get; set; }
	public DateTime NgayTao { get; set; }
	public DateTime NgayCapNhat { get; set; }

	public HinhThucDauThau? HinhThucDauThau { get; set; }
	public NguoiDung? NguoiTao { get; set; }
	public NguoiDung? NguoiCapNhat { get; set; }
}
