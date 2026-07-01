import type {
  WorkflowParallelBranch,
  WorkflowParallelBranchStep,
  WorkflowParallelInfo,
} from "./workflowDetailTypes";
import { DEFAULT_PARALLEL_GROUP_TITLE, normalizeParallelGroupTitle } from "@/constants/parallelGroup";
import { normalizeWorkflowText } from "./workflowDetailUtils";

type Props = {
  parallelInfo: WorkflowParallelInfo;
  onBranchStepClick?: (step: WorkflowParallelBranchStep) => void;
  onBranchCurrentStepAction?: (branch: WorkflowParallelBranch) => void;
  onBranchSkip?: (branch: WorkflowParallelBranch) => void;
};

export default function ParallelGroupCard({
  parallelInfo,
  onBranchStepClick,
  onBranchCurrentStepAction,
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
        {parallelInfo.branches.map((branch) => {
          const hasCurrentStep = branch.steps.some((step) => step.state === "current");
          const statusClass = branch.status === "Đã hoàn thành"
            ? "text-emerald-700"
            : branch.status === "Đã bỏ qua"
              ? "text-slate-600"
              : "text-amber-700";
          return (
            <div key={branch.backendId ?? branch.name} className="rounded-lg border border-white bg-white/80 p-2">
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
                  <span className="font-semibold">Ghi chú / lý do thực tế:</span> {normalizeWorkflowText(branch.ghiChu, "")}
                </div>
              )}

              <details className="mt-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2 py-1">
                <summary className="cursor-pointer select-none text-[11px] font-semibold text-blue-700">
                  Các bước trong nhánh
                </summary>
                <div className="mt-2 space-y-2.5">
                  {branch.steps.map((branchStep) => (
                    <button
                      key={branchStep.backendId ?? branchStep.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBranchStepClick?.(branchStep);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] ${
                        onBranchStepClick ? "hover:bg-white" : "cursor-default"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          branchStep.state === "done"
                            ? "bg-emerald-500"
                            : branchStep.state === "current"
                              ? "bg-amber-500"
                              : branchStep.state === "skipped"
                                ? "bg-slate-400"
                                : "bg-slate-300"
                        }`}
                      />
                      <span className="flex-1 text-slate-700">
                        {normalizeWorkflowText(branchStep.name)}
                        {branchStep.state === "current" && (
                          <span className="font-semibold text-amber-700"> (Bước hiện tại)</span>
                        )}
                        {branchStep.ghiChu && (
                          <span className="mt-0.5 block text-[10px] text-amber-700">
                            Ghi chú: {normalizeWorkflowText(branchStep.ghiChu, "")}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </details>

              {hasCurrentStep && (onBranchCurrentStepAction || onBranchSkip) && (
                <div className="mt-2 flex gap-2">
                  {onBranchCurrentStepAction && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBranchCurrentStepAction(branch);
                      }}
                      className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700"
                    >
                      Cập nhật
                    </button>
                  )}
                  {onBranchSkip && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBranchSkip(branch);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      Bỏ qua
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
