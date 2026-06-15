namespace QLQTDT.Api.Models.Entities;

public class Quyen : IBaseEntity, ISoftDeletable
{
    public int Id { get; set; }
    public string MaQuyen { get; set; } = null!;
    public string TenQuyen { get; set; } = null!;
    public bool DaXoa { get; set; }

    public ICollection<VaiTroQuyen> VaiTroQuyens { get; set; } = [];
}
