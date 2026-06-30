import type {
  BuocWorkflowDto,
  CurrentStepDto,
  ParallelGroupDto,
  WorkflowStateDto,
  WorkflowStepStateDto,
} from "@/services/workflowApi";
import { formatWorkflowKetQua } from "@/services/workflowApi";
import type {
  WorkflowDetailInfo,
  WorkflowDetailStep,
  WorkflowParallelInfo,
  WorkflowParallelBranchStepState,
} from "./workflowDetailTypes";
import { normalizeParallelGroupTitle } from "@/constants/parallelGroup";

const TIEN_DO_LABEL: Record<string, string> = {
  DUNG_TIEN_DO: "Đúng hạn",
  QUA_HAN: "Quá hạn",
  SAP_QUA_HAN: "Sắp quá hạn",
  CHUA_THUC_HIEN: "Chưa thực hiện",
  CHUA_CO_HAN: "Chưa có hạn xử lý",
  HOAN_TAT: "Hoàn tất",
};

function getStepProgressLabel(step: WorkflowStepStateDto) {
  if (step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || step.ngayHoanThanh) return "Đã hoàn thành";
  if (step.trangThai === "SKIPPED") return "Đã bỏ qua";
  if (step.trangThai === "DANG_XU_LY" || step.trangThai === "CHO_DUYET") return "Đang xử lý";
  return "Chưa thực hiện";
}

function isStepCompleted(step: WorkflowStepStateDto) {
  return step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || Boolean(step.ngayHoanThanh);
}

function isStepSkipped(step: WorkflowStepStateDto) {
  return step.trangThai === "SKIPPED";
}

function getBranchStepState(
  step: WorkflowStepStateDto,
  activeStepIds: Set<number>,
): WorkflowParallelBranchStepState {
  if (step.trangThai === "SKIPPED") return "skipped";
  if (activeStepIds.has(step.id)) return "current";
  if (step.trangThai === "DANG_XU_LY" || step.trangThai === "CHO_DUYET") return "current";
  if (step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || step.ngayHoanThanh) return "done";
  return "idle";
}

function rankWorkflowStepInstance(step: WorkflowStepStateDto, activeStepIds: Set<number>) {
  if (activeStepIds.has(step.id)) return 5;
  if (step.trangThai === "DANG_XU_LY" || step.trangThai === "CHO_DUYET") return 4;
  if (step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || step.ngayHoanThanh) return 3;
  if (step.trangThai === "SKIPPED") return 2;
  return 1;
}

export function dedupeWorkflowStepsByDesignStep(
  steps: WorkflowStepStateDto[],
  activeStepIds: Set<number>,
) {
  const byDesignStep = new Map<number, WorkflowStepStateDto>();

  steps.forEach((step) => {
    const previous = byDesignStep.get(step.buocWorkflowId);
    const stepRank = rankWorkflowStepInstance(step, activeStepIds);
    const previousRank = previous ? rankWorkflowStepInstance(previous, activeStepIds) : 0;

    if (!previous || stepRank > previousRank || (stepRank === previousRank && step.id > previous.id)) {
      byDesignStep.set(step.buocWorkflowId, step);
    }
  });

  return Array.from(byDesignStep.values()).sort((a, b) => a.buocWorkflowId - b.buocWorkflowId);
}

function rankDetailStep(step: WorkflowDetailStep, activeStepIds: Set<number>) {
  if (step.backendId != null && activeStepIds.has(step.backendId)) return 3;
  if (step.ngayXuLy || step.ketQua || step.state === "done") return 2;
  return 1;
}

export function dedupeDetailStepsByDesignStep(
  steps: WorkflowDetailStep[],
  activeStepIds: Set<number>,
) {
  const byDesignStep = new Map<number | string, WorkflowDetailStep>();

  steps.forEach((step, index) => {
    const key = step.buocWorkflowId ?? `runtime-${step.backendId ?? index}`;
    const previous = byDesignStep.get(key);
    const stepRank = rankDetailStep(step, activeStepIds);
    const previousRank = previous ? rankDetailStep(previous, activeStepIds) : 0;
    const stepId = step.backendId ?? 0;
    const previousId = previous?.backendId ?? 0;

    if (!previous || stepRank > previousRank || (stepRank === previousRank && stepId > previousId)) {
      byDesignStep.set(key, step);
    }
  });

  return Array.from(byDesignStep.values());
}

export function mapWorkflowStepState(
  step: WorkflowStepStateDto,
  currentStepId?: number,
): WorkflowDetailStep {
  const completed = step.ngayHoanThanh || step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED";
  const current = step.id === currentStepId;
  const overdue = Boolean(step.quaHan) || step.tinhTrangTienDo === "QUA_HAN";

  return {
    state: completed ? "done" : current || overdue ? "warn" : "idle",
    ten: step.tenBuoc,
    donVi: step.tenDonViXuLy || step.tenVaiTroXuLy || step.tenVaiTroKyDuyet || "-",
    backendId: step.id,
    buocWorkflowId: step.buocWorkflowId,
    current,
    nguoiXuLy: step.tenNguoiXuLy,
    ngayXuLy: step.ngayXuLy?.slice(0, 10),
    nguoiKy: step.tenNguoiKyDuyet,
    ngayKy: step.ngayKyDuyet?.slice(0, 10),
    ketQua: formatWorkflowKetQua(step.ketQua),
    ghiChu: step.ghiChu,
    lyDoKhongDuyet: step.lyDoKhongDuyet,
    slaText: overdue ? "Quá hạn" : TIEN_DO_LABEL[step.tinhTrangTienDo ?? ""] || undefined,
  };
}

export function mapWorkflowStateToDetailInfo(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
): WorkflowDetailInfo {
  if (!state && fallbackSteps.length === 0) {
    return {
      buocHienTai: "",
      nguoiXuLy: "",
      donViXuLy: "",
      sla: "Đang theo dõi",
      steps: [],
    };
  }

  const steps = state?.steps.length ? state.steps : fallbackSteps;
  const currentStep = state?.currentSteps?.[0];
  const currentStepDetail = steps.find((step) => step.id === currentStep?.stepInstanceId);

  return {
    buocHienTai: state?.tenBuocHienTai || currentStep?.tenBuoc || "",
    nguoiXuLy:
      state?.tenNguoiTao || steps.find((step) => step.id === currentStep?.stepInstanceId)?.tenNguoiXuLy || "",
    donViXuLy:
      state?.tenKhoaPhong || currentStepDetail?.tenVaiTroXuLy || currentStepDetail?.tenVaiTroKyDuyet || "",
    sla:
      state?.tinhTrangTienDo
        ? (TIEN_DO_LABEL[state.tinhTrangTienDo] ?? state.tinhTrangTienDo)
        : "Đang theo dõi",
    steps: steps.map((step) => mapWorkflowStepState(step, currentStep?.stepInstanceId)),
  };
}

export type WorkflowCurrentStepSummary = {
  detailInfo: WorkflowDetailInfo;
  currentStep?: CurrentStepDto;
  currentStepDetail?: WorkflowStepStateDto;
  currentStepName: string;
  currentProcessor: string;
  currentProcessDate: string;
  currentSigner: string;
  currentSignedDate: string;
  currentResult: string;
  currentDueDate: string;
};

export function resolveWorkflowCurrentStepSummary(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
): WorkflowCurrentStepSummary {
  const detailInfo = mapWorkflowStateToDetailInfo(state, fallbackSteps);
  const steps = state?.steps.length ? state.steps : fallbackSteps;
  const currentStep = state?.currentSteps?.[0];
  const currentStepDetail = steps.find((step) => step.id === currentStep?.stepInstanceId);

  return {
    detailInfo,
    currentStep,
    currentStepDetail,
    currentStepName: currentStepDetail?.tenBuoc || detailInfo.buocHienTai || "",
    currentProcessor: currentStepDetail?.tenNguoiXuLy || detailInfo.nguoiXuLy || "—",
    currentProcessDate: currentStepDetail?.ngayXuLy?.slice(0, 10) || "—",
    currentSigner: currentStepDetail?.tenNguoiKyDuyet || "—",
    currentSignedDate: currentStepDetail?.ngayKyDuyet?.slice(0, 10) || "—",
    currentResult:
      formatWorkflowKetQua(currentStepDetail?.ketQua) ||
      (currentStepDetail?.trangThai === "HOAN_TAT" ? "Duyệt" : currentStepDetail?.trangThai || "Chờ xử lý"),
    currentDueDate: currentStepDetail?.hanXuLy?.slice(0, 10) || "—",
  };
}

export function buildParallelInfoBySplitStep(
  groups: ParallelGroupDto[],
  runtimeSteps: WorkflowStepStateDto[],
  designSteps: BuocWorkflowDto[],
  currentSteps: { stepInstanceId: number }[] = [],
) {
  const activeStepIds = new Set(currentSteps.map((step) => step.stepInstanceId));

  return groups.reduce<Record<number, WorkflowParallelInfo>>((acc, group) => {
    const branchIds = new Set(group.branches.map((branch) => branch.id));
    const mergeStepOpen = runtimeSteps.some((step) =>
      step.buocWorkflowId === group.buocSauHopNhatId &&
      step.trangThai !== "PENDING" &&
      step.trangThai !== "CHUA_BAT_DAU",
    );
    const lockedStage = mergeStepOpen
      ? "Điều kiện hợp nhất đã thỏa, hệ thống đang mở bước sau hợp nhất."
      : "Điều kiện hợp nhất chưa thỏa, chưa mở bước sau hợp nhất.";

    acc[group.buocTachNhanhId] = {
      title: normalizeParallelGroupTitle(group.tenNhom),
      condition: group.dieuKienHopNhat === "ALL"
        ? "Tất cả nhánh phải hoàn thành trước khi hợp nhất."
        : group.dieuKienHopNhat === "SKIP_ALL"
          ? "Chỉ cho phép hợp nhất khi tất cả nhánh đều bị bỏ qua."
          : `Cần tối thiểu ${group.soNhanhHopNhatToiThieu ?? 1} nhánh hoàn thành trước khi hợp nhất.`,
      branches: group.branches.map((branch) => {
        const branchRuntimeSteps = dedupeWorkflowStepsByDesignStep(
          runtimeSteps.filter((step) => step.nhanhWorkflowId != null && branchIds.has(step.nhanhWorkflowId) && step.nhanhWorkflowId === branch.id),
          activeStepIds,
        );
        const branchDesignSteps = designSteps.filter((step) => step.nhanhWorkflowId === branch.id);
        const steps = branchRuntimeSteps.length > 0
          ? branchRuntimeSteps.map((step) => ({
              name: step.tenBuoc,
              backendId: step.id,
              state: getBranchStepState(step, activeStepIds),
              ghiChu: step.ghiChu,
            }))
          : branchDesignSteps.map((step) => ({
              name: step.tenBuoc,
              backendId: step.id,
              state: "idle" as const,
            }));

        const currentBranchStep = branchRuntimeSteps.find((step) =>
          activeStepIds.has(step.id) ||
          step.trangThai === "DANG_XU_LY" ||
          step.trangThai === "CHO_DUYET",
        );
        const completedCount = branchRuntimeSteps.filter(isStepCompleted).length;
        const terminalStep = branchRuntimeSteps.find((step) =>
          step.trangThai === "HOAN_TAT" ||
          step.trangThai === "COMPLETED" ||
          step.trangThai === "SKIPPED",
        );
        const anyCompleted = branchRuntimeSteps.some(isStepCompleted);
        const allCompleted = branchRuntimeSteps.length > 0 && branchRuntimeSteps.every(isStepCompleted);
        const allSkipped = branchRuntimeSteps.length > 0 && branchRuntimeSteps.every(isStepSkipped);
        const noteSource = currentBranchStep?.ghiChu?.trim()
          ? currentBranchStep
          : [...branchRuntimeSteps].reverse().find((step) => step.ghiChu?.trim())
          ?? terminalStep;

        return {
          name: branch.tenNhanh,
          backendId: currentBranchStep?.id ?? terminalStep?.id ?? branchRuntimeSteps[branchRuntimeSteps.length - 1]?.id,
          progress: `${completedCount}/${steps.length}`,
          status: allSkipped
            ? "Đã bỏ qua"
            : currentBranchStep
              ? getStepProgressLabel(currentBranchStep)
              : (anyCompleted || allCompleted ? "Đã hoàn thành" : "Chưa đến lượt xử lý"),
          currentStep: currentBranchStep?.tenBuoc || terminalStep?.tenBuoc || steps[0]?.name || "—",
          processor: currentBranchStep?.tenNguoiXuLy || currentBranchStep?.tenVaiTroXuLy || terminalStep?.tenNguoiXuLy || "—",
          ghiChu: noteSource?.ghiChu,
          steps,
        };
      }),
      mergeStatus: `Hợp nhất tại bước #${group.buocSauHopNhatId}`,
      lockedStage,
    };

    return acc;
  }, {});
}

export function buildWorkflowDetailSteps(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
  designSteps: BuocWorkflowDto[] = [],
  parallelGroups: ParallelGroupDto[] = [],
): WorkflowDetailStep[] {
  const detailInfo = mapWorkflowStateToDetailInfo(state, fallbackSteps);
  const activeStepIds = new Set(state?.currentSteps?.map((step) => step.stepInstanceId) ?? []);
  const runtimeSteps = state?.steps.length ? state.steps : fallbackSteps;
  const parallelInfoBySplitStep = buildParallelInfoBySplitStep(
    parallelGroups,
    runtimeSteps,
    designSteps,
    state?.currentSteps ?? [],
  );
  const branchWorkflowStepIds = new Set([
    ...runtimeSteps
      .filter((step) => step.nhanhWorkflowId != null)
      .map((step) => step.buocWorkflowId),
    ...designSteps
      .filter((step) => step.nhanhWorkflowId != null)
      .map((step) => step.id),
  ]);
  const mainDetailSteps = dedupeDetailStepsByDesignStep(
    detailInfo.steps.filter(
      (step) => !step.buocWorkflowId || !branchWorkflowStepIds.has(step.buocWorkflowId),
    ),
    activeStepIds,
  );
  const mainDesignSteps = designSteps.filter((step) => step.nhanhWorkflowId == null);

  const displaySteps = mainDetailSteps.length > 0
    ? mainDetailSteps
    : mainDesignSteps.map((step) => ({
        state: "idle" as const,
        ten: step.tenBuoc,
        donVi: String(step.donViXuLyId ?? ""),
        backendId: step.id,
        buocWorkflowId: step.id,
        current: false,
        nguoiXuLy: undefined,
        ngayXuLy: undefined,
        nguoiKy: undefined,
        ngayKy: undefined,
        ketQua: undefined,
        lyDoKhongDuyet: undefined,
        slaText: undefined,
        parallelInfo: parallelInfoBySplitStep[step.id],
      }));

  return displaySteps.map((step) => ({
    ...step,
    parallelInfo: step.buocWorkflowId ? parallelInfoBySplitStep[step.buocWorkflowId] : undefined,
  }));
}
