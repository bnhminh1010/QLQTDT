import { useEffect, useRef } from "react";
import type { DocumentPhase } from "@/services/fileApi";
import type {
  WorkflowDetailStep,
  WorkflowParallelBranchStep,
  WorkflowStepDocumentCounts,
  WorkflowDotState,
} from "./workflowDetailTypes";
import { normalizeWorkflowText, resolveWorkflowNoteLabel } from "./workflowDetailUtils";

type StepLike = WorkflowDetailStep | WorkflowParallelBranchStep;

type Props = {
  step: StepLike;
  processingText?: string;
  approvalText?: string;
  documentCounts?: WorkflowStepDocumentCounts;
  documentsLoading?: boolean;
  documentsPermissionDenied?: boolean;
  onViewDocuments?: (stepId: number, phase: DocumentPhase, step: StepLike) => void;
  onCurrentStepAction?: (step: StepLike) => void;
  canShowCurrentStepAction?: (step: StepLike) => boolean;
  currentStepActionLabel?: string;
  currentStepActionTooltip?: (step: StepLike) => string;
  onSecondaryAction?: (step: StepLike) => void;
  secondaryActionLabel?: string;
  secondaryActionTooltip?: (step: StepLike) => string;
  registerDetailsRef?: (element: HTMLDetailsElement | null) => void;
  registerSummaryRef?: (element: HTMLElement | null) => void;
  focusStepId?: number | null;
  variant?: "main" | "branch";
  className?: string;
};

function getStepInstanceId(step: StepLike) {
  return step.workflowStepInstanceId ?? step.backendId ?? null;
}

function Dot({ state }: { state: WorkflowDotState }) {
  const dotClassName =
    state === "done"
      ? "bg-emerald-500 text-white"
      : state === "warn"
        ? "bg-amber-500 text-white"
        : state === "skipped"
          ? "bg-slate-200 text-slate-600"
          : "bg-slate-200";

  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${dotClassName}`}>
      {state === "done" && <i className="fa-solid fa-check" />}
      {state === "warn" && <i className="fa-solid fa-triangle-exclamation" />}
      {state === "skipped" && <i className="fa-solid fa-minus" />}
    </div>
  );
}

function DocumentPhaseRow({
  label,
  count,
  onView,
}: {
  label: string;
  count: number;
  onView?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-slate-200">
      <div className="min-w-0">
        <div className="text-slate-500">{label}</div>
        <div className="text-[11px] font-semibold text-slate-700">{count} file</div>
      </div>
      {onView ? (
        <button
          type="button"
          onClick={onView}
          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
        >
          Xem
        </button>
      ) : (
        <span className="text-[11px] text-slate-300">0 file</span>
      )}
    </div>
  );
}

export default function WorkflowStepItem({
  step,
  processingText,
  approvalText,
  documentCounts,
  documentsLoading = false,
  documentsPermissionDenied = false,
  onViewDocuments,
  onCurrentStepAction,
  canShowCurrentStepAction,
  currentStepActionLabel = "Cập nhật",
  currentStepActionTooltip,
  onSecondaryAction,
  secondaryActionLabel = "Xem",
  secondaryActionTooltip,
  registerDetailsRef,
  registerSummaryRef,
  focusStepId,
  variant = "main",
  className = "",
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const stepId = getStepInstanceId(step);
  const isCurrentStep = Boolean(step.current ?? step.isCurrent);
  const shouldShowCurrentStepAction = isCurrentStep && onCurrentStepAction && (!canShowCurrentStepAction || canShowCurrentStepAction(step));
  const resolvedProcessingText = normalizeWorkflowText(
    processingText ?? (step.processingUnitName || step.processingRoleName || step.donVi),
  );
  const resolvedApprovalText = normalizeWorkflowText(
    approvalText ?? (step.approvalUnitName || step.approvalRoleName),
    "",
  );
  const processingDocs = documentCounts?.processing ?? 0;
  const approvalDocs = documentCounts?.approval ?? 0;
  const isSkippedStep = step.state === "skipped";
  const normalizedSlaText = normalizeWorkflowText(step.slaText, "");
  const resolvedResultText = isSkippedStep
    ? normalizeWorkflowText(step.ketQua ?? "Bỏ qua", "")
    : normalizeWorkflowText(step.ketQua);
  const progressStatusTone = isSkippedStep
    ? "text-slate-600"
    : normalizedSlaText.includes("Sắp")
        ? "text-amber-600"
        : normalizedSlaText.includes("Quá hạn")
          ? "text-red-600"
        : "text-emerald-600";

  useEffect(() => {
    if (focusStepId == null || stepId == null || focusStepId !== stepId || !detailsRef.current) {
      return;
    }

    detailsRef.current.open = true;
  }, [focusStepId, stepId]);

  function setDetailsRef(element: HTMLDetailsElement | null) {
    detailsRef.current = element;
    registerDetailsRef?.(element);
  }

  function setSummaryRef(element: HTMLElement | null) {
    registerSummaryRef?.(element);
  }

  const summaryClassName = [
    "flex items-start gap-2.5 rounded-xl cursor-pointer list-none",
    "[&::-webkit-details-marker]:hidden [&::marker]:hidden transition-colors",
    "p-1.5 -mx-1.5 hover:bg-slate-50",
    variant === "branch" ? "hover:bg-white/70" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <details ref={setDetailsRef} className={`group rounded-xl transition-all duration-300 ${className}`}>
      <summary ref={setSummaryRef} className={summaryClassName}>
        <Dot state={step.state} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {isCurrentStep && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                    BƯỚC HIỆN TẠI
                  </span>
                )}
                <div className="text-xs font-medium text-slate-800">{step.ten}</div>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Đơn vị/Vai trò xử lý: {" "}
                <span className="font-medium text-slate-500">{resolvedProcessingText}</span>
              </div>
              {resolvedApprovalText && (
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Đơn vị/Vai trò ký duyệt: {" "}
                  <span className="font-medium text-slate-500">{resolvedApprovalText}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onSecondaryAction && stepId != null && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSecondaryAction(step);
                  }}
                  title={secondaryActionTooltip?.(step) ?? secondaryActionLabel}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {secondaryActionLabel}
                </button>
              )}
              {shouldShowCurrentStepAction && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCurrentStepAction(step);
                  }}
                  title={currentStepActionTooltip?.(step) ?? "Cập nhật bước hiện tại"}
                  className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                >
                  {currentStepActionLabel}
                </button>
              )}
              <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform group-open:rotate-180" />
            </div>
          </div>
        </div>
      </summary>
      <div className="ml-[34px] mt-1.5 space-y-0.5 text-[11px] bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
        <div className="text-slate-600 grid gap-1.5">
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Người xử lý</span>
            <span className="font-semibold text-slate-700 text-right">{normalizeWorkflowText(step.nguoiXuLy)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Ngày xử lý</span>
            <span className="font-semibold text-slate-700 text-right">{normalizeWorkflowText(step.ngayXuLy)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Người ký duyệt</span>
            <span className="font-semibold text-slate-700 text-right">{normalizeWorkflowText(step.nguoiKy)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Ngày ký duyệt</span>
            <span className="font-semibold text-slate-700 text-right">{normalizeWorkflowText(step.ngayKy)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Kết quả</span>
            <span
              className={`font-semibold text-right ${
                resolvedResultText === "Bỏ qua"
                  ? "text-slate-600"
                  : step.ketQua === "Duyet" || step.ketQua === "Dong y"
                  ? "text-emerald-600"
                  : step.ketQua === "Khong duyet" || step.ketQua === "Tu choi"
                    ? "text-red-600"
                    : "text-slate-700"
              }`}
            >
              {resolvedResultText}
            </span>
          </div>
          {step.lyDoKhongDuyet && (
            <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600 text-[11px]">
              <span className="font-semibold">Lý do không duyệt:</span> {step.lyDoKhongDuyet}
            </div>
          )}
          {step.lyDoQuaHanXuLyHoSo && (
            <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600 text-[11px]">
              <span className="font-semibold">Lý do quá hạn xử lý:</span> {step.lyDoQuaHanXuLyHoSo}
            </div>
          )}
          {step.lyDoQuaHanKyDuyet && (
            <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600 text-[11px]">
              <span className="font-semibold">Lý do quá hạn ký duyệt:</span> {step.lyDoQuaHanKyDuyet}
            </div>
          )}
          {step.ghiChu && (
            <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-700 text-[11px]">
              <span className="font-semibold">{resolveWorkflowNoteLabel(step)}:</span> {step.ghiChu}
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-slate-400">Tình trạng tiến độ</span>
            <span className={`font-semibold text-right ${progressStatusTone}`}>
              {normalizeWorkflowText(step.slaText, "Đang theo dõi")}
            </span>
          </div>
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-wide text-slate-400">
            <span>TÀI LIỆU THEO GIAI ĐOẠN</span>
            {documentsLoading && <i className="fa-solid fa-circle-notch fa-spin text-slate-300" />}
          </div>
          {documentsPermissionDenied ? (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 border border-amber-200">
              Không có quyền xem tài liệu.
            </div>
          ) : (
            <>
              <DocumentPhaseRow
                label="Tài liệu xử lý"
                count={processingDocs}
                onView={stepId != null && onViewDocuments ? () => onViewDocuments(stepId, "Processing", step) : undefined}
              />
              <DocumentPhaseRow
                label="Tài liệu ký duyệt"
                count={approvalDocs}
                onView={stepId != null && onViewDocuments ? () => onViewDocuments(stepId, "Approval", step) : undefined}
              />
            </>
          )}
        </div>
      </div>
    </details>
  );
}
