using System.Net;
using System.Text.RegularExpressions;
using System.Text.Encodings.Web;
using System.Text.Unicode;

namespace QLQTDT.Api.Helpers;

/// <summary>
/// Helper class chống XSS — phát hiện và vô hiệu hóa nội dung HTML/JS nguy hiểm trong input.
/// Áp dụng chiến lược Defense in Depth:
///   - Layer 1 (Validator): Dùng ContainsDangerousContent() để reject input → trả 400
///   - Layer 2 (Service): Dùng Sanitize() để HtmlEncode trước khi lưu DB
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

    private static readonly HtmlEncoder _htmlEncoder = HtmlEncoder.Create(UnicodeRanges.All);

    /// <summary>
    /// HTML encode chuỗi để vô hiệu hóa ký tự đặc biệt (&lt; &gt; &amp; &quot; &#39;).
    /// Dùng làm lớp bảo vệ thứ 2 trước khi lưu vào DB.
    /// Cho phép giữ nguyên Unicode (Tiếng Việt) không bị chuyển thành HTML Entity.
    /// </summary>
    public static string Sanitize(string input)
    {
        return _htmlEncoder.Encode(input.Trim());
    }
}
