namespace QLQTDT.Api.Helpers;

public static class ParallelBranchNameHelper
{
    private const string DefaultPrefix = "Nhánh";

    public static string ResolveDisplayName(string? branchName, string? tenNhanh = null, int? index = null)
    {
        var candidate = FirstNonBlank(branchName, tenNhanh);
        if (!string.IsNullOrWhiteSpace(candidate))
            return candidate.Trim();

        if (index.HasValue && index.Value >= 0)
            return $"{DefaultPrefix} {index.Value + 1}";

        return $"{DefaultPrefix} 1";
    }

    public static string? NormalizeOptionalLabel(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? FirstNonBlank(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }
}
