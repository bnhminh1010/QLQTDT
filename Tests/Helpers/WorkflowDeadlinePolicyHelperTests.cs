using QLQTDT.Api.Helpers;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Tests.Helpers;

public class WorkflowDeadlinePolicyHelperTests
{
    [Fact]
    public void NormalizeDeadlineTypeForRole_ReturnsWarningOnly_ForCapCaoApprovalRoles()
    {
        var role = new VaiTro
        {
            NhomVaiTro = new NhomVaiTro { MaNhom = "CAP_CAO", TenNhom = "Cap cao" }
        };

        var result = WorkflowDeadlinePolicyHelper.NormalizeDeadlineTypeForRole("BAT_BUOC", role);

        Assert.Equal("CANH_BAO", result);
    }

    [Fact]
    public void NormalizeDeadlineTypeForRole_PreservesMandatory_ForNonHighLevelRoles()
    {
        var role = new VaiTro
        {
            NhomVaiTro = new NhomVaiTro { MaNhom = "TRUNG_BINH", TenNhom = "Trung binh" }
        };

        var result = WorkflowDeadlinePolicyHelper.NormalizeDeadlineTypeForRole("BAT_BUOC", role);

        Assert.Equal("BAT_BUOC", result);
    }

    [Fact]
    public void ResolveDeadlineTypeForPhase_UsesProcessingDeadlineForProcessingPhase()
    {
        var step = new BuocWorkflow
        {
            LoaiHan = "BAT_BUOC",
            LoaiHanKyDuyet = "CANH_BAO"
        };

        var result = WorkflowDeadlinePolicyHelper.ResolveDeadlineTypeForPhase(step, "LAP_HO_SO");

        Assert.Equal("BAT_BUOC", result);
    }

    [Fact]
    public void ResolveDeadlineTypeForPhase_UsesApprovalDeadlineForApprovalPhase()
    {
        var step = new BuocWorkflow
        {
            LoaiHan = "BAT_BUOC",
            LoaiHanKyDuyet = "CANH_BAO"
        };

        var result = WorkflowDeadlinePolicyHelper.ResolveDeadlineTypeForPhase(step, "KY_DUYET");

        Assert.Equal("CANH_BAO", result);
    }
}
