using System.Text.Json.Serialization;

namespace QLQTDT.Api.Models.Entities;

public class HinhThucDauThau : IBaseEntity
{
    public int Id { get; set; }
    public string MaHinhThuc { get; set; } = null!;
    public string TenHinhThuc { get; set; } = null!;
    public decimal? HanMucToiDa { get; set; }
    public bool TrangThaiHoatDong { get; set; } = true;

    // Computed — not mapped to DB
    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public int SoGoi { get; set; }

    [JsonIgnore]
    public ICollection<Workflow> Workflows { get; set; } = [];
}
