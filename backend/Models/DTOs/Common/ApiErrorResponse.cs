namespace QLQTDT.Api.Models.DTOs.Common;

public class ApiErrorResponse
{
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int Status { get; set; }
    public string Error { get; set; } = null!;
    public string? Message { get; set; }
    public Dictionary<string, string>? Errors { get; set; }
    public string? Detail { get; set; }
}

public class MessageResponse
{
    public string Message { get; set; } = null!;
}
