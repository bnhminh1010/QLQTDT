using QLQTDT.Api.Helpers;

namespace QLQTDT.Api.Tests.Helpers;

public class WorkflowDeadlineStatusHelperTests
{
    private static readonly DateTime ReferenceNowUtc = new(2026, 7, 1, 2, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void ComputeTinhTrangTienDo_Returns_ChuaCoHan_WhenDeadlineMissing()
    {
        var result = WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(null, "DANG_XU_LY", ReferenceNowUtc);

        Assert.Equal("CHUA_CO_HAN", result);
    }

    [Fact]
    public void ComputeTinhTrangTienDo_Returns_QuaHan_WhenDeadlineIsBeforeToday()
    {
        var deadline = new DateTime(2026, 6, 30, 10, 0, 0, DateTimeKind.Utc);

        var result = WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(deadline, "DANG_XU_LY", ReferenceNowUtc);

        Assert.Equal("QUA_HAN", result);
    }

    [Fact]
    public void ComputeTinhTrangTienDo_Returns_SapQuaHan_WhenDeadlineIsTodayOrTomorrow()
    {
        var dueToday = new DateTime(2026, 7, 1, 12, 0, 0, DateTimeKind.Utc);
        var dueTomorrow = new DateTime(2026, 7, 2, 12, 0, 0, DateTimeKind.Utc);

        Assert.Equal("SAP_QUA_HAN", WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(dueToday, "DANG_XU_LY", ReferenceNowUtc));
        Assert.Equal("SAP_QUA_HAN", WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(dueTomorrow, "DANG_XU_LY", ReferenceNowUtc));
    }

    [Fact]
    public void ComputeTinhTrangTienDo_Returns_DungTienDo_WhenDeadlineIsMoreThanOneDayAway()
    {
        var deadline = new DateTime(2026, 7, 3, 12, 0, 0, DateTimeKind.Utc);

        var result = WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(deadline, "DANG_XU_LY", ReferenceNowUtc);

        Assert.Equal("DUNG_TIEN_DO", result);
    }

    [Fact]
    public void ComputeTinhTrangTienDo_Returns_HoanTat_ForCompletedStates()
    {
        var deadline = new DateTime(2026, 7, 3, 12, 0, 0, DateTimeKind.Utc);

        Assert.Equal("HOAN_TAT", WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(deadline, "HOAN_TAT", ReferenceNowUtc));
        Assert.Equal("HOAN_TAT", WorkflowDeadlineStatusHelper.ComputeTinhTrangTienDo(deadline, "SKIPPED", ReferenceNowUtc));
    }
}
