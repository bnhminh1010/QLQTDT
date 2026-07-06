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
    public void CreateTenderAndReportUseSharedRolePolicy()
    {
        var hookSource = ReadFrontendSource("hooks/useAccessLevel.ts");
        var sidebarSource = ReadFrontendSource("components/Sidebar/index.tsx");
        var routeGuardSource = ReadFrontendSource("components/RouteGuard.tsx");
        var taoSource = ReadFrontendSource("pages/TaoGoiThau/index.tsx");

        Assert.Contains("export function canAccessCreateTender", hookSource);
        Assert.Contains("return isKhoaPhongUser(user);", hookSource);
        Assert.Contains("export function canAccessReport", hookSource);
        Assert.Contains("if (isKhoaPhongUser(user)) return false;", hookSource);
        Assert.Contains("canAccessCreateTender(user) && renderNavItem(\"/tao-goi-thau\"", sidebarSource);
        Assert.Contains("canAccessReport(user) && renderNavItem(\"/bao-cao\"", sidebarSource);
        Assert.Contains("path === \"/tao-goi-thau\" && !canAccessCreateTender(user)", routeGuardSource);
        Assert.Contains("path === \"/bao-cao\" && !canAccessReport(user)", routeGuardSource);
        Assert.Contains("if (currentUser && !canAccessCreateTender(currentUser))", taoSource);
    }

    [Fact]
    public void BaoCaoController_DeniesKhoaPhongRole()
    {
        var source = ReadBackendSource("Controllers/BaoCaoController.cs");

        Assert.Contains("[DenyRoles(\"KHOA_PHONG\")]", source);
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
    public void WorkflowDetailPages_UseParallelGroupsFromWorkflowState()
    {
        var dashboardSource = ReadFrontendSource("pages/Dashboard/index.tsx");
        var goiThauSource = ReadFrontendSource("pages/DanhSachGoiThau/index.tsx");

        Assert.Contains("workflowState?.parallelGroups ?? []", dashboardSource);
        Assert.Contains("workflowState?.parallelGroups ?? []", goiThauSource);
        Assert.DoesNotContain("getWorkflowDesignSteps(", dashboardSource);
        Assert.DoesNotContain("getParallelGroups(", dashboardSource);
        Assert.DoesNotContain("getWorkflowDesignSteps(", goiThauSource);
        Assert.DoesNotContain("getParallelGroups(", goiThauSource);
        Assert.DoesNotContain("canManageWorkflowDesign", dashboardSource);
        Assert.DoesNotContain("canManageWorkflowDesign", goiThauSource);
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
