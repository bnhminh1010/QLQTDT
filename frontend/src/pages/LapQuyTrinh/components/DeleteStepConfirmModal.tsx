/* ─── Confirm modal: xóa bước ────────────────────────────── */
import type { WorkflowStepDraft } from "../workflowDesignerTypes";

export default function DeleteStepConfirmModal({
  target,
  onClose,
  onConfirm,
}: {
  target: WorkflowStepDraft | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-1">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Xóa bước này?</h3>
          <p className="text-xs text-slate-500">
            Bước <strong>"{target.tenBuoc}"</strong> sẽ bị xóa khỏi quy trình.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Xóa bước
          </button>
        </div>
      </div>
    </div>
  );
}
