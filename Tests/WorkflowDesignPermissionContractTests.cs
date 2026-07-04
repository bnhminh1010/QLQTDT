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
    public void KhoaPhong_DoesNotRenderWorkflowListMenuItem()
    {
        var hookSource = ReadFrontendSource("hooks/useAccessLevel.ts");
        var sidebarSource = ReadFrontendSource("components/Sidebar/index.tsx");

        Assert.Contains("export function canViewWorkflowList", hookSource);
        Assert.Contains("if (isKhoaPhongUser(user)) return false;", hookSource);
        Assert.Contains("canViewWorkflowList(user) && renderNavItem(\"/danh-sach-quy-trinh\"", sidebarSource);
    }

    [Fact]
    public void KhoaPhong_CannotAccessWorkflowManagementRoute()
    {
        var source = ReadFrontendSource("hooks/useAccessLevel.ts");

        Assert.Contains("if (isKhoaPhongUser(user)) return false;", source);
        Assert.Contains("return false;", source);
        Assert.Contains("\"/danh-sach-quy-trinh\": [\"WORKFLOW.VIEW\", \"WORKFLOW.VIEW_ALL\"]", source);
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

    [Fact]
    public void WorkflowManagementControllers_DenyKhoaPhongRole()
    {
        Assert.Contains("[DenyRoles(\"KHOA_PHONG\")]", ReadBackendSource("Controllers/WorkflowsController.cs"));
        Assert.Contains("[DenyRoles(\"KHOA_PHONG\")]", ReadBackendSource("Controllers/WorkflowStepsController.cs"));
        Assert.Contains("[DenyRoles(\"KHOA_PHONG\")]", ReadBackendSource("Controllers/WorkflowStepItemController.cs"));
        Assert.Contains("[DenyRoles(\"KHOA_PHONG\")]", ReadBackendSource("Controllers/ParallelGroupsController.cs"));
    }

    [Fact]
    public void DanhSachGoiThau_SkipsWorkflowDesignApisWithoutDesignAccess()
    {
        var source = ReadFrontendSource("pages/DanhSachGoiThau/index.tsx");

        Assert.Contains("const canViewWorkflowDesign = currentUserLoaded && canManageWorkflowDesign(currentUser);", source);
        Assert.Contains("if (!workflowId || !canViewWorkflowDesign) {", source);
        Assert.Contains("getWorkflowDesignSteps(workflowId, { skipAuthToast: true })", source);
        Assert.DoesNotContain("getWorkflowDesignSteps(selected.workflowId)", source);
    }

    [Fact]
    public void TaoGoiThau_UsesTemplatePreviewApiInsteadOfWorkflowManagementApis()
    {
        var source = ReadFrontendSource("pages/TaoGoiThau/index.tsx");

        Assert.Contains("getWorkflowTemplates()", source);
        Assert.Contains("previewWorkflowTemplate(wfId)", source);
        Assert.DoesNotContain("getWorkflows()", source);
        Assert.DoesNotContain("getWorkflowDesignSteps(", source);
        Assert.DoesNotContain("getParallelGroups(", source);
    }

    [Fact]
    public void HinhThucDauThauController_UsesAdminOnlyMutationGuards()
    {
        var source = ReadBackendSource("Controllers/HinhThucDauThauController.cs");

        Assert.Equal(
            3,
            Regex.Matches(source, """\[Authorize\(Roles = "ADMIN"\)\]""").Count);
        Assert.Contains("[HasPermission(\"HINHTHUCDAUTHAU.VIEW\")]", source);
        Assert.Contains("EnsureCanView()", source);
        Assert.Contains("IsKhoaPhongUser()", source);
    }

    [Fact]
    public void KhoaPhongRole_NoLongerReceivesHinhThucViewPermission()
    {
        var source = ReadBackendSource("Data/DbInitializer.cs");
        var start = source.IndexOf("[\"KHOA_PHONG\"] =");
        var end = source.IndexOf("[\"BCN_KHOA_PHONG\"] =", start + 1);

        Assert.True(start >= 0 && end > start, "Could not isolate KHOA_PHONG permission block.");

        var block = source.Substring(start, end - start);
        Assert.DoesNotContain("HINHTHUCDAUTHAU.VIEW", block);
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
