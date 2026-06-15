namespace QLQTDT.Api.Models;

public interface IBaseEntity
{
    int Id { get; set; }
}

public interface IHasCongKhaiId
{
    Guid IdCongKhai { get; set; }
}

public interface ISoftDeletable
{
    bool DaXoa { get; set; }
}
