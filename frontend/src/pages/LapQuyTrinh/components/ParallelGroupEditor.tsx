import { SelectField } from "@/components/ui/select";
import type { ParallelGroupDraft, DieuKienHopNhatUI } from "../workflowDesignerTypes";
import type { WorkflowStepDraft } from "../workflowDesignerTypes";

interface Props {
  group: ParallelGroupDraft;
  idx: number;
  steps: WorkflowStepDraft[];
  inline?: boolean;
  onUpdateGroup: (g: ParallelGroupDraft) => void;
  onDeleteGroup: () => void;
  onAddBranch: () => void;
  onRemoveBranch: (branchId: string) => void;
  onAddStepToBranch: (branchId: string, afterStepId?: string) => void;
  onEditStep: (step: WorkflowStepDraft) => void;
  onDeleteStep: (step: WorkflowStepDraft) => void;
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ParallelGroupEditor({
  group,
  steps,
  inline = false,
  onUpdateGroup,
  onDeleteGroup,
  onAddBranch,
  onRemoveBranch,
  onAddStepToBranch,
  onEditStep,
  onDeleteStep,
}: Props) {
  const stepMap = new Map(steps.map((step) => [step.id, step] as const));

  // Only show main-flow steps that come AFTER the split step
  const splitStepIdx = steps.findIndex((s) => s.id === group.buocTachNhanhId);
  const mergeStepOptions = splitStepIdx >= 0
    ? steps
        .filter((s, i) => i > splitStepIdx && !s.nhanhId)
        .map((s) => ({ value: s.id, label: s.tenBuoc }))
    : [];

  const branchSteps = (stepIds: string[]) =>
    stepIds
      .map((stepId) => stepMap.get(stepId))
      .filter((step): step is WorkflowStepDraft => Boolean(step));

  return (
    <div className={inline ? "h-full border border-purple-100 rounded-xl bg-purple-50/40 p-3 space-y-3" : "ml-8 border-l-2 border-purple-300 pl-4 my-2 space-y-3"}>
      {/* Group header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-purple-700 flex items-center gap-1">
          <i className="fa-solid fa-code-branch text-purple-500" />
          Nhánh song song
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onDeleteGroup}
            className="h-6 w-6 flex items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
            title="Xóa nhánh song song"
          >
            <i className="fa-solid fa-trash text-[10px]" />
          </button>
          <button
            onClick={onAddBranch}
            className="h-6 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-600 text-[10px] font-semibold rounded-lg flex items-center gap-1"
          >
            <i className="fa-solid fa-plus" /> Thêm nhánh
          </button>
        </div>
      </div>

      {/* Branches */}
      {group.branches.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          Chưa có nhánh nào.
        </p>
      ) : (
        <div className={inline ? "grid grid-cols-1 md:grid-cols-2 gap-2" : "space-y-2"}>
          {group.branches.map((branch, bi) => {
            const branchStepsList = branchSteps(branch.stepIds);
            const hasStep = branchStepsList.length > 0;

            return (
              <div
                key={branch.id}
                className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    {branch.tenNhanh || `Nhánh ${bi + 1}`}
                  </span>
                  <button
                    onClick={() => onRemoveBranch(branch.id)}
                    className="w-5 h-5 flex items-center justify-center rounded text-red-400 hover:bg-red-50"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                </div>

                {/* Branch steps */}
                <div className="space-y-1">
                  {branchStepsList.map((s, si) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 text-xs text-slate-600 bg-white rounded-lg border border-slate-200 px-3 py-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {si + 1}
                        </span>
                        <span className="flex-1 truncate">{s.tenBuoc}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onAddStepToBranch(branch.id, s.id)}
                            className="w-6 h-6 flex items-center justify-center rounded text-blue-500 hover:bg-blue-50"
                            title="Thêm bước sau bước này"
                          >
                            <i className="fa-solid fa-plus text-[10px]" />
                          </button>
                          <button
                            onClick={() => onEditStep(s)}
                            className="w-6 h-6 flex items-center justify-center rounded text-emerald-500 hover:bg-emerald-50"
                            title="Sửa bước"
                          >
                            <i className="fa-solid fa-pen text-[10px]" />
                          </button>
                          <button
                            onClick={() => onDeleteStep(s)}
                            disabled={branchStepsList.length <= 1}
                            className="w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title={branchStepsList.length <= 1 ? "Nhánh phải có ít nhất 1 bước" : "Xóa bước"}
                          >
                            <i className="fa-solid fa-trash text-[10px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasStep ? (
                    <p className="text-[10px] text-slate-400 italic">
                      Mỗi nhánh phải có ít nhất 1 bước.
                    </p>
                  ) : (
                    <button
                      onClick={() => onAddStepToBranch(branch.id)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <i className="fa-solid fa-plus" /> Thêm bước
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Merge conditions */}
      {group.branches.length >= 2 && (
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Điều kiện hợp nhất
            </label>
            <div className="flex flex-col gap-1">
              {(["all", "any", "count"] as DieuKienHopNhatUI[]).map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`merge-${group.id}`}
                    value={v}
                    checked={group.dieuKienHopNhat === v}
                    onChange={() =>
                      onUpdateGroup({
                        ...group,
                        dieuKienHopNhat: v,
                      })
                    }
                  />
                  <span className="text-xs text-slate-700">
                    {v === "all"
                      ? "Đợi tất cả nhánh hoàn thành"
                      : v === "any"
                        ? "Chỉ cần một nhánh hoàn thành"
                        : v === "count"
                          ? "Theo số lượng hoàn thành"
                          : "Bỏ qua tất cả nhánh"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
              Bước sau khi hợp nhất <span className="text-red-500">*</span>
            </label>
            <SelectField
              value={group.buocSauHopNhatId || "__empty"}
              onValueChange={(value) =>
                onUpdateGroup({
                  ...group,
                  buocSauHopNhatId: value === "__empty" ? "" : value,
                })
              }
              options={[
                { value: "__empty", label: "-- Chọn bước --" },
                ...mergeStepOptions,
              ]}
              triggerClassName={inputCls}
            />
          </div>
        </div>
      )}
    </div>
  );
}
