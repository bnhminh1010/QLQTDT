import type { WorkflowStepDraft, ParallelGroupDraft } from "../workflowDesignerTypes";

interface Props {
  steps: WorkflowStepDraft[];
  parallelGroups: ParallelGroupDraft[];
  orphanIds: Set<string>;
}

interface StepNode {
  idx: number;
  step: WorkflowStepDraft;
  isSplit: boolean;
  isMerge: boolean;
  group?: ParallelGroupDraft;
}

export default function WorkflowPreview({ steps, parallelGroups, orphanIds }: Props) {
  if (steps.length === 0) return null;

  const splitStepIds = new Set(parallelGroups.map((g) => g.buocTachNhanhId));
  const mergeStepIds = new Set(parallelGroups.map((g) => g.buocSauHopNhatId));

  // Build ordered node list from steps, injecting branch views between split/merge
  const nodes: StepNode[] = [];
  for (let idx = 0; idx < steps.length; idx++) {
    const step = steps[idx];
    const isSplit = splitStepIds.has(step.id);
    const isMerge = mergeStepIds.has(step.id);

    nodes.push({ idx, step, isSplit, isMerge, group: isSplit ? parallelGroups.find((g) => g.buocTachNhanhId === step.id) : undefined });

    // Right after a split, show branch inline
    if (isSplit) {
      const group = parallelGroups.find((g) => g.buocTachNhanhId === step.id);
      if (group && group.branches.length > 0) {
        // Insert a virtual branch-row node — rendered inline below
        nodes.push({
          idx: -1,
          step: { id: `_branch_row_${group.id}`, tenBuoc: "", loaiBuoc: "Thường", slaNgay: 0 } as WorkflowStepDraft,
          isSplit: false,
          isMerge: false,
          group,
        });
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {nodes.map((n) => {
        if (n.idx === -1 && n.group) {
          // Render branch row
          return (
            <div key={`branch-${n.group.id}`} className="flex items-center gap-1.5">
              <BranchView group={n.group} allSteps={steps} />
              {!mergeStepIds.has(n.group.buocSauHopNhatId) && (
                <i className="fa-solid fa-arrow-right text-slate-300 text-xs ml-1" />
              )}
            </div>
          );
        }

        const s = n.step;
        const isOrphan = orphanIds.has(s.id) && !n.isSplit;

        return (
          <div key={s.id} className="flex items-center gap-1.5">
            <div
              className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center min-w-[80px] ${
                s.loaiBuoc === "Bắt đầu"
                  ? "bg-emerald-50 border-emerald-300"
                  : s.loaiBuoc === "Kết thúc"
                    ? "bg-red-50 border-red-300"
                    : n.isSplit
                      ? "bg-amber-50 border-amber-300"
                      : n.isMerge
                        ? "bg-purple-50 border-purple-300"
                        : isOrphan
                          ? "bg-orange-50 border-orange-300"
                          : "bg-blue-50 border-blue-200"
              }`}
            >
              <span
                className={`text-[10px] font-bold mb-0.5 ${
                  s.loaiBuoc === "Bắt đầu"
                    ? "text-emerald-600"
                    : s.loaiBuoc === "Kết thúc"
                      ? "text-red-600"
                      : n.isSplit
                        ? "text-amber-600"
                        : n.isMerge
                          ? "text-purple-600"
                          : isOrphan
                            ? "text-orange-600"
                            : "text-blue-600"
                }`}
              >
                {n.idx + 1}
              </span>
              <span className="text-[11px] font-medium text-slate-700 break-words max-w-[80px] leading-tight">
                {s.tenBuoc}
              </span>
              {s.slaNgay > 0 && (
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {s.slaNgay}N
                </span>
              )}
            </div>
            {n.isSplit && (
              <i className="fa-solid fa-code-branch text-amber-400 text-xs" />
            )}
            {n.isMerge && !n.isSplit && idxNotLast(n.idx, nodes) && (
              <i className="fa-solid fa-code-merge text-purple-400 text-xs" />
            )}
            {!n.isSplit && !n.isMerge && idxNotLast(n.idx, nodes) && (
              <i className="fa-solid fa-arrow-right text-slate-300 text-xs" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function idxNotLast(idx: number, nodes: StepNode[]): boolean {
  // Check if there is a non-branch-row node after this idx
  for (let i = idx + 1; i < nodes.length; i++) {
    if (nodes[i].idx >= 0) return true;
  }
  return false;
}

/* ─── Branch inline renderer ─── */

function BranchView({ group, allSteps }: { group: ParallelGroupDraft; allSteps: WorkflowStepDraft[] }) {
  const mergeStep = allSteps.find((s) => s.id === group.buocSauHopNhatId);

  return (
    <div className="border border-purple-200 rounded-lg px-3 py-2 bg-purple-50/50 min-w-[140px]">
      <p className="text-[10px] font-bold text-purple-600 mb-1 flex items-center gap-1">
        <i className="fa-solid fa-code-branch text-[10px]" />
        Nhánh song song
      </p>
      <div className="space-y-0.5">
        {group.branches.map((b, bi) => {
          const branchStepNames = allSteps
            .filter((s) => s.nhanhId === b.id)
            .map((s) => s.tenBuoc)
            .join(" → ");
          return (
            <p key={b.id} className="text-[10px] text-slate-600 font-mono leading-relaxed">
              {bi === 0 ? "├─ " : bi === group.branches.length - 1 ? "└─ " : "├─ "}
              <span className="font-semibold">{b.tenNhanh}:</span>{" "}
              <span className="text-slate-500">{branchStepNames || "—"}</span>
            </p>
          );
        })}
      </div>
      {mergeStep && (
        <p className="text-[10px] text-purple-600 font-medium mt-1 pt-1 border-t border-purple-100">
          ⟶ Hợp nhất: {mergeStep.tenBuoc}
        </p>
      )}
    </div>
  );
}
