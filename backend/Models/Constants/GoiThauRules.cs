using System.Globalization;
using System.Text;

namespace QLQTDT.Api.Models.Constants;

public static class GoiThauRules
{
    public const string MA_CHI_DINH_THAU_RUT_GON = "CHI_DINH_THAU_RUT_GON";
    public const string MA_CHI_DINH_THAU = "CHI_DINH_THAU";
    public const string MA_CHAO_HANG_CANH_TRANH = "CHAO_HANG_CANH_TRANH";
    public const string MA_DAU_THAU_RONG_RAI = "DAU_THAU_RONG_RAI";
    public const string MA_MUA_SAM_TRUC_TIEP = "MUA_SAM_TRUC_TIEP";
    public const string MA_CHAO_GIA_TRUC_TUYEN = "CHAO_GIA_TRUC_TUYEN";
    public const string MA_CHAO_GIA_TRUC_TUYEN_RUT_GON = "CHAO_GIA_TRUC_TUYEN_RUT_GON";
    public const string MA_DAT_HANG = "DAT_HANG";

    public const string TEN_CHI_DINH_THAU_RUT_GON = "Chỉ định thầu rút gọn";
    public const string TEN_CHI_DINH_THAU = "Chỉ định thầu";

    public const decimal NGAN_SACH_TU_VAN_RUT_GON_TOI_DA = 500_000_000m;
    public const decimal NGAN_SACH_HANG_HOA_RUT_GON_TOI_DA = 1_000_000_000m;
    public const decimal NGAN_SACH_PHI_TU_VAN_RUT_GON_TOI_DA = 1_000_000_000m;
    public const decimal NGAN_SACH_XAY_LAP_RUT_GON_TOI_DA = 1_000_000_000m;
    public const decimal NGAN_SACH_CHAO_HANG_CANH_TRANH_TOI_DA = 5_000_000_000m;
    public const decimal NGAN_SACH_CHAO_GIA_TRUC_TUYEN_TOI_DA = 200_000_000m;
    public const decimal NGAN_SACH_MUA_SAM_TRUC_TIEP_TOI_DA = 100_000_000m;
    public const decimal NGAN_SACH_DAT_HANG_TOI_DA = 50_000_000m;

    public static readonly HashSet<string> MaRutGon = new(StringComparer.OrdinalIgnoreCase)
    {
        MA_CHI_DINH_THAU_RUT_GON,
        MA_CHAO_GIA_TRUC_TUYEN_RUT_GON,
    };

    public static bool IsRutGon(string? maHinhThuc, string? tenHinhThuc = null)
    {
        if (!string.IsNullOrWhiteSpace(maHinhThuc) &&
            (MaRutGon.Contains(maHinhThuc) || maHinhThuc.Contains("RUT_GON", StringComparison.OrdinalIgnoreCase)))
            return true;

        return Normalize(tenHinhThuc).Contains("rut gon", StringComparison.OrdinalIgnoreCase);
    }

    public static decimal? GetHanMucToiDa(string maHinhThuc) => maHinhThuc switch
    {
        MA_CHAO_HANG_CANH_TRANH => NGAN_SACH_CHAO_HANG_CANH_TRANH_TOI_DA,
        MA_CHAO_GIA_TRUC_TUYEN => NGAN_SACH_CHAO_GIA_TRUC_TUYEN_TOI_DA,
        MA_MUA_SAM_TRUC_TIEP => NGAN_SACH_MUA_SAM_TRUC_TIEP_TOI_DA,
        MA_DAT_HANG => NGAN_SACH_DAT_HANG_TOI_DA,
        _ => null,
    };

    public static decimal? GetHanMucRutGonTheoLoaiGoiThau(string? loaiGoiThau)
    {
        var normalized = Normalize(loaiGoiThau);
        return normalized switch
        {
            var x when x.Contains("tu van", StringComparison.OrdinalIgnoreCase) && !x.Contains("phi", StringComparison.OrdinalIgnoreCase)
                => NGAN_SACH_TU_VAN_RUT_GON_TOI_DA,
            var x when x.Contains("hang hoa", StringComparison.OrdinalIgnoreCase)
                => NGAN_SACH_HANG_HOA_RUT_GON_TOI_DA,
            var x when x.Contains("phi tu van", StringComparison.OrdinalIgnoreCase)
                => NGAN_SACH_PHI_TU_VAN_RUT_GON_TOI_DA,
            var x when x.Contains("xay lap", StringComparison.OrdinalIgnoreCase)
                => NGAN_SACH_XAY_LAP_RUT_GON_TOI_DA,
            _ => null,
        };
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var formD = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(formD.Length);
        foreach (var ch in formD)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                builder.Append(ch == 'đ' ? 'd' : ch);
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
