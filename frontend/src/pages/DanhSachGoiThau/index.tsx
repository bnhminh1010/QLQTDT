import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUserApi, type LoginUserDto } from "@/services/api";
import GoiThauDetailPanel from "@/components/workflow/GoiThauDetailPanel";
import WorkflowStepsPanel from "@/components/workflow/WorkflowStepsPanel";
import { SelectField } from "@/components/ui/select";
import { getUserGoiThauList } from "./goiThauService";
import { cancelGoiThau, deleteGoiThau, getGoiThauChiTiet, type GoiThauDetail } from "@/services/goiThauApi";
import {
  getWorkflowState,
  getWorkflowSteps,
  formatWorkflowKetQua,
  processStep,
  getWorkflowDesignSteps,
  getParallelGroups,
  getLichSuGoiThau,

  type WorkflowStateDto,
  type WorkflowStepStateDto,
  type BuocWorkflowDto,
  type ParallelGroupDto,
  type LichSuGoiThauTimelineDto,
} from "@/services/workflowApi";
import type { GoiThau, HinhThuc, TrangThai } from "./goiThauService";
import { normalizeParallelGroupTitle } from "@/constants/parallelGroup";
import { getRoleCode, hasAnyPermission } from "@/hooks/useAccessLevel";
import {
  buildWorkflowDetailSteps,
  resolveWorkflowCurrentStepSummary,
} from "@/components/workflow/workflowDetailUtils";
import { resolveGoiThauNguonVon } from "@/util/goiThauDisplay";

/* ─── Types ───────────────────────────────────────────── */
export type DotState = "done" | "warn" | "idle";

export type LichSuGoiThau = {
  id: string;
  goiThauId: string;
  thoiGian: string;
  nguoiThucHien: string;
  loai: string;
  tieuDe: string;
  noiDung: string;
};

export type QuyTrinhStepDetail = {
  state: DotState;
  ten: string;
  donVi: string;
  backendId?: number;
  buocWorkflowId?: number;
  current?: boolean;
  nguoiXuLy?: string;
  ngayXuLy?: string;
  nguoiKy?: string;
  ngayKy?: string;
  ketQua?: string;
  ghiChu?: string;
  lyDoKhongDuyet?: string;
  slaText?: string;
};

export type ParallelInfo = {
  title: string;
  condition: string;
  branches: {
    name: string;
    backendId?: number;
    progress: string;
    status: string;
    currentStep: string;
    processor: string;
    ghiChu?: string;
    steps: {
      name: string;
      backendId?: number;
      state: "done" | "current" | "idle" | "skipped";
      ghiChu?: string;
    }[];
  }[];
  mergeStatus: string;
  lockedStage: string;
};

export type GoiThauDetailInfo = {
  buocHienTai: string;
  nguoiXuLy: string;
  donViXuLy: string;
  sla: string;
  lyDoTreHan?: string;
  steps: QuyTrinhStepDetail[];
  parallelInfo?: ParallelInfo;
};

/* ─── Badge / color maps ──────────────────────────────── */
const BADGE: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Đã hủy": "bg-slate-100 text-slate-500",
  "Nháp": "bg-purple-100 text-purple-600",
  "Đã chọn nhà thầu": "bg-emerald-100 text-emerald-700",
};
const HT_BADGE: Partial<Record<HinhThuc, string>> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu tự quyết định LCNT": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
  "Mua sắm trực tiếp": "bg-cyan-100 text-cyan-700",
  "Chào giá trực tuyến thông thường": "bg-indigo-100 text-indigo-700",
  "Chào giá trực tuyến rút gọn": "bg-indigo-100 text-indigo-700",
  "Mua sắm trực tuyến": "bg-teal-100 text-teal-700",
  "Đặt hàng": "bg-orange-100 text-orange-700",
};
const BAR_COLOR: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-500",
  "Hoàn thành": "bg-emerald-500",
  "Trễ hạn": "bg-red-500",
  "Chờ duyệt": "bg-amber-500",
  "Đã hủy": "bg-slate-400",
  "Nháp": "bg-purple-400",
  "Đã chọn nhà thầu": "bg-emerald-400",
};
/* ─── Mock data (keep as fallback when API unavailable) ─── */
const HISTORY_LOGS: LichSuGoiThau[] = [];
void HISTORY_LOGS;

const DEFAULT_DETAIL_INFO: GoiThauDetailInfo = {
  buocHienTai: "",
  nguoiXuLy: "",
  donViXuLy: "",
  sla: "Đang theo dõi",
  steps: [],
};

const DETAIL_INFO_BY_ID: Record<string, GoiThauDetailInfo> = {};

function formatCurrencyDisplay(value: string) {
  return value.replace(/,/g, ".") + " đ";
}

const PAGE_SIZE = 8;
type SortCol = "id" | "ten" | "giaTriNum" | "trangThai";

const EDITABLE_STATUSES: TrangThai[] = ["Nháp"];
const STEP_UPDATE_STATUSES: TrangThai[] = ["Đang xử lý", "Chờ duyệt", "Trễ hạn"];
const CURRENT_STEP_UPDATE_PERMISSIONS = ["WORKFLOW.PROCESS", "GOITHAU.EDIT", "GOITHAU.CREATE"];
const canEditGoiThau = (item?: GoiThau | null) =>
  item ? EDITABLE_STATUSES.includes(item.trangThai) : false;
const canDeleteGoiThau = canEditGoiThau;
const canUpdateCurrentStep = (item?: GoiThau | null) =>
  item ? STEP_UPDATE_STATUSES.includes(item.trangThai) : false;

function normalizeIdentity(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSameIdentity(left?: string | null, right?: string | null) {
  const normalizedLeft = normalizeIdentity(left);
  const normalizedRight = normalizeIdentity(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight;
}

function getCurrentStepActionState(
  item: GoiThau | null | undefined,
  workflowState: WorkflowStateDto | null,
  currentWorkflowSummary: ReturnType<typeof resolveWorkflowCurrentStepSummary>,
  user: LoginUserDto | null,
  userLoaded: boolean,
) {
  const baseEnabled = Boolean(item && canUpdateCurrentStep(item));
  const activeStep = workflowState?.currentSteps?.[0];
  const activeStepId = activeStep?.stepInstanceId;

  if (!baseEnabled) {
    return {
      enabled: false,
      reason: item?.trangThai === "Hoàn thành" || item?.trangThai === "Đã hủy"
        ? "Workflow đã kết thúc nên không còn thao tác cập nhật bước."
        : "Gói thầu không còn ở trạng thái cho phép xử lý bước.",
    };
  }

  if (!activeStepId) {
    return {
      enabled: false,
      reason: "Thiếu workflowStepInstanceId của bước hiện tại.",
    };
  }

  if (!userLoaded) {
    return {
      enabled: true,
      reason: "Cập nhật bước hiện tại",
    };
  }

  if (!user) {
    return {
      enabled: false,
      reason: "Không xác định được người dùng đăng nhập.",
    };
  }

  if (!hasAnyPermission(user, CURRENT_STEP_UPDATE_PERMISSIONS)) {
    return {
      enabled: false,
      reason: "Không có quyền xử lý bước hiện tại.",
    };
  }

  const currentProcessor = normalizeIdentity(currentWorkflowSummary.currentProcessor);
  const currentCreator = normalizeIdentity(workflowState?.tenNguoiTao);
  const loginNames = [user.tenDangNhap, user.hoTen, user.email];
  const matchesProcessor = loginNames.some((name) => isSameIdentity(name, currentProcessor));
  const matchesCreator = loginNames.some((name) => isSameIdentity(name, currentCreator));

  if (!matchesProcessor && !matchesCreator) {
    return {
      enabled: false,
      reason: "Bạn không phải người xử lý hiện tại hoặc người tạo gói.",
    };
  }

  return {
    enabled: true,
    reason: "Cập nhật bước hiện tại",
  };
}

function parseGoiThauNumericId(id: string) {
  const parsed = Number(id.replace(/^GT/i, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mapTimelineHistoryToModalEntry(item: LichSuGoiThauTimelineDto): LichSuGoiThau {
  return {
    id: item.id,
    goiThauId: `GT${item.goiThauId}`,
    thoiGian: formatHistoryDate(item.thoiGian),
    nguoiThucHien: item.tenNguoiThucHien || (item.nguoiThucHienId ? `Người dùng #${item.nguoiThucHienId}` : "Hệ thống"),
    loai: item.loai,
    tieuDe: item.tieuDe,
    noiDung: item.noiDung,
  };
}

function getHistoryTypeLabel(type: string) {
  const labels: Record<string, string> = {
    TRANG_THAI: "Trạng thái",
    QUY_TRINH: "Quy trình",
    TAI_LIEU: "Tài liệu",
    HO_SO: "Hồ sơ",
    HOP_DONG: "Hợp đồng",
    CAP_NHAT: "Cập nhật",
    HE_THONG: "Hệ thống",
  };
  return labels[type] ?? type;
}

function getHistoryTypeClass(type: string) {
  const classes: Record<string, string> = {
    TRANG_THAI: "bg-blue-100 text-blue-700",
    QUY_TRINH: "bg-purple-100 text-purple-700",
    TAI_LIEU: "bg-cyan-100 text-cyan-700",
    HO_SO: "bg-amber-100 text-amber-700",
    HOP_DONG: "bg-emerald-100 text-emerald-700",
    CAP_NHAT: "bg-slate-100 text-slate-700",
    HE_THONG: "bg-slate-100 text-slate-600",
  };
  return classes[type] ?? "bg-slate-100 text-slate-600";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (typeof data !== "object" || data === null) return fallback;

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if ("error" in data) {
    const errorValue = data.error;
    if (typeof errorValue === "string") return errorValue;
    if (
      typeof errorValue === "object" &&
      errorValue !== null &&
      "message" in errorValue &&
      typeof errorValue.message === "string"
    ) {
      return errorValue.message;
    }
  }

  return fallback;
}

const TIEN_DO_LABEL: Record<string, string> = {
  DUNG_TIEN_DO: "Đúng hạn",
  QUA_HAN: "Quá hạn",
  SAP_QUA_HAN: "Sắp quá hạn",
  CHUA_THUC_HIEN: "Chưa thực hiện",
  CHUA_CO_HAN: "Chưa có hạn xử lý",
  HOAN_TAT: "Hoàn tất",
};

function mapWorkflowStepState(
  step: WorkflowStepStateDto,
  currentStepId?: number,
  currentWorkflowBuocWorkflowId?: number,
): QuyTrinhStepDetail {
  const completed = step.ngayHoanThanh || step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED";
  const current =
    step.id === currentStepId ||
    (currentWorkflowBuocWorkflowId != null && step.buocWorkflowId === currentWorkflowBuocWorkflowId);
  const progressStatus = step.tinhTrangTienDo ? TIEN_DO_LABEL[step.tinhTrangTienDo] || step.tinhTrangTienDo : undefined;
  const warningStatus = step.tinhTrangTienDo === "SAP_QUA_HAN" || step.tinhTrangTienDo === "QUA_HAN";

  return {
    state: completed ? "done" : current || warningStatus ? "warn" : "idle",
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
    slaText: progressStatus,
  };
}

export function getStepProgressLabel(step: WorkflowStepStateDto) {
  if (step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || step.ngayHoanThanh) return "Đã hoàn thành";
  if (step.trangThai === "SKIPPED") return "Đã bỏ qua";
  if (step.trangThai === "DANG_XU_LY" || step.trangThai === "CHO_DUYET") return "Đang xử lý";
  return "Chưa thực hiện";
}

export function isStepCompleted(step: WorkflowStepStateDto) {
  return step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || Boolean(step.ngayHoanThanh);
}

export function isStepSkipped(step: WorkflowStepStateDto) {
  return step.trangThai === "SKIPPED";
}

export function getBranchStepState(
  step: WorkflowStepStateDto,
  activeStepIds: Set<number>,
): "done" | "current" | "idle" | "skipped" {
  if (step.trangThai === "SKIPPED") return "skipped";
  if (activeStepIds.has(step.id)) return "current";
  if (step.trangThai === "DANG_XU_LY" || step.trangThai === "CHO_DUYET") return "current";
  if (step.trangThai === "HOAN_TAT" || step.trangThai === "COMPLETED" || step.ngayHoanThanh) return "done";
  return "idle";
}

export function rankWorkflowStepInstance(step: WorkflowStepStateDto, activeStepIds: Set<number>) {
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

export function rankDetailStep(step: QuyTrinhStepDetail, activeStepIds: Set<number>) {
  if (step.backendId != null && activeStepIds.has(step.backendId)) return 3;
  if (step.ngayXuLy || step.ketQua || step.state === "done") return 2;
  return 1;
}

export function dedupeDetailStepsByDesignStep(
  steps: QuyTrinhStepDetail[],
  activeStepIds: Set<number>,
) {
  const byDesignStep = new Map<number | string, QuyTrinhStepDetail>();

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

export function buildParallelInfoBySplitStep(
  groups: ParallelGroupDto[],
  runtimeSteps: WorkflowStepStateDto[],
  designSteps: BuocWorkflowDto[],
  currentSteps: { stepInstanceId: number }[] = [],
) {
  const activeStepIds = new Set(currentSteps.map((step) => step.stepInstanceId));
  return groups.reduce<Record<number, ParallelInfo>>((acc, group) => {
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
          processor: currentBranchStep?.tenNguoiXuLy || terminalStep?.tenNguoiXuLy || "—",
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

export function mapWorkflowStateToDetailInfo(
  state?: WorkflowStateDto | null,
  fallbackSteps: WorkflowStepStateDto[] = [],
): GoiThauDetailInfo {
  if (!state && fallbackSteps.length === 0) return DEFAULT_DETAIL_INFO;

  const steps = state?.steps.length ? state.steps : fallbackSteps;
  const currentStep = state?.currentSteps?.[0];
  const currentWorkflowBuocWorkflowId = currentStep?.buocWorkflowId ?? state?.buocHienTaiId;
  const currentStepDetail =
    steps.find((step) => step.id === currentStep?.stepInstanceId) ??
    (currentWorkflowBuocWorkflowId != null
      ? steps.find((step) => step.buocWorkflowId === currentWorkflowBuocWorkflowId)
      : undefined);
  return {
    buocHienTai: currentStepDetail?.tenBuoc || state?.tenBuocHienTai || currentStep?.tenBuoc || "",
    nguoiXuLy:
      currentStepDetail?.tenNguoiXuLy ||
      state?.tenNguoiTao ||
      "",
    donViXuLy:
      state?.tenKhoaPhong || currentStepDetail?.tenVaiTroXuLy || currentStepDetail?.tenVaiTroKyDuyet || "",
    sla: state?.tinhTrangTienDo
      ? (TIEN_DO_LABEL[state.tinhTrangTienDo] ?? state.tinhTrangTienDo)
      : "Đang theo dõi",
    steps: steps.map((step) =>
      mapWorkflowStepState(step, currentStep?.stepInstanceId, currentWorkflowBuocWorkflowId ?? undefined),
    ),
  };
}

/* ─── Sub-components ──────────────────────────────────── */
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active)
    return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
  return dir === "asc" ? (
    <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
  ) : (
    <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />
  );
}

type ConfirmProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
};
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  danger = false,
}: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}
          >
            <i
              className={`fa-solid fa-triangle-exclamation ${danger ? "text-red-500" : "text-amber-500"}`}
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`h-9 px-5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type HistoryModalProps = {
  goiThau: GoiThau;
  entries: LichSuGoiThau[];
  loading?: boolean;
  onClose: () => void;
};

function HistoryModal({ goiThau, entries, loading = false, onClose }: HistoryModalProps) {
  const hasEntries = entries.length > 0;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono font-bold text-blue-700">
              {goiThau.id}
            </p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Lịch sử gói thầu
            </h3>
            <p className="text-xs text-slate-500 mt-1">{goiThau.ten}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-10 text-center">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-300" />
              <p className="text-sm text-slate-400 mt-3">
                Đang tải lịch sử gói thầu...
              </p>
            </div>
          ) : !hasEntries ? (
            <div className="py-10 text-center">
              <i className="fa-solid fa-clock-rotate-left text-3xl text-slate-200" />
              <p className="text-sm text-slate-400 mt-3">
                Chưa có lịch sử thao tác cho gói thầu này.
              </p>
            </div>
          ) : (
            <div className="relative space-y-5 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-slate-200">
              {entries.map((entry) => (
                <div key={entry.id} className="relative flex gap-4">
                  <div className="relative z-10 mt-1 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i className="fa-solid fa-clock text-[10px]" />
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {entry.tieuDe}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {entry.thoiGian}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getHistoryTypeClass(entry.loai)}`}>
                        {getHistoryTypeLabel(entry.loai)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">
                      {entry.nguoiThucHien}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">
                      {entry.noiDung}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function DanhSachGoiThau() {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<GoiThau[]>([]);
  const [selected, setSelected] = useState<GoiThau>(() => ({
    id: "", ten: "", tenGoiThau: "", maGoiThau: "", hinhThuc: "",
    giaTriStr: "0", giaTriNum: 0, donVi: "",
    trangThai: "Đang xử lý",
    detail: { nguonVon: "—", ngayTao: "—", hanHT: "—", pct: "0%", buoc: "0/0" },
  }));
  const [selectedDetail, setSelectedDetail] = useState<GoiThauDetail | null>(null);
  const [search, setSearch] = useState("");
  const [filterHT, setFilterHT] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoginUserDto | null>(null);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);

  // Real loading from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowStateDto | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepStateDto[] | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowRefreshKey, setWorkflowRefreshKey] = useState(0);
  const [parallelGroups, setParallelGroups] = useState<ParallelGroupDto[]>([]);

  // Design-time step preview (fallback when workflow not started)
  const [designSteps, setDesignSteps] = useState<BuocWorkflowDto[]>([]);
  const [cancelTarget, setCancelTarget] = useState<GoiThau | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoiThau | null>(null);
  const [historyTarget, setHistoryTarget] = useState<GoiThau | null>(null);
  const [historyEntries, setHistoryEntries] = useState<LichSuGoiThau[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const isAdminObserver = currentUser ? getRoleCode(currentUser) === "ADMIN" : false;
  const canMutateGoiThau = currentUser != null && !isAdminObserver;
  const canUserEditGoiThau = (item?: GoiThau | null) =>
    canMutateGoiThau && canEditGoiThau(item);
  const canUserDeleteGoiThau = (item?: GoiThau | null) =>
    canMutateGoiThau && canDeleteGoiThau(item);
  const canUserUpdateCurrentStep = (item?: GoiThau | null) =>
    canMutateGoiThau && canUpdateCurrentStep(item);

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getUserGoiThauList();
      setData(list);
      setSelected((prev) => {
        if (prev && prev.id) {
          const refreshed = list.find((item) => item.id === prev.id);
          if (refreshed) return refreshed;
          return prev;
        }
        if (list.length > 0) return list[0];
        return prev;
      });
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserApi()
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setCurrentUserLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function openHistory(item: GoiThau) {
    setHistoryTarget(item);
    setHistoryEntries([]);

    const numericId = parseGoiThauNumericId(item.id);
    if (!numericId) {
      toast.error("ID gói thầu không hợp lệ.");
      return;
    }

    setHistoryLoading(true);
    try {
      const histories = await getLichSuGoiThau(numericId);
      setHistoryEntries(histories.map(mapTimelineHistoryToModalEntry));
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải lịch sử gói thầu.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("goiThauId");
    if (!id) return;
    loadData();
    setWorkflowRefreshKey((k) => k + 1); // Force re-fetch workflowState when navigating back
  }, [location.search, loadData]);

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("goiThauId");
    if (!id) return;
    const target = data.find((item) => item.id === id);
    if (target) {
      setSelected(target);
      setDetailOpen(true);
    }
  }, [data, location.search]);

  useEffect(() => {
    const numericId = parseGoiThauNumericId(selected.id);
    if (!numericId) {
      setSelectedDetail(null);
      return;
    }

    let cancelled = false;
    setSelectedDetail(null);

    void getGoiThauChiTiet(numericId)
      .then((detail) => {
        if (!cancelled) setSelectedDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setSelectedDetail(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selected.id]);

  useEffect(() => {
    setPage(1);
  }, [search, filterHT, filterTT, sortCol, sortDir]);

  useEffect(() => {
    const numericId = parseGoiThauNumericId(selected.id);
    if (!numericId) {
      setWorkflowState(null);
      setWorkflowSteps(null);
      setDesignSteps([]);
      setParallelGroups([]);
      return;
    }

    let cancelled = false;
    const loadWorkflow = async () => {
      setWorkflowLoading(true);

      try {
        const [state, steps] = await Promise.all([
          getWorkflowState(numericId),
          getWorkflowSteps(numericId),
        ]);
        const workflowId = selected.workflowId ?? state.workflowId;
        const [design, groups] = workflowId
          ? await Promise.all([
              getWorkflowDesignSteps(workflowId).catch(() => [] as BuocWorkflowDto[]),
              getParallelGroups(workflowId).catch(() => [] as ParallelGroupDto[]),
            ])
          : [[] as BuocWorkflowDto[], [] as ParallelGroupDto[]];

        if (cancelled) return;
        setWorkflowState(state);
        setWorkflowSteps(steps);
        setDesignSteps(design);
        setParallelGroups(groups);
      } catch {
        if (cancelled) return;
        setWorkflowState(null);
        setWorkflowSteps(null);

        if (!selected.workflowId) {
          setDesignSteps([]);
          setParallelGroups([]);
          return;
        }

        try {
          const [steps, groups] = await Promise.all([
            getWorkflowDesignSteps(selected.workflowId),
            getParallelGroups(selected.workflowId).catch(() => [] as ParallelGroupDto[]),
          ]);
          if (!cancelled) {
            setDesignSteps(steps);
            setParallelGroups(groups);
          }
        } catch {
          if (!cancelled) {
            setDesignSteps([]);
            setParallelGroups([]);
          }
        }
      } finally {
        if (!cancelled) setWorkflowLoading(false);
      }
    };

    void loadWorkflow();

    return () => {
      cancelled = true;
    };
  }, [selected.id, selected.workflowId, workflowRefreshKey]);

  /* ─ Derived list ─ */
  const filtered = useMemo(() => {
    let list = data.filter(
      (r) =>
        (r.ten.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase())) &&
        (filterHT === "" || r.hinhThuc === filterHT) &&
        (filterTT === "" || r.trangThai === filterTT),
    );
    if (sortCol) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortCol === "giaTriNum") cmp = a.giaTriNum - b.giaTriNum;
        else cmp = String(a[sortCol]).localeCompare(String(b[sortCol]), "vi");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, filterHT, filterTT, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function handleCancel() {
    if (!cancelTarget) return;

    const numId = parseInt(cancelTarget.id.replace(/^GT/, ""), 10);
    if (!numId) {
      toast.error("ID gói thầu không hợp lệ");
      return;
    }

    cancelGoiThau(numId).then(() => {
      setData((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id ? { ...r, trangThai: "Đã hủy" } : r,
        ),
      );
      if (selected.id === cancelTarget.id)
        setSelected({ ...selected, trangThai: "Đã hủy" });
      toast.success(`Đã hủy gói thầu "${cancelTarget.ten}"`);
      setCancelTarget(null);
    }).catch((error) => {
      toast.error(getApiErrorMessage(error, "Không thể hủy gói thầu"));
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    if (!canUserDeleteGoiThau(deleteTarget)) {
      toast.error("Chỉ có thể xóa gói thầu ở trạng thái Nháp");
      setDeleteTarget(null);
      return;
    }

    const numId = parseInt(deleteTarget.id.replace(/^GT/, ''), 10);
    if (!numId) { toast.error("ID gói thầu không hợp lệ"); return; }
    deleteGoiThau(numId).then(() => {
      const remaining = data.filter((r) => r.id !== deleteTarget.id);
      setData(remaining);
      if (selected.id === deleteTarget.id && remaining.length > 0)
        setSelected(remaining[0]);
      toast.success(`Đã xóa "${deleteTarget.ten}"`);
      setDeleteTarget(null);
    }).catch((error) => toast.error(getApiErrorMessage(error, "Không thể xóa gói thầu")));
  }

  function goToEdit(item: GoiThau) {
    if (!canUserEditGoiThau(item)) {
      toast.error("Chỉ được chỉnh sửa gói thầu ở trạng thái Nháp");
      return;
    }
    navigate(`/tao-goi-thau?mode=edit&id=${encodeURIComponent(item.id)}`, {
      state: { goiThau: item },
    });
  }

  function getCurrentStepUrl(item: GoiThau) {
    const params = new URLSearchParams();
    const activeStep = workflowState?.currentSteps?.[0];
    if (activeStep?.stepInstanceId) {
      params.set("step", activeStep.tenBuoc);
      params.set("stepId", String(activeStep.stepInstanceId));
    }
    const query = params.toString();
    return `/xu-ly-buoc/${encodeURIComponent(item.id)}${query ? `?${query}` : ""}`;
  }

  function handlePrimaryAction(item: GoiThau) {
    if (canUserEditGoiThau(item)) {
      goToEdit(item);
      return;
    }
    if (canUserUpdateCurrentStep(item)) {
      goToCurrentStep(item);
      return;
    }
    toast.error("Gói thầu ở trạng thái này không còn thao tác xử lý bước");
  }

  function goToCurrentStep(item: GoiThau) {
    if (isAdminObserver) {
      toast.error("Admin chỉ có quyền quan sát, không được xử lý bước gói thầu.");
      return;
    }

    const currentWorkflowSummary = resolveWorkflowCurrentStepSummary(workflowState, workflowSteps ?? []);
    const actionState = getCurrentStepActionState(
      item,
      workflowState,
      currentWorkflowSummary,
      currentUser,
      currentUserLoaded,
    );
    if (!actionState.enabled) {
      toast.error(actionState.reason);
      return;
    }
    navigate(getCurrentStepUrl(item));
  }

  function goToStepResult(item: GoiThau, stepName: string, stepId?: number) {
    const params = new URLSearchParams({ mode: "view", step: stepName });
    if (stepId) params.set("stepId", String(stepId));
    navigate(`/xu-ly-buoc/${encodeURIComponent(item.id)}?${params.toString()}`);
  }

  /* ─ Detail panel content ─ */
  function DetailPanel() {
    const currentWorkflowSummary = resolveWorkflowCurrentStepSummary(workflowState, workflowSteps ?? []);
    const detailInfo = currentWorkflowSummary.detailInfo || DETAIL_INFO_BY_ID[selected.id] || DEFAULT_DETAIL_INFO;
    const currentStepName = currentWorkflowSummary.currentStepName;
    const progressStatus = currentWorkflowSummary.progressStatus;
    const baseSteps = buildWorkflowDetailSteps(workflowState, workflowSteps ?? [], designSteps, parallelGroups);
    const completedSteps = baseSteps.filter((step) => step.state === "done").length;
    const progressText = workflowState ? `${completedSteps}/${baseSteps.length}` : selected.detail.buoc;
    const progressPct =
      workflowState && baseSteps.length > 0
        ? `${Math.round((completedSteps / baseSteps.length) * 100)}%`
        : selected.detail.pct;
    const currentStepActionState = getCurrentStepActionState(
      selected,
      workflowState,
      currentWorkflowSummary,
      currentUser,
      currentUserLoaded,
    );
    const canProcessWorkflowStep = () => canMutateGoiThau && currentStepActionState.enabled;

    const displaySteps = baseSteps.map((step) =>
      step.current
        ? {
            ...step,
            slaText: progressStatus,
            ten: currentStepName || step.ten,
            nguoiXuLy: currentWorkflowSummary.currentProcessor || step.nguoiXuLy,
            ngayXuLy: currentWorkflowSummary.currentProcessDate || step.ngayXuLy,
            nguoiKy: currentWorkflowSummary.currentSigner || step.nguoiKy,
            ngayKy: currentWorkflowSummary.currentSignedDate || step.ngayKy,
            ketQua: currentWorkflowSummary.currentResult || step.ketQua,
          }
        : step,
    );
    return (
      <GoiThauDetailPanel
        code={selected.id}
        title={selected.ten}
        subtitle={selected.donVi}
        badges={[
          { label: selected.hinhThuc, className: "border border-slate-200 text-slate-600" },
          { label: selected.trangThai, className: BADGE[selected.trangThai] },
        ]}
        progressLabel={progressText}
        progressValue={progressPct}
        progressBarClassName={BAR_COLOR[selected.trangThai]}
        metaRows={[
          { label: "Quy trình", value: workflowState?.workflowTen || "—" },
          { label: "Bước hiện tại", value: currentStepName || "—" },
          { label: "Giá trị", value: formatCurrencyDisplay(selected.giaTriStr) },
          { label: "Nguồn vốn", value: resolveGoiThauNguonVon(selectedDetail?.nguonVon) },
          { label: "Ngày tạo", value: selected.detail.ngayTao || "—" },
          {
            label: "Hạn xử lý",
            value: currentWorkflowSummary.currentDueDate || "—",
            valueClassName: selected.trangThai === "Trễ hạn" ? "text-red-500" : undefined,
          },
          {
            label: "Tình trạng tiến độ",
            value: progressStatus,
            valueClassName: selected.trangThai === "Trễ hạn" ? "text-red-500" : undefined,
          },
        ]}
        noteTagsLabel="ĐƠN VỊ THEO DÕI"
        noteTags={selected.theoDoi ?? []}
        alert={detailInfo.lyDoTreHan ? {
          title: "Lý do trễ hạn",
          description: detailInfo.lyDoTreHan,
          titleClassName: "text-red-600",
          descriptionClassName: "text-red-700",
        } : undefined}
        stepInfoRows={[
          { label: "Người xử lý", value: currentWorkflowSummary.currentProcessor },
          { label: "Ngày xử lý", value: currentWorkflowSummary.currentProcessDate },
          { label: "Người ký", value: currentWorkflowSummary.currentSigner },
          { label: "Ngày ký", value: currentWorkflowSummary.currentSignedDate },
          {
            label: "Kết quả",
            value: currentWorkflowSummary.currentResult,
          },
        ]}
        steps={displaySteps}
        stepsLoading={workflowLoading}
        stepsEmptyMessage="Chua co du lieu buoc quy trinh tu backend."
        onUpdateCurrentStep={canMutateGoiThau ? () => goToCurrentStep(selected) : undefined}
        canUpdateCurrentStep={canProcessWorkflowStep}
        currentStepActionTooltip={() => currentStepActionState.reason}
        onBranchStepClick={(branchStep) => goToStepResult(selected, branchStep.name, branchStep.backendId)}
        onBranchCurrentStepAction={canMutateGoiThau ? (branch) => {
          navigate(
            `/xu-ly-buoc/${selected.id}?step=${encodeURIComponent(branch.currentStep)}${branch.backendId ? `&stepId=${branch.backendId}` : ""}`,
          );
        } : undefined}
        onBranchSkip={canMutateGoiThau ? async (branch) => {
          const stepInstance = workflowState?.steps.find((s) => s.id === branch.backendId);
          if (!stepInstance?.id || !stepInstance.rowVersion) {
            toast.error("Khong tim thay thong tin buoc de bo qua.");
            return;
          }
          const goiThauId = parseGoiThauNumericId(selected.id);
          if (!goiThauId) {
            toast.error("ID goi thau khong hop le.");
            return;
          }
          try {
            const result = await processStep(goiThauId, {
              hanhDong: "SKIP",
              workflowStepInstanceId: stepInstance.id,
              rowVersion: stepInstance.rowVersion,
            });
            toast.success(result.message || "Da bo qua buoc.");
            const [state, steps] = await Promise.all([
              getWorkflowState(goiThauId),
              getWorkflowSteps(goiThauId),
            ]);
            setWorkflowState(state);
            setWorkflowSteps(steps);
            setWorkflowRefreshKey((k) => k + 1);
          } catch (error: any) {
            toast.error(error?.message || "Khong the bo qua buoc.");
          }
        } : undefined}
        actions={
          <div className="flex flex-col gap-2">
            {canMutateGoiThau && (
              <button
                onClick={() => goToCurrentStep(selected)}
                disabled={!currentStepActionState.enabled}
                title={currentStepActionState.reason}
                className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl py-2.5 transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
              >
                <i className="fa-solid fa-clipboard-list text-xs" />
                Xử lý bước hiện tại
              </button>
            )}
            <button
              onClick={() => openHistory(selected)}
              className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs" /> Lịch sử xử lý
            </button>
            {canMutateGoiThau &&
              selected.trangThai !== "Đã hủy" &&
              selected.trangThai !== "Hoàn thành" && (
                <button
                  onClick={() => setCancelTarget(selected)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl py-2.5 transition-colors"
                >
                  <i className="fa-solid fa-ban text-xs" /> Hủy gói thầu
                </button>
              )}
            {canMutateGoiThau && (
              <button
                onClick={() => setDeleteTarget(selected)}
                disabled={!canUserDeleteGoiThau(selected)}
                title={canUserDeleteGoiThau(selected) ? "Xoa goi thau" : "Chi co the xoa goi thau o trang thai Nhap"}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl py-2.5 transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
              >
                <i className="fa-solid fa-trash text-xs" /> Xóa gói thầu
              </button>
            )}
          </div>
        }
      />
    );
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh sách gói thầu
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            title="Tải lại"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i
              className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}
            />
          </button>
          {/* Mobile: toggle detail panel */}
          <button
            onClick={() => setDetailOpen((o) => !o)}
            title="Chi tiết gói thầu"
            className="2xl:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-sidebar-flip" />
          </button>
          {canMutateGoiThau && (
            <button
              onClick={() => navigate("/tao-goi-thau")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-plus text-xs" /> Tạo gói thầu
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 min-h-0 h-[calc(100vh-3.5rem)] overflow-hidden relative">
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* FILTER BAR */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã gói thầu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              )}
            </div>
            <SelectField
              value={filterHT || "__all"}
              onValueChange={(value) => setFilterHT(value === "__all" ? "" : value)}
              options={[
                { value: "__all", label: "Tất cả hình thức" },
                ...Array.from(new Set(data.map((r) => r.hinhThuc).filter(Boolean))).sort().map((ht) => ({ value: ht, label: ht })),
              ]}
              triggerClassName="h-[42px] min-w-[190px] bg-white"
            />
            <SelectField
              value={filterTT || "__all"}
              onValueChange={(value) => setFilterTT(value === "__all" ? "" : value)}
              options={[
                { value: "__all", label: "Tất cả trạng thái" },
                { value: "Đang xử lý", label: "Đang xử lý" },
                { value: "Hoàn thành", label: "Hoàn thành" },
                { value: "Trễ hạn", label: "Trễ hạn" },
                { value: "Chờ duyệt", label: "Chờ duyệt" },
                { value: "Đã hủy", label: "Đã hủy" },
                { value: "Nháp", label: "Nháp" },
              ]}
              triggerClassName="h-[42px] min-w-[180px] bg-white"
            />
          </div>

          {/* TABLE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400" />
                <p className="text-sm text-slate-600">
                  Không thể tải dữ liệu. Vui lòng thử lại.
                </p>
                <button
                  onClick={() => loadData()}
                  className="mt-1 h-8 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-right" /> Thử lại
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
                        onClick={() => toggleSort("id")}
                      >
                        Mã gói{" "}
                        <SortIcon active={sortCol === "id"} dir={sortDir} />
                      </th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("ten")}
                      >
                        Tên gói thầu{" "}
                        <SortIcon active={sortCol === "ten"} dir={sortDir} />
                      </th>
                      <th className="px-5 py-3 text-left min-w-[190px]">Hình thức</th>
                      <th
                        className="px-5 py-3 text-right cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
                        onClick={() => toggleSort("giaTriNum")}
                      >
                        Giá trị (VNĐ){" "}
                        <SortIcon
                          active={sortCol === "giaTriNum"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-left">Đơn vị</th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none min-w-[130px]"
                        onClick={() => toggleSort("trangThai")}
                      >
                        Trạng thái{" "}
                        <SortIcon
                          active={sortCol === "trangThai"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <i className="fa-solid fa-folder-open text-4xl text-slate-200" />
                            <p className="text-sm font-medium text-slate-500">
                              {search || filterHT || filterTT
                                ? "Không có gói thầu phù hợp với bộ lọc"
                                : "Chưa có gói thầu nào"}
                            </p>
                            {(search || filterHT || filterTT) && (
                              <button
                                onClick={() => {
                                  setSearch("");
                                  setFilterHT("");
                                  setFilterTT("");
                                }}
                                className="text-xs text-blue-600 hover:underline mt-1"
                              >
                                Xóa bộ lọc
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelected(row);
                            setDetailOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${row.trangThai === "Trễ hạn" ? "bg-red-50/30" : ""} ${selected?.id === row.id ? "bg-blue-50" : "hover:bg-slate-50"} ${row.trangThai === "Đã hủy" ? "opacity-50" : ""}`}
                        >
                          <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold whitespace-nowrap">
                            {row.id}
                          </td>
                          <td className="px-5 py-3 text-slate-800 max-w-[220px]">
                            <div className="line-clamp-2">{row.ten}</div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${HT_BADGE[row.hinhThuc] ?? "bg-slate-100 text-slate-600"}`}
                            >
                              {row.hinhThuc}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {row.giaTriStr}
                          </td>
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {row.donVi}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[row.trangThai]}`}
                            >
                              {row.trangThai}
                            </span>
                            <div className="mt-1 text-[11px] text-slate-400">
                              Tiến độ: <span className="font-semibold text-slate-600">{row.detail.buoc}</span>
                            </div>
                          </td>
                          <td
                            className="px-5 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              {canMutateGoiThau && (
                                <button
                                  title={
                                    canUserEditGoiThau(row)
                                      ? "Chỉnh sửa gói thầu"
                                      : canUserUpdateCurrentStep(row)
                                        ? "Cập nhật bước hiện tại"
                                        : "Không còn thao tác xử lý"
                                  }
                                  onClick={() => handlePrimaryAction(row)}
                                  disabled={!canUserEditGoiThau(row) && !canUserUpdateCurrentStep(row)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                                >
                                  <i className={`fa-solid ${canUserEditGoiThau(row) ? "fa-pen" : "fa-clipboard-list"} text-xs`} />
                                </button>
                              )}
                              {canMutateGoiThau &&
                                row.trangThai !== "Đã hủy" &&
                                row.trangThai !== "Hoàn thành" && (
                                  <button
                                    title="Hủy gói thầu"
                                    onClick={() => setCancelTarget(row)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                                  >
                                    <i className="fa-solid fa-ban text-xs" />
                                  </button>
                                )}
                              {canMutateGoiThau && (
                                <button
                                  title={canUserDeleteGoiThau(row) ? "Xóa" : "Chỉ có thể xóa gói thầu ở trạng thái Nháp"}
                                  onClick={() => setDeleteTarget(row)}
                                  disabled={!canUserDeleteGoiThau(row)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                                >
                                  <i className="fa-solid fa-trash text-xs" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && filtered.length > PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} /{" "}
                  {filtered.length} kết quả
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (n) =>
                        n === 1 || n === totalPages || Math.abs(n - page) <= 1,
                    )
                    .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1)
                        acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "…" ? (
                        <span
                          key={`e${i}`}
                          className="px-1 text-slate-400 text-xs"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* DETAIL PANEL — chỉ hiện desktop khi click gói thầu */}
        {selected.id && (
        <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden 2xl:block">
          <DetailPanel />
        </aside>
        )}

        {/* Drawer */}
        {detailOpen && (
          <div className="2xl:hidden fixed inset-0 z-[100] flex">
            <div
              className="flex-1 bg-black/30"
              onClick={() => setDetailOpen(false)}
            />
            <div className="w-[min(360px,calc(100vw-64px))] bg-white overflow-y-auto p-5 shadow-2xl">
              <button
                onClick={() => setDetailOpen(false)}
                className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                <i className="fa-solid fa-xmark" /> Đóng
              </button>
              <DetailPanel />
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm modals ── */}
      {cancelTarget && (
        <ConfirmModal
          title="Hủy gói thầu"
          message={`Bạn có chắc muốn hủy gói thầu "${cancelTarget.ten}"? Trạng thái sẽ chuyển sang "Đã hủy".`}
          confirmLabel="Xác nhận hủy"
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          danger
          title="Xóa gói thầu"
          message={`Bạn có chắc muốn xóa gói thầu "${deleteTarget.ten}" (${deleteTarget.id})? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {historyTarget && (
        <HistoryModal
          goiThau={historyTarget}
          entries={historyEntries}
          loading={historyLoading}
          onClose={() => {
            setHistoryTarget(null);
            setHistoryEntries([]);
          }}
        />
      )}
    </>
  );
}
