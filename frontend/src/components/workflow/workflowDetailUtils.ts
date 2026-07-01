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

const SLA_TONE_MAP: Record<string, "emerald" | "amber" | "red" | "slate"> = {
  DUNG_TIEN_DO: "emerald",
  SAP_QUA_HAN: "amber",
  QUA_HAN: "red",
  CHUA_CO_HAN: "slate",
  CHUA_THUC_HIEN: "slate",
  HOAN_TAT: "emerald",
};

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_MS = 24 * 60 * 60 * 1000;

function getVietnamDateKey(value: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function formatVietnamDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function dateKeyToUtcMs(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function getSlaTone(rawStatus?: string | null): "emerald" | "amber" | "red" | "slate" {
  if (!rawStatus) return "slate";
  return SLA_TONE_MAP[rawStatus] ?? "slate";
}

export type WorkflowSlaState = {
  statusText: string;
  dueDateText: string;
  tone: "emerald" | "amber" | "red" | "slate";
  hasDeadline: boolean;
  overdueDays?: number;
  source: "backend" | "helper" | "none";
};

export function resolveWorkflowSlaState(
  hanXuLy?: string | null,
  rawProgressStatus?: string | null,
): WorkflowSlaState {
  if (!hanXuLy) {
    return {
      statusText: "Chưa thiết lập hạn xử lý",
      dueDateText: "Chưa thiết lập hạn xử lý",
      tone: "slate",
      hasDeadline: false,
      source: rawProgressStatus ? "backend" : "none",
    };
  }

  const dueDate = new Date(hanXuLy);
  const dueDateKey = getVietnamDateKey(dueDate);
  const dueDateText = formatVietnamDate(dueDate);
  const normalizedRawStatus = rawProgressStatus?.trim() || "";

  if (normalizedRawStatus) {
    const tone = getSlaTone(normalizedRawStatus);
    if (normalizedRawStatus === "QUA_HAN") {
      const todayKey = getVietnamDateKey(new Date());
      const overdueDays = Math.max(1, Math.floor((dateKeyToUtcMs(todayKey) - dateKeyToUtcMs(dueDateKey)) / DAY_MS));
      return {
        statusText: `Quá hạn ${overdueDays} ngày`,
        dueDateText,
        tone: "red",
        hasDeadline: true,
        overdueDays,
        source: "backend",
      };
    }

    return {
      statusText: TIEN_DO_LABEL[normalizedRawStatus] || normalizedRawStatus,
      dueDateText,
      tone,
      hasDeadline: true,
      source: "backend",
    };
  }

  const todayKey = getVietnamDateKey(new Date());
  const dayDiff = Math.floor((dateKeyToUtcMs(dueDateKey) - dateKeyToUtcMs(todayKey)) / DAY_MS);

  if (dayDiff < 0) {
    const overdueDays = Math.max(1, Math.abs(dayDiff));
    return {
      statusText: `Quá hạn ${overdueDays} ngày`,
      dueDateText,
      tone: "red",
      hasDeadline: true,
      overdueDays,
      source: "helper",
    };
  }

  if (dayDiff <= 1) {
    return {
      statusText: "Sắp tới hạn",
      dueDateText,
      tone: "amber",
      hasDeadline: true,
      source: "helper",
    };
  }

  return {
    statusText: "Đúng hạn",
    dueDateText,
    tone: "emerald",
    hasDeadline: true,
    source: "helper",
  };
}

export const WORKFLOW_DISPLAY_DASH = "—";

export function normalizeWorkflowText(value?: string | null, fallback = WORKFLOW_DISPLAY_DASH) {
  if (value == null) return fallback;

  const normalized = value.replace(/\uFFFD+/g, "").trim();
  return normalized || fallback;
}

function resolveCurrentWorkflowStepContext(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
) {
  const steps = state?.steps.length ? state.steps : fallbackSteps;
  const currentStep = state?.currentSteps?.[0];
  const currentWorkflowBuocWorkflowId = currentStep?.buocWorkflowId ?? state?.buocHienTaiId;
  const currentStepDetail =
    steps.find((step) => step.id === currentStep?.stepInstanceId) ??
    fallbackSteps.find((step) => step.id === currentStep?.stepInstanceId) ??
    (currentWorkflowBuocWorkflowId != null
      ? steps.find((step) => step.buocWorkflowId === currentWorkflowBuocWorkflowId) ??
        fallbackSteps.find((step) => step.buocWorkflowId === currentWorkflowBuocWorkflowId)
      : undefined) ??
    (state?.tenBuocHienTai
      ? steps.find((step) => normalizeWorkflowText(step.tenBuoc) === normalizeWorkflowText(state.tenBuocHienTai)) ??
        fallbackSteps.find((step) => normalizeWorkflowText(step.tenBuoc) === normalizeWorkflowText(state.tenBuocHienTai))
      : undefined);

  return {
    steps,
    currentStep,
    currentStepDetail,
    currentWorkflowBuocWorkflowId,
  };
}

function resolveCurrentProcessorName(stepName?: string | null, creatorName?: string | null) {
  if (stepName && stepName.trim()) return stepName.trim();
  if (creatorName && creatorName.trim()) return creatorName.trim();
  return WORKFLOW_DISPLAY_DASH;
}

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

function rankWorkflowStepInstance(
  step: WorkflowStepStateDto,
  activeStepIds: Set<number>,
  currentWorkflowBuocWorkflowIds: Set<number>,
) {
  if (activeStepIds.has(step.id) || currentWorkflowBuocWorkflowIds.has(step.buocWorkflowId)) return 5;
  if (step.trangThai === "DANG_XU_LY" || step.trangThai === "CHO_DUYET") return 4;
  if (step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || step.ngayHoanThanh) return 3;
  if (step.trangThai === "SKIPPED") return 2;
  return 1;
}

export function dedupeWorkflowStepsByDesignStep(
  steps: WorkflowStepStateDto[],
  activeStepIds: Set<number>,
  currentWorkflowStepIds: Set<number> = new Set<number>(),
) {
  const byDesignStep = new Map<number, WorkflowStepStateDto>();

  steps.forEach((step) => {
    const previous = byDesignStep.get(step.buocWorkflowId);
    const stepRank = rankWorkflowStepInstance(step, activeStepIds, currentWorkflowStepIds);
    const previousRank = previous ? rankWorkflowStepInstance(previous, activeStepIds, currentWorkflowStepIds) : 0;

    if (!previous || stepRank > previousRank || (stepRank === previousRank && step.id > previous.id)) {
      byDesignStep.set(step.buocWorkflowId, step);
    }
  });

  return Array.from(byDesignStep.values()).sort((a, b) => a.buocWorkflowId - b.buocWorkflowId);
}

function rankDetailStep(
  step: WorkflowDetailStep,
  activeStepIds: Set<number>,
  currentWorkflowBuocWorkflowIds: Set<number>,
) {
  if (step.backendId != null && activeStepIds.has(step.backendId)) return 3;
  if (step.buocWorkflowId != null && currentWorkflowBuocWorkflowIds.has(step.buocWorkflowId)) return 3;
  if (step.ngayXuLy || step.ketQua || step.state === "done") return 2;
  return 1;
}

export function dedupeDetailStepsByDesignStep(
  steps: WorkflowDetailStep[],
  activeStepIds: Set<number>,
  currentWorkflowBuocWorkflowIds: Set<number> = new Set<number>(),
) {
  const byDesignStep = new Map<number | string, WorkflowDetailStep>();

  steps.forEach((step, index) => {
    const key = step.buocWorkflowId ?? `runtime-${step.backendId ?? index}`;
    const previous = byDesignStep.get(key);
    const stepRank = rankDetailStep(step, activeStepIds, currentWorkflowBuocWorkflowIds);
    const previousRank = previous ? rankDetailStep(previous, activeStepIds, currentWorkflowBuocWorkflowIds) : 0;
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
  currentWorkflowBuocWorkflowId?: number,
): WorkflowDetailStep {
  const completed = step.ngayHoanThanh || step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED";
  const current =
    step.id === currentStepId ||
    (currentWorkflowBuocWorkflowId != null && step.buocWorkflowId === currentWorkflowBuocWorkflowId);
  const progressStatus = step.tinhTrangTienDo ? TIEN_DO_LABEL[step.tinhTrangTienDo] || step.tinhTrangTienDo : undefined;
  const warningStatus = step.tinhTrangTienDo === "SAP_QUA_HAN" || step.tinhTrangTienDo === "QUA_HAN";

  return {
    state: completed ? "done" : current || warningStatus ? "warn" : "idle",
    ten: normalizeWorkflowText(step.tenBuoc),
    donVi: normalizeWorkflowText(step.tenDonViXuLy || step.tenVaiTroXuLy || step.tenVaiTroKyDuyet),
    backendId: step.id,
    buocWorkflowId: step.buocWorkflowId,
    current,
    isCurrent: current,
    nguoiXuLy: normalizeWorkflowText(step.tenNguoiXuLy),
    ngayXuLy: normalizeWorkflowText(step.ngayXuLy?.slice(0, 10)),
    nguoiKy: normalizeWorkflowText(step.tenNguoiKyDuyet),
    ngayKy: normalizeWorkflowText(step.ngayKyDuyet?.slice(0, 10)),
    ketQua: formatWorkflowKetQua(step.ketQua),
    ghiChu: normalizeWorkflowText(step.ghiChu, ""),
    lyDoKhongDuyet: normalizeWorkflowText(step.lyDoKhongDuyet, ""),
    slaText: progressStatus,
  };
}

export function mapWorkflowStateToDetailInfo(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
): WorkflowDetailInfo {
  if (!state && fallbackSteps.length === 0) {
    return {
      buocHienTai: WORKFLOW_DISPLAY_DASH,
      nguoiXuLy: WORKFLOW_DISPLAY_DASH,
      donViXuLy: WORKFLOW_DISPLAY_DASH,
      sla: WORKFLOW_DISPLAY_DASH,
      steps: [],
    };
  }

  const { steps, currentStep, currentStepDetail, currentWorkflowBuocWorkflowId } =
    resolveCurrentWorkflowStepContext(state, fallbackSteps);
  const currentProcessor = normalizeWorkflowText(
    resolveCurrentProcessorName(currentStepDetail?.tenNguoiXuLy, state?.tenNguoiTao),
  );

  return {
    buocHienTai: normalizeWorkflowText(currentStepDetail?.tenBuoc || state?.tenBuocHienTai || currentStep?.tenBuoc),
    nguoiXuLy: currentProcessor,
    donViXuLy: normalizeWorkflowText(
      state?.tenKhoaPhong || currentStepDetail?.tenVaiTroXuLy || currentStepDetail?.tenVaiTroKyDuyet,
    ),
    sla: resolveWorkflowProgressStatus(state, currentStepDetail),
    steps: steps.map((step) => mapWorkflowStepState(step, currentStep?.stepInstanceId, currentWorkflowBuocWorkflowId ?? undefined)),
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
  progressStatus: string;
};

function resolveWorkflowProgressStatus(
  state?: WorkflowStateDto | null,
  currentStepDetail?: WorkflowStepStateDto,
) {
  const rawStatus = currentStepDetail?.tinhTrangTienDo || state?.tinhTrangTienDo;
  if (!rawStatus) return WORKFLOW_DISPLAY_DASH;
  return TIEN_DO_LABEL[rawStatus] || rawStatus;
}

export function resolveWorkflowCurrentStepSummary(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
): WorkflowCurrentStepSummary {
  const detailInfo = mapWorkflowStateToDetailInfo(state, fallbackSteps);
  const { currentStep, currentStepDetail } = resolveCurrentWorkflowStepContext(state, fallbackSteps);

  return {
    detailInfo,
    currentStep,
    currentStepDetail,
    currentStepName: normalizeWorkflowText(currentStepDetail?.tenBuoc || detailInfo.buocHienTai),
    currentProcessor: normalizeWorkflowText(
      resolveCurrentProcessorName(currentStepDetail?.tenNguoiXuLy, state?.tenNguoiTao),
    ),
    currentProcessDate: normalizeWorkflowText(currentStepDetail?.ngayXuLy?.slice(0, 10)),
    currentSigner: normalizeWorkflowText(currentStepDetail?.tenNguoiKyDuyet),
    currentSignedDate: normalizeWorkflowText(currentStepDetail?.ngayKyDuyet?.slice(0, 10)),
    currentResult: currentStepDetail
      ? formatWorkflowKetQua(currentStepDetail.ketQua) ||
        (currentStepDetail.trangThai === "HOAN_TAT" ? "Duyệt" : currentStepDetail.trangThai || WORKFLOW_DISPLAY_DASH)
      : WORKFLOW_DISPLAY_DASH,
    currentDueDate: normalizeWorkflowText(currentStepDetail?.hanXuLy?.slice(0, 10)),
    progressStatus: resolveWorkflowProgressStatus(state, currentStepDetail),
  };
}
export function buildParallelInfoBySplitStep(
  groups: ParallelGroupDto[],
  runtimeSteps: WorkflowStepStateDto[],
  designSteps: BuocWorkflowDto[],
  currentSteps: { stepInstanceId: number }[] = [],
  currentWorkflowBuocWorkflowIds: Set<number> = new Set<number>(),
  tenderCreatorName?: string | null,
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
          currentWorkflowBuocWorkflowIds,
        );
        const branchDesignSteps = designSteps.filter((step) => step.nhanhWorkflowId === branch.id);
        const steps = branchRuntimeSteps.length > 0
          ? branchRuntimeSteps.map((step) => ({
              name: step.tenBuoc,
              backendId: step.id,
              state: getBranchStepState(step, activeStepIds),
              ghiChu: normalizeWorkflowText(step.ghiChu, ""),
            }))
          : branchDesignSteps.map((step) => ({
              name: step.tenBuoc,
              backendId: step.id,
              state: "idle" as const,
            }));

        const currentBranchStep = branchRuntimeSteps.find((step) =>
          activeStepIds.has(step.id) ||
          currentWorkflowBuocWorkflowIds.has(step.buocWorkflowId) ||
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
          currentStep: normalizeWorkflowText(currentBranchStep?.tenBuoc || terminalStep?.tenBuoc || steps[0]?.name),
          processor: normalizeWorkflowText(currentBranchStep?.tenNguoiXuLy || terminalStep?.tenNguoiXuLy || tenderCreatorName),
          ghiChu: normalizeWorkflowText(noteSource?.ghiChu, ""),
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
  const { currentWorkflowBuocWorkflowId } = resolveCurrentWorkflowStepContext(state, fallbackSteps);
  const activeStepIds = new Set(state?.currentSteps?.map((step) => step.stepInstanceId) ?? []);
  const currentWorkflowBuocWorkflowIds = new Set<number>(
    currentWorkflowBuocWorkflowId != null ? [currentWorkflowBuocWorkflowId] : [],
  );
  const runtimeSteps = state?.steps.length ? state.steps : fallbackSteps;
  const parallelInfoBySplitStep = buildParallelInfoBySplitStep(
    parallelGroups,
    runtimeSteps,
    designSteps,
    state?.currentSteps ?? [],
    currentWorkflowBuocWorkflowIds,
    state?.tenNguoiTao,
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
    currentWorkflowBuocWorkflowIds,
  );
  const mainDesignSteps = designSteps.filter((step) => step.nhanhWorkflowId == null);

  const displaySteps = mainDetailSteps.length > 0
    ? mainDetailSteps
      : mainDesignSteps.map((step) => ({
        state: "idle" as const,
        ten: normalizeWorkflowText(step.tenBuoc),
        donVi: String(step.donViXuLyId ?? ""),
        backendId: step.id,
        buocWorkflowId: step.id,
        current: currentWorkflowBuocWorkflowIds.has(step.id),
        isCurrent: currentWorkflowBuocWorkflowIds.has(step.id),
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
