import { SelectField } from "@/components/ui/select";
import type { ParallelGroupDraft, DieuKienHopNhatUI } from "../workflowDesignerTypes";
import type { WorkflowStepDraft } from "../workflowDesignerTypes";

interface Props {
  group: ParallelGroupDraft;
  idx: number;
  steps: WorkflowStepDraft[];
  onUpdateGroup: (g: ParallelGroupDraft) => void;
  onAddBranch: () => void;
  onRemoveBranch: (branchId: string) => void;
  onAddStepToBranch: (branchId: string) => void;
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function ParallelGroupEditor({
  group,
  steps,
  onUpdateGroup,
  onAddBranch,
  onRemoveBranch,
  onAddStepToBranch,
}: Props) {
  const stepOptions = steps
    .filter((s) => s.id !== group.buocTachNhanhId)
    .map((s) => ({ value: s.id, label: s.tenBuoc }));

  const branchSteps = (branchId: string) =>
    steps.filter((s) => s.nhanhId === branchId);

  return (
    <div className="ml-8 border-l-2 border-purple-300 pl-4 my-2 space-y-3">
      {/* Group header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-purple-700 flex items-center gap-1">
          <i className="fa-solid fa-code-branch text-purple-500" />
          Nhánh song song
        </p>
        <div className="flex items-center gap-2">
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
        <div className="space-y-2">
          {group.branches.map((branch, bi) => {
            const branchStepsList = branchSteps(branch.id);

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
                  {branchStepsList.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-slate-600">
                      <i className="fa-solid fa-arrow-right text-[10px] text-slate-300" />
                      {s.tenBuoc}
                    </div>
                  ))}
                  <button
                    onClick={() => onAddStepToBranch(branch.id)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <i className="fa-solid fa-plus" /> Thêm bước
                  </button>
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
                        : "Theo số lượng hoàn thành"}
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
                ...stepOptions,
              ]}
              triggerClassName={inputCls}
            />
          </div>
        </div>
      )}
    </div>
  );
}
