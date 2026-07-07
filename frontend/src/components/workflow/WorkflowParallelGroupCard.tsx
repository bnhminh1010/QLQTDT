import type { ReactNode } from "react";
import { DEFAULT_PARALLEL_GROUP_TITLE, normalizeParallelGroupTitle } from "@/constants/parallelGroup";
import type { WorkflowParallelBranch, WorkflowParallelInfo } from "./workflowDetailTypes";
import { normalizeWorkflowText, resolveSkippedBranchNoteLabel } from "./workflowDetailUtils";
import WorkflowStepItem from "./WorkflowStepItem";

type Props = {
  parallelInfo: WorkflowParallelInfo;
  focusStepId?: number | null;
  renderBranchStep?: (branch: WorkflowParallelBranch, branchStep: WorkflowParallelBranch["steps"][number]) => ReactNode;
  onBranchSkip?: (branch: WorkflowParallelBranch) => void;
};

type BranchCardProps = {
  branch: WorkflowParallelBranch;
  focusStepId?: number | null;
  renderBranchStep?: Props["renderBranchStep"];
  onBranchSkip?: Props["onBranchSkip"];
};

function getStepInstanceId(step: WorkflowParallelBranch["steps"][number]) {
  return step.workflowStepInstanceId ?? step.backendId ?? null;
}

function renderDefaultBranchStep(branchStep: WorkflowParallelBranch["steps"][number], focusStepId?: number | null) {
  const processingText = normalizeWorkflowText(
    branchStep.processingUnitName || branchStep.processingRoleName || branchStep.donVi,
  );
  const approvalText = normalizeWorkflowText(branchStep.approvalUnitName || branchStep.approvalRoleName, "");

  return (
    <WorkflowStepItem
      step={branchStep}
      processingText={processingText}
      approvalText={approvalText}
      focusStepId={focusStepId}
      variant="branch"
    />
  );
}

function BranchCard({ branch, focusStepId, renderBranchStep, onBranchSkip }: BranchCardProps) {
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

      <div className="mt-2 space-y-2">
        {branch.steps.map((branchStep) => {
          const branchStepId = getStepInstanceId(branchStep);
          return (
            <div key={branchStepId ?? branchStep.ten}>
              {renderBranchStep ? renderBranchStep(branch, branchStep) : renderDefaultBranchStep(branchStep, focusStepId)}
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

export default function WorkflowParallelGroupCard({
  parallelInfo,
  focusStepId,
  renderBranchStep,
  onBranchSkip,
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
            renderBranchStep={renderBranchStep}
            onBranchSkip={onBranchSkip}
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
