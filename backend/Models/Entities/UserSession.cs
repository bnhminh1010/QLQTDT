using System.ComponentModel.DataAnnotations;

namespace QLQTDT.Api.Models.Entities;

/// <summary>
/// Track active user sessions. Enforce concurrent session limit.
/// Created on login, removed on logout/force-delete.
/// </summary>
public class UserSession
{
    [Key]
    public int Id { get; set; }

    public int NguoiDungId { get; set; }

    /// <summary>JTI (JWT ID) — link to current access token.</summary>
    [MaxLength(100)]
    public string Jti { get; set; } = null!;

    [MaxLength(50)]
    public string? DiaChiIP { get; set; }

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    /// <summary>Refresh token hash (same family as current session).</summary>
    [MaxLength(100)]
    public string? RefreshTokenHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastActivityAt { get; set; }

    /// <summary>Logged out or force-deleted.</summary>
    public DateTime? RevokedAt { get; set; }

    public bool IsActive => RevokedAt == null;

    public NguoiDung? NguoiDung { get; set; }
}
