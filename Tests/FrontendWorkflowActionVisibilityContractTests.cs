namespace QLQTDT.Api.Tests.Security;

public class FrontendWorkflowActionVisibilityContractTests
{
    [Fact]
    public void CurrentStepUpdate_RequiresWorkflowProcessOnly()
    {
        var source = ReadFrontendSource("pages/DanhSachGoiThau/index.tsx");

        Assert.Contains(
            "const CURRENT_STEP_UPDATE_PERMISSIONS = [\"WORKFLOW.PROCESS\"];",
            source);
        Assert.DoesNotContain("\"GOITHAU.EDIT\"", source);
        Assert.DoesNotContain("\"GOITHAU.CREATE\"", source);
    }

    [Fact]
    public void WorkflowStepsPanel_HidesCurrentStepActionWhenNotAllowed()
    {
        var source = ReadFrontendSource("components/workflow/WorkflowStepsPanel.tsx");

        Assert.Contains("isCurrentStep && currentStepAction && canShowAction", source);
        Assert.DoesNotContain("const isActionDisabled = isCurrentStep && !!currentStepAction && !canShowAction;", source);
    }

    [Fact]
    public void WorkflowStepsPanel_AutoFocus_IsOptInByDefault()
    {
        var panelSource = ReadFrontendSource("components/workflow/WorkflowStepsPanel.tsx");
        var dashboardSource = ReadFrontendSource("pages/Dashboard/index.tsx");
        var goiThauSource = ReadFrontendSource("pages/DanhSachGoiThau/index.tsx");

        Assert.Contains("enableAutoFocusCurrentStep?: boolean;", panelSource);
        Assert.Contains("enableAutoFocusCurrentStep = false,", panelSource);
        Assert.Contains("const resolvedFocusStepId = enableAutoFocusCurrentStep ? (focusStepId ?? currentStepId) : null;", panelSource);
        Assert.Contains("enableAutoFocusCurrentStep={false}", dashboardSource);
        Assert.Contains("enableAutoFocusCurrentStep={true}", goiThauSource);
    }

    [Fact]
    public void WorkflowStepsPanel_UsesConfiguredUnitAndRoleNames()
    {
        var panelSource = ReadFrontendSource("components/workflow/WorkflowStepsPanel.tsx");
        var typesSource = ReadFrontendSource("components/workflow/workflowDetailTypes.ts");

        Assert.Contains("step.processingUnitName || step.processingRoleName", panelSource);
        Assert.Contains("step.approvalUnitName || step.approvalRoleName", panelSource);
        Assert.Contains("approvalText && (", panelSource);
        Assert.Contains("Đơn vị/Vai trò ký duyệt:", panelSource);
        Assert.Contains("processingUnitName?: string;", typesSource);
        Assert.Contains("approvalRoleName?: string;", typesSource);
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
