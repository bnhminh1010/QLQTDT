using System.Text;

namespace QLQTDT.Api.Services;

/// <summary>
/// Validates file content using magic bytes (file signatures).
/// Blocks extension-spoofing attacks (e.g., .exe renamed to .pdf).
/// </summary>
public static class FileSignatureValidator
{
    private static readonly Dictionary<string, List<byte[]>> Signatures = new(StringComparer.OrdinalIgnoreCase)
    {
        // Images
        [".png"]  = [ [0x89, 0x50, 0x4E, 0x47] ],
        [".jpg"]  = [ [0xFF, 0xD8, 0xFF] ],
        [".jpeg"] = [ [0xFF, 0xD8, 0xFF] ],
        [".gif"]  = [ [0x47, 0x49, 0x46] ],
        [".bmp"]  = [ [0x42, 0x4D] ],
        [".webp"] = [ [0x52, 0x49, 0x46, 0x46] ], // RIFF header

        // Documents
        [".pdf"]  = [ [0x25, 0x50, 0x44, 0x46] ], // %PDF
        [".doc"]  = [ [0xD0, 0xCF, 0x11, 0xE0] ], // CFB
        [".xls"]  = [ [0xD0, 0xCF, 0x11, 0xE0] ],
        [".docx"] = [ [0x50, 0x4B, 0x03, 0x04] ], // ZIP-based OOXML
        [".xlsx"] = [ [0x50, 0x4B, 0x03, 0x04] ],

        // Archives
        [".zip"]  = [ [0x50, 0x4B, 0x03, 0x04] ],
        [".rar"]  = [ [0x52, 0x61, 0x72, 0x21] ],
        [".7z"]   = [ [0x37, 0x7A, 0xBC, 0xAF] ],

        // Text (no fixed magic bytes — skip validation)
        // These extensions are safe for text-based content
    };

    /// <summary>Well-known text-based extensions that bypass magic-byte check.</summary>
    private static readonly HashSet<string> TextExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".txt", ".csv", ".xml", ".json", ".html", ".htm",
        ".log", ".md", ".yaml", ".yml", ".ini", ".cfg",
    };

    private static readonly byte[][] DangerousTextPatterns =
    {
        "<script"u8.ToArray(),
        "<%"u8.ToArray(),
        "<?xml"u8.ToArray(),
        "javascript:"u8.ToArray(),
        "vbscript:"u8.ToArray(),
        "onerror="u8.ToArray(),
        "onload="u8.ToArray(),
        "onclick="u8.ToArray(),
    };

    /// <summary>
    /// Validate that the file's content matches its extension.
    /// Throws BadRequestException if mismatch or dangerous content detected.
    /// </summary>
    public static void Validate(string fileName, Stream content)
    {
        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(ext))
            return; // No extension → can't validate

        // Text-based extensions: scan for dangerous patterns
        if (TextExtensions.Contains(ext))
        {
            ScanTextContent(content, ext);
            return;
        }

        // Binary extensions: check magic bytes
        if (Signatures.TryGetValue(ext, out var validSignatures))
        {
            var header = new byte[16];
            var pos = content.Position;
            var bytesRead = content.Read(header, 0, Math.Min(header.Length, (int)content.Length));
            content.Position = pos; // Reset stream position

            if (bytesRead > 0)
            {
                var matched = validSignatures.Any(sig =>
                    bytesRead >= sig.Length && sig.SequenceEqual(header[..sig.Length]));

                if (!matched)
                {
                    // Special: .docx/.xlsx are ZIP-based → check ZIP signature
                    if ((ext is ".docx" or ".xlsx") && header[..4].SequenceEqual(new byte[] { 0x50, 0x4B, 0x03, 0x04 }))
                        return;

                    throw new Exceptions.BadRequestException(
                        $"Nội dung file không khớp với định dạng '{ext}'. File có thể bị đổi đuôi hoặc hỏng.");
                }
            }
        }
        // Unknown extension → allow through (no signature to validate against)
    }

    /// <summary>
    /// Scan text content for dangerous patterns (XSS, script injection).
    /// </summary>
    private static void ScanTextContent(Stream content, string ext)
    {
        var pos = content.Position;
        using var reader = new StreamReader(content, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 4096, leaveOpen: true);
        var sample = reader.ReadToEnd();
        content.Position = pos; // Reset for downstream

        if (sample.Length > 100_000)
            sample = sample[..100_000]; // Only scan first 100KB

        foreach (var pattern in DangerousTextPatterns)
        {
            var patternStr = Encoding.UTF8.GetString(pattern);
            if (sample.Contains(patternStr, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exceptions.BadRequestException(
                    $"Nội dung file '{ext}' chứa mã nguy hiểm tiềm ẩn ({patternStr}). Vui lòng kiểm tra lại.");
            }
        }
    }

    /// <summary>
    /// Quick check if the file is a known binary type.
    /// </summary>
    public static bool IsKnownBinary(string fileName) =>
        Signatures.ContainsKey(Path.GetExtension(fileName));
}
