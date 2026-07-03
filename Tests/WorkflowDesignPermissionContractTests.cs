using System.Text.RegularExpressions;

namespace QLQTDT.Api.Tests.Security;

public class WorkflowDesignPermissionContractTests
{
    [Fact]
    public void LapQuyTrinh_RouteRequiresCreateOrConfigOnly()
    {
        var accessSource = ReadFrontendSource("hooks/useAccessLevel.ts");
        var userAccessSource = ReadFrontendSource("pages/NguoiDung/index.tsx");

        Assert.Contains(
            "export const WORKFLOW_DESIGN_PERMISSIONS = [\"WORKFLOW.CREATE\", \"WORKFLOW.CONFIG\"];",
            accessSource);
        Assert.Contains(
            "{ key: \"lap-quy-trinh\", label: \"Lập quy trình\", desc: \"Thiết lập quy trình\", permissions: [\"WORKFLOW.CREATE\", \"WORKFLOW.CONFIG\"] }",
            userAccessSource);
        Assert.DoesNotContain("\"/lap-quy-trinh\": [\"WORKFLOW.CREATE\", \"WORKFLOW.CONFIG\", \"WORKFLOW.VIEW_ALL\"]", accessSource);
        Assert.DoesNotContain("permissions: [\"WORKFLOW.CREATE\", \"WORKFLOW.CONFIG\", \"WORKFLOW.VIEW_ALL\"]", userAccessSource);
    }

    [Fact]
    public void Sidebar_HidesUnauthorizedNavigationItems()
    {
        var source = ReadFrontendSource("components/Sidebar/index.tsx");

        Assert.Contains("if (!allowed) return null;", source);
        Assert.DoesNotContain("title=\"Không có quyền truy cập\"", source);
        Assert.DoesNotContain("cursor-not-allowed", source);
    }

    [Fact]
    public void WorkflowMutationEndpoints_DoNotAllowViewOnlyPermissions()
    {
        var source = ReadBackendSource("Controllers/WorkflowsController.cs");

        Assert.Equal(
            4,
            Regex.Matches(source, """\[HasPermission\("WORKFLOW\.CREATE", "WORKFLOW\.CONFIG"\)\]""").Count);
        Assert.DoesNotContain("[HasPermission(\"WORKFLOW.CREATE\", \"WORKFLOW.VIEW\", \"WORKFLOW.VIEW_ALL\")]", source);
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
}
