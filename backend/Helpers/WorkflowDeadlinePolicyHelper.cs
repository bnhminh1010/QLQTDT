using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Helpers;

public static class WorkflowDeadlinePolicyHelper
{
    public const string WarningOnly = "CANH_BAO";
    public const string Mandatory = "BAT_BUOC";
    public const string HighLevelRoleGroup = "CAP_CAO";

    public static bool IsHighLevelRole(VaiTro? role)
        => string.Equals(role?.NhomVaiTro?.MaNhom, HighLevelRoleGroup, StringComparison.OrdinalIgnoreCase);

    public static string NormalizeDeadlineType(string? value)
        => value == Mandatory ? Mandatory : WarningOnly;

    public static string NormalizeDeadlineTypeForRole(string? value, VaiTro? role)
        => IsHighLevelRole(role) ? WarningOnly : NormalizeDeadlineType(value);

    public static string ResolveDeadlineTypeForPhase(BuocWorkflow step, string? phase)
        => string.Equals(phase, "KY_DUYET", StringComparison.OrdinalIgnoreCase)
            ? step.LoaiHanKyDuyet
            : step.LoaiHan;
}
