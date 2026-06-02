type Props = {
  tenDanhMuc: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteModal({ tenDanhMuc, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[380px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-trash text-red-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Xác nhận xóa</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh mục{" "}
              <span className="font-semibold">"{tenDanhMuc}"</span>{" "}
              sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
          >
            Xóa danh mục
          </button>
        </div>
      </div>
    </div>
  );
}
