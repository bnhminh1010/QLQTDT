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
        Assert.Contains("ResolveCurrentDeadline(", source);
        Assert.Contains("ComputeStepProgressStatus(", source);
    }

    [Fact]
    public void WorkflowEngine_PreservesLegacyProcessingDeadlineWhenStepMovesToApproval()
    {
        var source = ReadBackendSource("Services/WorkflowEngineService.cs");
        var migrationSource = ReadBackendSource("Migrations/20260707215500_BackfillTwoPhaseWorkflowDeadlines.cs");

        Assert.Contains("step.HanXuLyHoSo ??= step.HanXuLy;", source);
        Assert.Contains("step.QuaHanXuLyHoSo = false;", source);
        Assert.Contains("step.QuaHan = false;", source);
        Assert.Contains("ResolveProcessingDeadline(step)", source);
        Assert.Contains("ComputeStepProgressStatus(step)", source);
        Assert.Contains("step.PhaHienTai == \"KY_DUYET\" &&", source);
        Assert.Contains("UPDATE WorkflowStepInstance", migrationSource);
        Assert.Contains("HanXuLyHoSo = COALESCE(HanXuLyHoSo, HanXuLy)", migrationSource);
    }

    [Fact]
    public void DeadlineNotification_IsSeparatedByWorkflowPhase()
    {
        var notificationSource = ReadBackendSource("Services/ThongBaoService.cs");
        var scannerSource = ReadBackendSource("Services/DeadlineNotificationService.cs");

        Assert.Contains("var isApprovalPhase = step.PhaHienTai == \"KY_DUYET\";", notificationSource);
        Assert.Contains("var phaseKey = isApprovalPhase ? \"KY_DUYET\" : \"LAP_HO_SO\";", notificationSource);
        Assert.Contains("var phaseLabel = isApprovalPhase ? \"ký duyệt\" : \"xử lý\";", notificationSource);
        Assert.Contains(":{phaseKey}:{step.Id}", notificationSource);

        Assert.Contains("s.PhaHienTai", scannerSource);
        Assert.Contains("s.HanXuLyHoSo", scannerSource);
        Assert.Contains("s.HanKyDuyet", scannerSource);
        Assert.Contains("step.PhaHienTai == \"KY_DUYET\"", scannerSource);
        Assert.Contains("step.HanKyDuyet ?? step.HanXuLy", scannerSource);
        Assert.Contains("step.HanXuLyHoSo ?? step.HanXuLy", scannerSource);
    }

    [Fact]
    public void WorkflowInterventionNotification_UsesSpecificRecipientsAndWorkflowPanelLink()
    {
        var workflowSource = ReadBackendSource("Services/WorkflowEngineService.cs");
        var thongBaoSource = ReadBackendSource("Services/ThongBaoService.cs");
        var method = ExtractBetween(
            thongBaoSource,
            "public async Task NotifyWorkflowInterveneAsync",
            "public async Task NotifyStepDeadlineAsync");

        Assert.Contains("await _thongBaoService.NotifyWorkflowInterveneAsync(", workflowSource);
        Assert.Contains("Include(s => s.WorkflowAssignments)", workflowSource);
        Assert.Contains("AddStepActorRecipients(recipients, currentStep);", method);
        Assert.Contains("AddStepActorRecipients(recipients, rollbackStep);", method);
        Assert.Contains("ResolveStepApprovalRecipientIdsAsync(currentStep.BuocWorkflow)", method);
        Assert.Contains("ResolveStepApprovalRecipientIdsAsync(rollbackStep.BuocWorkflow)", method);
        Assert.Contains("Quy trình gói thầu", method);
        Assert.Contains("Lý do:", method);
        Assert.Contains("BuildStepUrl(goiThau.Id, notificationStepId)", method);
        Assert.DoesNotContain("ResolveHighLevelUserIdsAsync()", method);
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
        Assert.Contains("`Quá hạn ${overdueDays} ngày`", mapperSource);
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

    [Fact]
    public void WorkflowDesigner_MoveAndPreviewArrowUseStableStepIdentity()
    {
        var designerSource = ReadFrontendSource("pages/LapQuyTrinh/index.tsx");
        var stepListSource = ReadFrontendSource("pages/LapQuyTrinh/components/WorkflowStepList.tsx");
        var previewSource = ReadFrontendSource("pages/LapQuyTrinh/components/WorkflowPreview.tsx");

        Assert.Contains("function moveMainStep(stepId: string, direction: -1 | 1)", designerSource);
        Assert.Contains("const mainSteps = getMainWorkflowSteps(prev, parallelGroups);", designerSource);
        Assert.Contains("onMoveUp={() => onMoveUp(s.id)}", stepListSource);
        Assert.Contains("onMoveDown={() => onMoveDown(s.id)}", stepListSource);
        Assert.Contains("nodes.map((n, nodeIndex)", previewSource);
        Assert.Contains("idxNotLast(nodeIndex, nodes)", previewSource);
    }

    [Fact]
    public void WorkflowDesigner_PreviewRendersMainFlowAndBranchesSeparately()
    {
        var previewSource = ReadFrontendSource("pages/LapQuyTrinh/components/WorkflowPreview.tsx");
        var stepListSource = ReadFrontendSource("pages/LapQuyTrinh/components/WorkflowStepList.tsx");
        var designerSource = ReadFrontendSource("pages/LapQuyTrinh/index.tsx");
        var utilsSource = ReadFrontendSource("pages/LapQuyTrinh/workflowDesignerUtils.ts");

        Assert.Contains("buildParallelBranchStepIdSet", utilsSource);
        Assert.Contains("branch.stepIds", utilsSource);
        Assert.Contains("const mainSteps = getMainWorkflowSteps(steps, parallelGroups);", previewSource);
        Assert.Contains("const mainSteps = getMainWorkflowSteps(steps, parallelGroups);", stepListSource);
        Assert.Contains("for (let idx = 0; idx < mainSteps.length; idx++)", previewSource);
        Assert.Contains("const step = mainSteps[idx];", previewSource);
        Assert.Contains("branch.stepIds", previewSource);
        Assert.Contains("function handleOpenMainLibrary()", designerSource);
        Assert.Contains("setModalContext({ type: \"main\" });", designerSource);
    }

    [Fact]
    public void WorkflowDelete_ClearsBoundaryStepsBeforeDeletingDesignSteps()
    {
        var source = ReadBackendSource("Services/WorkflowConfigService.cs");

        Assert.Contains("entity.BuocBatDauId = null;", source);
        Assert.Contains("entity.BuocKetThucId = null;", source);
        Assert.Contains("Workflow delete blocked: workflowId={WorkflowId}", source);
        Assert.Contains("Workflow delete failed due to configuration references", source);
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

    private static string ExtractBetween(string source, string start, string end)
    {
        var startIndex = source.IndexOf(start, StringComparison.Ordinal);
        Assert.True(startIndex >= 0, $"Could not find start marker: {start}");

        var endIndex = source.IndexOf(end, startIndex + start.Length, StringComparison.Ordinal);
        Assert.True(endIndex > startIndex, $"Could not find end marker: {end}");

        return source[startIndex..endIndex];
    }
}
