import type { WorkflowStepDraft } from "../workflowDesignerTypes";
import StepActionMenu from "./StepActionMenu";

const LOAI_BADGE: Record<string, string> = {
  "Bắt đầu": "bg-emerald-100 text-emerald-700",
  "Kết thúc": "bg-red-100 text-red-600",
  "Thường": "bg-blue-100 text-blue-700",
  "Ký duyệt": "bg-purple-100 text-purple-700",
  "Đăng tải": "bg-cyan-100 text-cyan-700",
  "Đánh giá/kiểm tra": "bg-amber-100 text-amber-700",
  "Hợp đồng": "bg-indigo-100 text-indigo-700",
};

function stepBadgeColor(step: WorkflowStepDraft, idx: number): string {
  if (step.loaiBuoc === "Bắt đầu") return "bg-emerald-500";
  if (step.loaiBuoc === "Kết thúc") return "bg-red-500";
  const colors = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-cyan-600",
    "bg-amber-500",
    "bg-indigo-600",
  ];
  return colors[idx % colors.length];
}

interface Props {
  step: WorkflowStepDraft;
  idx: number;
  isOrphan: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onInsertAfter: () => void;
  onCreateParallel: () => void;
  onClone: () => void;
  onDelete: () => void;
  onSetStart?: () => void;
  onSetEnd?: () => void;
}

export default function WorkflowStepCard({
  step,
  idx,
  isOrphan,
  onEdit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onInsertAfter,
  onCreateParallel,
  onClone,
  onDelete,
  onSetStart,
  onSetEnd,
}: Props) {
  return (
    <div
      className={`h-fit flex items-start gap-3 border rounded-2xl px-4 py-3.5 shadow-sm ${
        isOrphan
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-slate-200"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${stepBadgeColor(step, idx)}`}
      >
        {idx + 1}
      </span>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {step.tenBuoc}
          </p>
          <span
            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${LOAI_BADGE[step.loaiBuoc] ?? "bg-slate-100 text-slate-600"}`}
          >
            {step.loaiBuoc}
          </span>
          {step.nhomGiaiDoan && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {step.nhomGiaiDoan}
            </span>
          )}
        </div>
        <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <i className="fa-solid fa-building text-slate-400" />
            {step.donViPhuTrach || "—"}
          </span>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <i className="fa-regular fa-clock text-slate-400" />
            {step.slaNgay} ngày
          </span>
          {step.vaiTroXuLy && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <i className="fa-solid fa-user text-slate-400" />
              {step.vaiTroXuLy}
            </span>
          )}
          {step.coKyDuyet && (
            <span className="text-[11px] text-purple-600 flex items-center gap-1">
              <i className="fa-solid fa-signature text-[10px]" />
              Ký duyệt
            </span>
          )}
          {isOrphan && (
            <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
              <i className="fa-solid fa-triangle-exclamation text-[10px]" />
              Bước mồ côi
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          title="Di chuyển lên"
          disabled={isFirst}
          onClick={onMoveUp}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fa-solid fa-chevron-up text-xs" />
        </button>
        <button
          type="button"
          title="Di chuyển xuống"
          disabled={isLast}
          onClick={onMoveDown}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fa-solid fa-chevron-down text-xs" />
        </button>
        <button
          type="button"
          title="Chỉnh sửa"
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          <i className="fa-solid fa-pen text-xs" />
        </button>
        <StepActionMenu
          onInsertAfter={onInsertAfter}
          onCreateParallel={onCreateParallel}
          onClone={onClone}
          onDelete={onDelete}
          onSetStart={onSetStart}
          onSetEnd={onSetEnd}
          loaiBuoc={step.loaiBuoc}
        />
      </div>
    </div>
  );
}
