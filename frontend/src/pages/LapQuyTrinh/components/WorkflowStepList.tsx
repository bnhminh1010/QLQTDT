import { useState, useRef, useEffect } from "react";
import type { WorkflowStepDraft, ParallelGroupDraft } from "../workflowDesignerTypes";
import WorkflowStepCard from "./WorkflowStepCard";
import ParallelGroupEditor from "./ParallelGroupEditor";

interface Props {
  steps: WorkflowStepDraft[];
  parallelGroups: ParallelGroupDraft[];
  orphanIds: Set<string>;
  startCount: number;
  endCount: number;
  onEdit: (step: WorkflowStepDraft) => void;
  onDelete: (step: WorkflowStepDraft) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onInsertAfter: (step: WorkflowStepDraft) => void;
  onCreateParallel: (step: WorkflowStepDraft) => void;
  onClone: (step: WorkflowStepDraft) => void;
  onAddFromLibrary: () => void;
  onAddNew: () => void;
  onUpdateGroup: (group: ParallelGroupDraft) => void;
  onAddBranch: (groupId: string) => void;
  onRemoveBranch: (groupId: string, branchId: string) => void;
  onAddStepToBranch: (branchId: string, afterStepId?: string) => void;
}

export default function WorkflowStepList({
  steps,
  parallelGroups,
  orphanIds,
  startCount,
  endCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onInsertAfter,
  onCreateParallel,
  onClone,
  onAddFromLibrary,
  onAddNew,
  onUpdateGroup,
  onAddBranch,
  onRemoveBranch,
  onAddStepToBranch,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-list-ol text-blue-500" />
          Các bước thực hiện
          {steps.length > 0 && (
            <span className="ml-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {steps.length} bước
            </span>
          )}
        </h2>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus" />
            <span>Thêm bước</span>
            <i className="fa-solid fa-chevron-down text-[10px] ml-0.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[200px]">
              <button
                onClick={() => { setMenuOpen(false); onAddFromLibrary(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <i className="fa-solid fa-book text-[10px] text-blue-500" />
                <span className="flex flex-col items-start">
                  <span>Từ thư viện bước</span>
                  <span className="text-[10px] text-slate-400 font-normal">Chọn bước từ danh sách mẫu</span>
                </span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onAddNew(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <i className="fa-solid fa-plus-circle text-[10px] text-emerald-500" />
                <span className="flex flex-col items-start">
                  <span>Tạo bước mới</span>
                  <span className="text-[10px] text-slate-400 font-normal">Nhập thông tin thủ công</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {steps.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <span
            className={`text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${startCount >= 1 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
          >
            <i className={`fa-solid ${startCount >= 1 ? "fa-check" : "fa-xmark"} text-[10px]`} />
            Bắt đầu: {startCount}
          </span>
          <span
            className={`text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${endCount >= 1 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
          >
            <i className={`fa-solid ${endCount >= 1 ? "fa-check" : "fa-xmark"} text-[10px]`} />
            Kết thúc: {endCount}
          </span>
        </div>
      )}

      {steps.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <i className="fa-regular fa-rectangle-list text-3xl mb-3 block" />
          <p className="text-sm">
            Chưa có bước nào. Nhấn <strong>Thêm bước</strong> để bắt đầu.
          </p>
          <p className="text-xs mt-1 text-slate-400">
            Quy trình cần ít nhất 1 bước Bắt đầu và 1 bước Kết thúc
          </p>
        </div>
      ) : (
        <ol className="space-y-2.5">
          {steps.map((s, idx) => {
            const isOrphan = orphanIds.has(s.id);
            const group = parallelGroups.find((g) => g.buocTachNhanhId === s.id);
            return (
              <li key={s.id} className="space-y-2">
                <WorkflowStepCard
                  step={s}
                  idx={idx}
                  isOrphan={isOrphan}
                  onEdit={() => onEdit(s)}
                  onMoveUp={() => onMoveUp(idx)}
                  onMoveDown={() => onMoveDown(idx)}
                  isFirst={idx === 0}
                  isLast={idx === steps.length - 1}
                  onInsertAfter={() => onInsertAfter(s)}
                  onCreateParallel={() => onCreateParallel(s)}
                  onClone={() => onClone(s)}
                  onDelete={() => onDelete(s)}
                />
                {group && (
                  <ParallelGroupEditor
                    group={group}
                    idx={idx}
                    steps={steps}
                    onUpdateGroup={(g) => onUpdateGroup(g)}
                    onAddBranch={() => onAddBranch(group.id)}
                    onRemoveBranch={(branchId) => onRemoveBranch(group.id, branchId)}
                    onAddStepToBranch={onAddStepToBranch}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
