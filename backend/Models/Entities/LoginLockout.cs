namespace QLQTDT.Api.Models.Entities;

/// <summary>
/// Lưu trạng thái brute-force lockout per IP:Username.
/// Persistent qua restart — không bị mất khi khởi động lại backend.
/// </summary>
public class LoginLockout
{
    /// <summary>
    /// Primary key dạng "ip:username_lowercase", ví dụ "192.168.1.1:admin"
    /// </summary>
    public string Identifier { get; set; } = null!;

    /// <summary>
    /// Số lần đăng nhập sai tích lũy trong TrackingWindow
    /// </summary>
    public int FailedAttempts { get; set; }

    /// <summary>
    /// Thời điểm hết khóa. null = chưa bị khóa (đang tích lũy failed attempts)
    /// </summary>
    public DateTime? LockoutEnd { get; set; }

    /// <summary>
    /// Thời điểm lần đăng nhập sai gần nhất — dùng để cleanup bản ghi cũ
    /// </summary>
    public DateTime LastFailedAttempt { get; set; }
}
