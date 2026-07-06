namespace QLQTDT.Api.Tests.Security;

public class WorkflowDeletionContractTests
{
    [Fact]
    public void DeleteWorkflow_BlocksOnlyWhenWorkflowHasRuntimeInstances()
    {
        var source = ReadBackendSource("Services/WorkflowConfigService.cs");

        Assert.Contains("var runningInstanceCount = await _context.WorkflowInstances.CountAsync(i => i.WorkflowId == id && i.TrangThai == WorkflowTrangThai.ACTIVE);", source);
        Assert.Contains("Workflow delete precheck: workflowId={WorkflowId}, workflowInstanceCount={WorkflowInstanceCount}", source);
        Assert.DoesNotContain("_context.GoiThaus.CountAsync(g => g.WorkflowId == id)", source);
        Assert.Contains("throw new AppException(409, \"WORKFLOW_IN_USE\", \"Quy trình đã được sử dụng, không thể xóa.\");", source);
    }

    [Fact]
    public void DeleteWorkflow_DeletesRuntimeAndInternalWorkflowData()
    {
        var source = ReadBackendSource("Services/WorkflowConfigService.cs");

        Assert.Contains("WorkflowActionHistories", source);
        Assert.Contains("WorkflowAssignments", source);
        Assert.Contains("WorkflowStepInstances", source);
        Assert.Contains("WorkflowInstances", source);
        Assert.Contains("WorkflowRule", source);
        Assert.Contains("WorkflowVersionHistories", source);
        Assert.Contains("ExecuteDeleteAsync();", source);
        Assert.Contains("ExecuteUpdateAsync(setters => setters.SetProperty(b => b.NhanhWorkflowId, (int?)null))", source);
        Assert.Contains("await _context.NhomNhanhWorkflows", source);
        Assert.Contains("await _context.NhanhWorkflows", source);
        Assert.Contains("await _context.ChuyenTiepWorkflows", source);
        Assert.Contains("await _context.BuocWorkflows", source);
    }

    [Fact]
    public void DeleteWorkflow_LogsTechnicalDetailsForDbFailures()
    {
        var source = ReadBackendSource("Services/WorkflowConfigService.cs");

        Assert.Contains("LogError(", source);
        Assert.Contains("ex.Message={ExceptionMessage}", source);
        Assert.Contains("innerException={InnerExceptionMessage}", source);
        Assert.Contains("WORKFLOW_DELETE_CONFLICT", source);
        Assert.Contains("Không thể xóa quy trình do còn dữ liệu cấu hình liên quan.", source);
        Assert.Contains("WORKFLOW_DELETE_FAILED", source);
        Assert.Contains("Không thể xóa quy trình do lỗi hệ thống.", source);
    }

    [Fact]
    public void WorkflowListDeleteToastShowsBackendMessage()
    {
        var source = ReadFrontendSource("pages/DanhSachQuyTrinh/index.tsx");

        Assert.Contains("toast.error(getApiErrorMessage(error, \"Xóa quy trình thất bại\"))", source);
        Assert.Contains("function getApiErrorMessage(error: unknown, fallback: string)", source);
    }

    private static string ReadBackendSource(string relativePath)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var backendRoot = Path.Combine(current.FullName, "backend");
            if (Directory.Exists(backendRoot))
                return File.ReadAllText(Path.Combine(backendRoot, relativePath));

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate backend source root.");
    }

    private static string ReadFrontendSource(string relativePath)
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var frontendRoot = Path.Combine(current.FullName, "frontend", "src");
            if (Directory.Exists(frontendRoot))
                return File.ReadAllText(Path.Combine(frontendRoot, relativePath));

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate frontend source root.");
    }
}
