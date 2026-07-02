using QLQTDT.Api.Models.Entities;
using QLQTDT.Api.Security;

namespace QLQTDT.Api.Tests.Security;

public class WorkflowActionPermissionPolicyTests
{
    [Theory]
    [InlineData(WorkflowHanhDong.APPROVE)]
    [InlineData(WorkflowHanhDong.DUYET)]
    [InlineData(WorkflowHanhDong.REJECT)]
    [InlineData(WorkflowHanhDong.KHONG_DUYET)]
    [InlineData(WorkflowHanhDong.SKIP)]
    public void RequiredPermission_ProcessActions_ReturnsWorkflowProcess(string action)
    {
        var permission = WorkflowActionPermissionPolicy.GetRequiredPermission(action);

        Assert.Equal("WORKFLOW.PROCESS", permission);
    }

    [Theory]
    [InlineData(WorkflowHanhDong.ROLLBACK)]
    [InlineData(WorkflowHanhDong.TRA_VE)]
    public void RequiredPermission_RollbackActions_ReturnsWorkflowRollback(string action)
    {
        var permission = WorkflowActionPermissionPolicy.GetRequiredPermission(action);

        Assert.Equal("WORKFLOW.ROLLBACK", permission);
    }

    [Fact]
    public void RequiredPermission_Reassign_ReturnsWorkflowReassign()
    {
        var permission = WorkflowActionPermissionPolicy.GetRequiredPermission(WorkflowHanhDong.REASSIGN);

        Assert.Equal("WORKFLOW.REASSIGN", permission);
    }

    [Fact]
    public void HasRequiredPermission_UsesCaseInsensitivePermissionCheck()
    {
        var permissions = new[] { "workflow.process" };

        var allowed = WorkflowActionPermissionPolicy.HasRequiredPermission(WorkflowHanhDong.DUYET, permissions);

        Assert.True(allowed);
    }
}
