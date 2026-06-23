/* ─── Confirm modal: rời trang khi dirty ──────────────────── */
export default function LeaveConfirmModal({
  open,
  onStay,
  onLeave,
}: {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-triangle-exclamation text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Bạn có dữ liệu chưa lưu</h3>
            <p className="text-sm text-slate-500 mt-1">
              Nếu rời trang bây giờ, các thay đổi chưa lưu sẽ bị mất.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onStay}
            className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            Ở lại
          </button>
          <button
            onClick={onLeave}
            className="h-9 px-5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl"
          >
            Rời trang
          </button>
        </div>
      </div>
    </div>
  );
}
