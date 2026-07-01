using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Helpers;

public static class WorkflowDeadlineStatusHelper
{
    private const int VietnamUtcOffsetHours = 7;
    private const int DueSoonThresholdDays = 1;

    public static string? ComputeTinhTrangTienDo(DateTime? hanXuLy, string trangThai, DateTime? nowUtc = null)
    {
        if (trangThai is WorkflowStepTrangThai.HOAN_TAT or WorkflowStepTrangThai.TRA_VE
            or WorkflowStepTrangThai.SKIPPED)
            return "HOAN_TAT";

        if (trangThai is "PENDING" or "CHUA_BAT_DAU")
            return "CHUA_THUC_HIEN";

        if (!hanXuLy.HasValue)
            return "CHUA_CO_HAN";

        var currentLocalDate = ToVietnamDate(nowUtc ?? DateTime.UtcNow);
        var deadlineLocalDate = ToVietnamDate(hanXuLy.Value);
        var remainingDays = (deadlineLocalDate - currentLocalDate).TotalDays;

        if (remainingDays < 0)
            return "QUA_HAN";

        if (remainingDays <= DueSoonThresholdDays)
            return "SAP_QUA_HAN";

        return "DUNG_TIEN_DO";
    }

    private static DateTime ToVietnamDate(DateTime valueUtc)
    {
        var utc = valueUtc.Kind == DateTimeKind.Utc
            ? valueUtc
            : DateTime.SpecifyKind(valueUtc, DateTimeKind.Utc);

        return utc.AddHours(VietnamUtcOffsetHours).Date;
    }
}
