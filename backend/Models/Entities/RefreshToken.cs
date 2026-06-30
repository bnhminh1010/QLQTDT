using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.Entities;

public class RefreshToken
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Token { get; set; } = null!;

    public int NguoiDungId { get; set; }

    /// <summary>Family group — all rotated tokens share same family.</summary>
    public Guid TokenFamilyId { get; set; } = Guid.NewGuid();

    /// <summary>FK to the token this one replaced (self-reference).</summary>
    public int? ReplacedTokenId { get; set; }

    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => RevokedAt == null && !IsExpired;

    public NguoiDung? NguoiDung { get; set; }

    /// <summary>Token that replaced this one (linked by ReplacedTokenId).</summary>
    public RefreshToken? ReplacedBy { get; set; }
    /// <summary>Token this one replaced.</summary>
    public RefreshToken? ReplacedToken { get; set; }
}
