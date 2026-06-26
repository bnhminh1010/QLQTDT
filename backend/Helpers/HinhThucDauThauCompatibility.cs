using System.Globalization;
using System.Text;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Helpers;

public static class HinhThucDauThauCompatibility
{
    private static readonly Dictionary<string, string> CanonicalCodeMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["DAU_THAU_RONG_RAI"] = "DAU_THAU_RONG_RAI",
        ["DTRR"] = "DAU_THAU_RONG_RAI",
        ["CHAO_HANG_CANH_TRANH"] = "CHAO_HANG_CANH_TRANH",
        ["CHCT"] = "CHAO_HANG_CANH_TRANH",
        ["MUA_SAM_TRUC_TIEP"] = "MUA_SAM_TRUC_TIEP",
        ["MSTT"] = "MUA_SAM_TRUC_TIEP",
        ["CHI_DINH_THAU_RUT_GON"] = "CHI_DINH_THAU_RUT_GON",
        ["CDT_RG"] = "CHI_DINH_THAU_RUT_GON",
    };

    public static bool AreCompatible(HinhThucDauThau? left, HinhThucDauThau? right)
    {
        if (left is null || right is null)
            return false;

        if (left.Id == right.Id)
            return true;

        var leftCode = GetCanonicalCode(left.MaHinhThuc);
        var rightCode = GetCanonicalCode(right.MaHinhThuc);
        if (!string.IsNullOrWhiteSpace(leftCode) && leftCode == rightCode)
            return true;

        return NormalizeName(left.TenHinhThuc) == NormalizeName(right.TenHinhThuc);
    }

    private static string GetCanonicalCode(string? maHinhThuc)
    {
        if (string.IsNullOrWhiteSpace(maHinhThuc))
            return string.Empty;

        var normalized = maHinhThuc.Trim().ToUpperInvariant();
        return CanonicalCodeMap.TryGetValue(normalized, out var canonical)
            ? canonical
            : normalized;
    }

    private static string NormalizeName(string? tenHinhThuc)
    {
        if (string.IsNullOrWhiteSpace(tenHinhThuc))
            return string.Empty;

        var withoutMarks = RemoveDiacritics(tenHinhThuc).ToLowerInvariant().Trim();
        var builder = new StringBuilder(withoutMarks.Length);

        foreach (var ch in withoutMarks)
        {
            builder.Append(char.IsLetterOrDigit(ch) ? ch : ' ');
        }

        var collapsed = string.Join(' ', builder
            .ToString()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries));

        return collapsed.TrimEnd('0', '1', '2', '3', '4', '5', '6', '7', '8', '9').Trim();
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark)
                continue;

            builder.Append(ch == 'đ' ? 'd' : ch == 'Đ' ? 'D' : ch);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
