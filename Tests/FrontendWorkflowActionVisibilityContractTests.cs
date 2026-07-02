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
