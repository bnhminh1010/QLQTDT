namespace QLQTDT.Api.Tests.Security;

public class WorkflowTwoPhaseDeadlineContractTests
{
    [Fact]
    public void WorkflowStepInstance_StoresSeparateProcessingAndApprovalDeadlines()
    {
        var entitySource = ReadBackendSource("Models/Entities/WorkflowStepInstance.cs");

        Assert.Contains("public DateTime? HanXuLyHoSo { get; set; }", entitySource);
        Assert.Contains("public DateTime? HanKyDuyet { get; set; }", entitySource);
        Assert.Contains("public bool? QuaHanXuLyHoSo { get; set; }", entitySource);
        Assert.Contains("public bool? QuaHanKyDuyet { get; set; }", entitySource);
    }

    [Fact]
    public void WorkflowDtos_ExposeSeparateOverdueReasonForEachPhase()
    {
        var dtoSource = ReadBackendSource("Models/DTOs/Workflow/WorkflowEngineDtos.cs");
        var frontendApiSource = ReadFrontendSource("services/workflowApi.ts");

        Assert.Contains("HanXuLyHoSo", dtoSource);
        Assert.Contains("HanKyDuyet", dtoSource);
        Assert.Contains("QuaHanXuLyHoSo", dtoSource);
        Assert.Contains("QuaHanKyDuyet", dtoSource);
        Assert.Contains("SoNgayQuaHanXuLyHoSo", dtoSource);
        Assert.Contains("SoNgayQuaHanKyDuyet", dtoSource);
        Assert.Contains("LyDoQuaHanXuLyHoSo", dtoSource);
        Assert.Contains("LyDoQuaHanKyDuyet", dtoSource);

        Assert.Contains("hanXuLyHoSo", frontendApiSource);
        Assert.Contains("hanKyDuyet", frontendApiSource);
        Assert.Contains("quaHanXuLyHoSo", frontendApiSource);
        Assert.Contains("quaHanKyDuyet", frontendApiSource);
        Assert.Contains("soNgayQuaHanXuLyHoSo", frontendApiSource);
        Assert.Contains("soNgayQuaHanKyDuyet", frontendApiSource);
        Assert.Contains("lyDoQuaHanXuLyHoSo", frontendApiSource);
        Assert.Contains("lyDoQuaHanKyDuyet", frontendApiSource);
    }

    [Fact]
    public void WorkflowEngine_SetsProcessingDeadlineOnOpenAndApprovalDeadlineOnSendApproval()
    {
        var source = ReadBackendSource("Services/WorkflowEngineService.cs");

        Assert.Contains("SetProcessingDeadline(", source);
        Assert.Contains("SetApprovalDeadline(", source);
        Assert.Contains("UpdatePhaseOverdueState(", source);
        Assert.Contains("currentStep.QuaHan = currentStep.QuaHanXuLyHoSo == true || currentStep.QuaHanKyDuyet == true;", source);
    }

    [Fact]
    public void WorkflowDetailUi_RendersTwoPhaseOverdueReasons()
    {
        var itemSource = ReadFrontendSource("components/workflow/WorkflowStepItem.tsx");
        var typeSource = ReadFrontendSource("components/workflow/workflowDetailTypes.ts");
        var mapperSource = ReadFrontendSource("components/workflow/workflowDetailUtils.ts");

        Assert.Contains("lyDoQuaHanXuLyHoSo?: string;", typeSource);
        Assert.Contains("lyDoQuaHanKyDuyet?: string;", typeSource);
        Assert.Contains("lyDoQuaHanXuLyHoSo: normalizeWorkflowText(step.lyDoQuaHanXuLyHoSo, \"\")", mapperSource);
        Assert.Contains("lyDoQuaHanKyDuyet: normalizeWorkflowText(step.lyDoQuaHanKyDuyet, \"\")", mapperSource);
        Assert.Contains("Lý do quá hạn xử lý", itemSource);
        Assert.Contains("Lý do quá hạn ký duyệt", itemSource);
    }

    [Fact]
    public void WorkflowList_DefaultsToNewestCreatedDateFirst()
    {
        var source = ReadFrontendSource("pages/DanhSachQuyTrinh/index.tsx");

        Assert.Contains("const [sortField, setSortField] = useState<SortField>(\"ngayTao\");", source);
        Assert.Contains("const [sortDir, setSortDir] = useState<SortDir>(\"desc\");", source);
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
