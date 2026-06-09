using System.Text.RegularExpressions;

namespace QLQTDT.Api.Helpers;

/// <summary>
/// Helper class chống XSS — phát hiện nội dung HTML/JS nguy hiểm trong input.
/// Chiến lược Defense in Depth:
///   - Layer 1 (Validator): ContainsDangerousContent() reject input → 400
///   - Layer 2 (Service): Sanitize() chỉ trim whitespace, KHÔNG encode — DB lưu plain text
/// </summary>
public static partial class InputSanitizer
{
    // Regex phát hiện HTML tags (bao gồm script, img, iframe, a, div, span, etc.)
    [GeneratedRegex(@"<[^>]*>", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex HtmlTagRegex();

    // Regex phát hiện các event handler JS (onclick, onerror, onload, etc.)
    [GeneratedRegex(@"on\w+\s*=", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex JsEventRegex();

    // Regex phát hiện javascript: protocol
    [GeneratedRegex(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex JsProtocolRegex();

    /// <summary>
    /// Kiểm tra chuỗi có chứa HTML tags hoặc JS injection patterns không.
    /// Trả về true nếu phát hiện nội dung nguy hiểm.
    /// </summary>
    public static bool ContainsDangerousContent(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return false;

        return HtmlTagRegex().IsMatch(input)
            || JsEventRegex().IsMatch(input)
            || JsProtocolRegex().IsMatch(input);
    }

    /// <summary>
    /// Trim whitespace. Layer 1 (ContainsDangerousContent) đã chặn XSS — không HtmlEncode ở đây
    /// vì encode trước khi lưu DB sẽ làm hỏng ký tự Unicode (tiếng Việt, v.v.).
    /// </summary>
    public static string Sanitize(string input)
    {
        return input.Trim();
    }
}
