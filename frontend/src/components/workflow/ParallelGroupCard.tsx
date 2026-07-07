import type { ReactNode } from "react";
import type {
  WorkflowParallelBranch,
  WorkflowParallelBranchStep,
  WorkflowParallelInfo,
} from "./workflowDetailTypes";
import { DEFAULT_PARALLEL_GROUP_TITLE, normalizeParallelGroupTitle } from "@/constants/parallelGroup";
import { normalizeWorkflowText, resolveSkippedBranchNoteLabel } from "./workflowDetailUtils";
import WorkflowStepItem from "./WorkflowStepItem";

type Props = {
  parallelInfo: WorkflowParallelInfo;
  onBranchStepClick?: (step: WorkflowParallelBranchStep) => void;
  onBranchCurrentStepAction?: (branch: WorkflowParallelBranch) => void;
  onBranchSkip?: (branch: WorkflowParallelBranch) => void;
  focusStepId?: number | null;
  registerStepRef?: (stepId: number) => (element: HTMLElement | null) => void;
  renderBranchStep?: (branch: WorkflowParallelBranch, branchStep: WorkflowParallelBranchStep) => ReactNode;
};

function getStepInstanceId(step: WorkflowParallelBranchStep) {
  return step.workflowStepInstanceId ?? step.backendId ?? null;
}

function renderDefaultBranchStep(
  branch: WorkflowParallelBranch,
  branchStep: WorkflowParallelBranchStep,
  focusStepId?: number | null,
  onBranchStepClick?: (step: WorkflowParallelBranchStep) => void,
  onBranchCurrentStepAction?: (branch: WorkflowParallelBranch) => void,
  registerStepRef?: (stepId: number) => (element: HTMLElement | null) => void,
) {
  const stepId = getStepInstanceId(branchStep);
  const processingText = normalizeWorkflowText(
    branchStep.processingUnitName || branchStep.processingRoleName || branchStep.donVi,
  );
  const approvalText = normalizeWorkflowText(branchStep.approvalUnitName || branchStep.approvalRoleName, "");

  return (
    <WorkflowStepItem
      step={branchStep}
      processingText={processingText}
      approvalText={approvalText}
      onSecondaryAction={onBranchStepClick ? () => onBranchStepClick(branchStep) : undefined}
      secondaryActionLabel="Xem"
      secondaryActionTooltip={() => "Xem chi tiết bước"}
      onCurrentStepAction={onBranchCurrentStepAction ? () => onBranchCurrentStepAction(branch) : undefined}
      currentStepActionLabel="Cập nhật"
      currentStepActionTooltip={onBranchCurrentStepAction ? () => "Cập nhật bước hiện tại" : undefined}
      registerSummaryRef={stepId != null ? registerStepRef?.(stepId) : undefined}
      focusStepId={focusStepId}
      variant="branch"
    />
  );
}

type BranchCardProps = {
  branch: WorkflowParallelBranch;
  focusStepId?: number | null;
  onBranchStepClick?: Props["onBranchStepClick"];
  onBranchCurrentStepAction?: Props["onBranchCurrentStepAction"];
  onBranchSkip?: Props["onBranchSkip"];
  registerStepRef?: Props["registerStepRef"];
  renderBranchStep?: Props["renderBranchStep"];
};

function BranchCard({
  branch,
  focusStepId,
  onBranchStepClick,
  onBranchCurrentStepAction,
  onBranchSkip,
  registerStepRef,
  renderBranchStep,
}: BranchCardProps) {
  const statusClass = branch.status === "Đã hoàn thành"
    ? "text-emerald-700"
    : branch.status === "Đã bỏ qua"
      ? "text-slate-600"
      : "text-amber-700";
  const canSkipBranch = Boolean(onBranchSkip && branch.canSkipBranch);

  return (
    <div className="rounded-lg border border-white bg-white/80 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-slate-800">{normalizeWorkflowText(branch.name)}</span>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          {branch.progress} bước
        </span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        Bước hiện tại: <span className="font-semibold text-slate-700">{normalizeWorkflowText(branch.currentStep)}</span>
      </div>
      <div className="text-[11px] text-slate-500">
        Người xử lý: <span className="font-semibold text-slate-700">{normalizeWorkflowText(branch.processor)}</span>
      </div>
      <div className={`mt-1 text-[11px] font-semibold ${statusClass}`}>{branch.status}</div>
      {branch.ghiChu && (
        <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
          <span className="font-semibold">{resolveSkippedBranchNoteLabel(branch.ghiChuNguon, branch.ghiChu)}:</span> {normalizeWorkflowText(branch.ghiChu, "")}
        </div>
      )}

      <div className="mt-2 space-y-2.5">
        {branch.steps.map((branchStep) => {
          const branchStepId = getStepInstanceId(branchStep);
          return (
            <div key={branchStepId ?? branchStep.ten}>
              {renderBranchStep
                ? renderBranchStep(branch, branchStep)
                : renderDefaultBranchStep(
                    branch,
                    branchStep,
                    focusStepId,
                    onBranchStepClick,
                    onBranchCurrentStepAction,
                    registerStepRef,
                  )}
            </div>
          );
        })}
      </div>

      {canSkipBranch && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBranchSkip?.(branch);
            }}
            className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
          >
            Bỏ qua nhánh
          </button>
        </div>
      )}
    </div>
  );
}

export default function ParallelGroupCard({
  parallelInfo,
  onBranchStepClick,
  onBranchCurrentStepAction,
  onBranchSkip,
  focusStepId,
  registerStepRef,
  renderBranchStep,
}: Props) {
  const title = normalizeParallelGroupTitle(parallelInfo.title);

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs">
      <div className="mb-2 flex items-center gap-2 font-bold text-blue-700">
        <i className="fa-solid fa-code-branch text-[11px]" />
        {title || DEFAULT_PARALLEL_GROUP_TITLE}
      </div>

      <div className="mb-3 rounded-lg bg-white/80 px-3 py-2 text-[11px] text-slate-600">
        <div className="mb-1 font-semibold text-slate-700">Điều kiện hợp nhất</div>
        <div className="leading-relaxed">{normalizeWorkflowText(parallelInfo.condition)}</div>
      </div>

      <div className="space-y-2">
        {parallelInfo.branches.map((branch) => (
          <BranchCard
            key={branch.backendId ?? branch.name}
            branch={branch}
            focusStepId={focusStepId}
            onBranchStepClick={onBranchStepClick}
            onBranchCurrentStepAction={onBranchCurrentStepAction}
            onBranchSkip={onBranchSkip}
            registerStepRef={registerStepRef}
            renderBranchStep={renderBranchStep}
          />
        ))}
      </div>

      <div className="mt-3 rounded-lg bg-amber-50 px-2 py-2 text-[11px] font-semibold text-amber-700">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-500">
          Bước sau hợp nhất
        </div>
        {normalizeWorkflowText(parallelInfo.mergeStatus)}
      </div>
      <div className="mt-2 rounded-lg bg-slate-100 px-2 py-2 text-[11px] font-semibold text-slate-600">
        {normalizeWorkflowText(parallelInfo.lockedStage)}
      </div>
    </div>
  );
}
