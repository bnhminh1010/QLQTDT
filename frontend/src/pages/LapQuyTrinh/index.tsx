import { useState } from "react";
import { toast } from "sonner";

/* ─── Types ──────────────────────────────────────────────────── */
type HinhThuc =
  | "Chỉ định thầu rút gọn"
  | "Chỉ định thầu tự quyết định"
  | "Chỉ định thầu thông thường"
  | "Chào hàng cạnh tranh"
  | "Đấu thầu rộng rãi";

type Buoc = {
  id: string;
  ten: string;
  donViPhuTrach: string;
  thoiHan: string;
  moTa: string;
};

/* ─── Constants ──────────────────────────────────────────────── */
const HINH_THUC_OPTIONS: HinhThuc[] = [
  "Chỉ định thầu rút gọn",
  "Chỉ định thầu tự quyết định",
  "Chỉ định thầu thông thường",
  "Chào hàng cạnh tranh",
  "Đấu thầu rộng rãi",
];

const HT_BADGE: Record<HinhThuc, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};

const DON_VI_OPTIONS = [
  "K/p mua sắm",
  "Tổ kiểm tra giá",
  "Giám đốc BV",
  "Phòng Kế hoạch",
  "Phòng Tài chính",
  "Phòng HCQT",
  "Hội đồng thầu",
  "Đơn vị khác",
];

const THOI_HAN_OPTIONS = [
  "1 ngày",
  "2 ngày",
  "3 ngày",
  "5 ngày",
  "7 ngày",
  "10 ngày",
  "14 ngày",
  "30 ngày",
];

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

/* ─── Empty step form ────────────────────────────────────────── */
const emptyBuoc = (): Omit<Buoc, "id"> => ({
  ten: "",
  donViPhuTrach: DON_VI_OPTIONS[0],
  thoiHan: THOI_HAN_OPTIONS[0],
  moTa: "",
});

/* ─── Component ─────────────────────────────────────────────── */
export default function LapQuyTrinh() {
  const [hinhThuc, setHinhThuc] = useState<HinhThuc | "">("");
  const [tenQuyTrinh, setTenQuyTrinh] = useState("");
  const [buocList, setBuocList] = useState<Buoc[]>([]);

  /* Add-step modal */
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptyBuoc());
  const [addErr, setAddErr] = useState("");

  /* Edit-step modal */
  const [editTarget, setEditTarget] = useState<Buoc | null>(null);
  const [editForm, setEditForm] = useState(emptyBuoc());
  const [editErr, setEditErr] = useState("");

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<Buoc | null>(null);

  /* ── Helpers ── */
  function openAdd() {
    setAddForm(emptyBuoc());
    setAddErr("");
    setAddOpen(true);
  }

  function saveAdd() {
    if (!addForm.ten.trim()) { setAddErr("Vui lòng nhập tên bước"); return; }
    const newBuoc: Buoc = { ...addForm, id: Date.now().toString() };
    setBuocList((prev) => [...prev, newBuoc]);
    setAddOpen(false);
    toast.success("Đã thêm bước");
  }

  function openEdit(b: Buoc) {
    setEditTarget(b);
    setEditForm({ ten: b.ten, donViPhuTrach: b.donViPhuTrach, thoiHan: b.thoiHan, moTa: b.moTa });
    setEditErr("");
  }

  function saveEdit() {
    if (!editForm.ten.trim()) { setEditErr("Vui lòng nhập tên bước"); return; }
    setBuocList((prev) =>
      prev.map((b) => (b.id === editTarget!.id ? { ...editTarget!, ...editForm } : b)),
    );
    setEditTarget(null);
    toast.success("Đã cập nhật bước");
  }

  function doDelete() {
    setBuocList((prev) => prev.filter((b) => b.id !== deleteTarget!.id));
    setDeleteTarget(null);
    toast.success("Đã xóa bước");
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setBuocList((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    if (idx === buocList.length - 1) return;
    setBuocList((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function handleSave() {
    if (!hinhThuc) { toast.error("Vui lòng chọn hình thức đấu thầu"); return; }
    if (!tenQuyTrinh.trim()) { toast.error("Vui lòng nhập tên quy trình"); return; }
    if (buocList.length === 0) { toast.error("Vui lòng thêm ít nhất 1 bước"); return; }
    toast.success("Quy trình đã được lưu thành công");
  }

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <i className="fa-solid fa-diagram-project text-slate-400" />
          <span className="text-slate-800 font-semibold">Lập quy trình</span>
        </div>
        <button
          onClick={handleSave}
          className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
        >
          <i className="fa-solid fa-floppy-disk text-xs" />
          Lưu quy trình
        </button>
      </header>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* THÔNG TIN CHUNG */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-blue-500" />
            Thông tin quy trình
          </h2>

          <div>
            <label className={labelCls}>Tên quy trình</label>
            <input
              className={inputCls}
              placeholder="Ví dụ: Quy trình mua sắm vật tư y tế 2025"
              value={tenQuyTrinh}
              onChange={(e) => setTenQuyTrinh(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Hình thức đấu thầu áp dụng</label>
            <select
              className={inputCls}
              value={hinhThuc}
              onChange={(e) => setHinhThuc(e.target.value as HinhThuc)}
            >
              <option value="">-- Chọn hình thức --</option>
              {HINH_THUC_OPTIONS.map((ht) => (
                <option key={ht} value={ht}>{ht}</option>
              ))}
            </select>
          </div>

          {hinhThuc && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${HT_BADGE[hinhThuc]}`}>
              {hinhThuc}
            </span>
          )}
        </section>

        {/* DANH SÁCH BƯỚC */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-list-ol text-blue-500" />
              Các bước thực hiện
              {buocList.length > 0 && (
                <span className="ml-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {buocList.length} bước
                </span>
              )}
            </h2>
            <button
              onClick={openAdd}
              className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-plus" />
              Thêm bước
            </button>
          </div>

          {buocList.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <i className="fa-regular fa-rectangle-list text-3xl mb-3 block" />
              <p className="text-sm">Chưa có bước nào. Nhấn <strong>Thêm bước</strong> để bắt đầu.</p>
            </div>
          ) : (
            <ol className="space-y-2.5">
              {buocList.map((b, idx) => (
                <li
                  key={b.id}
                  className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                >
                  {/* Số thứ tự */}
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  {/* Nội dung */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.ten}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <i className="fa-solid fa-building text-slate-400" />
                        {b.donViPhuTrach}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <i className="fa-regular fa-clock text-slate-400" />
                        {b.thoiHan}
                      </span>
                      {b.moTa && (
                        <span className="text-[11px] text-slate-400 italic truncate max-w-[200px]">
                          {b.moTa}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Di chuyển lên"
                      disabled={idx === 0}
                      onClick={() => moveUp(idx)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fa-solid fa-chevron-up text-xs" />
                    </button>
                    <button
                      type="button"
                      title="Di chuyển xuống"
                      disabled={idx === buocList.length - 1}
                      onClick={() => moveDown(idx)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <i className="fa-solid fa-chevron-down text-xs" />
                    </button>
                    <button
                      type="button"
                      title="Chỉnh sửa"
                      onClick={() => openEdit(b)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <i className="fa-solid fa-pen text-xs" />
                    </button>
                    <button
                      type="button"
                      title="Xóa"
                      onClick={() => setDeleteTarget(b)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* ── MODAL THÊM BƯỚC ────────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Thêm bước mới</h3>
              <button onClick={() => setAddOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Tên bước <span className="text-red-500">*</span></label>
                <input
                  className={`${inputCls} ${addErr ? "border-red-400 bg-red-50" : ""}`}
                  placeholder="Ví dụ: Đề xuất mua sắm"
                  value={addForm.ten}
                  onChange={(e) => { setAddForm((f) => ({ ...f, ten: e.target.value })); setAddErr(""); }}
                />
                {addErr && <p className="text-xs text-red-500 mt-1">{addErr}</p>}
              </div>

              <div>
                <label className={labelCls}>Đơn vị phụ trách</label>
                <select className={inputCls} value={addForm.donViPhuTrach} onChange={(e) => setAddForm((f) => ({ ...f, donViPhuTrach: e.target.value }))}>
                  {DON_VI_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Thời hạn thực hiện</label>
                <select className={inputCls} value={addForm.thoiHan} onChange={(e) => setAddForm((f) => ({ ...f, thoiHan: e.target.value }))}>
                  {THOI_HAN_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Mô tả (tuỳ chọn)</label>
                <textarea
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Ghi chú thêm về bước này..."
                  value={addForm.moTa}
                  onChange={(e) => setAddForm((f) => ({ ...f, moTa: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setAddOpen(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button onClick={saveAdd} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Thêm bước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CHỈNH SỬA BƯỚC ───────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Chỉnh sửa bước</h3>
              <button onClick={() => setEditTarget(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Tên bước <span className="text-red-500">*</span></label>
                <input
                  className={`${inputCls} ${editErr ? "border-red-400 bg-red-50" : ""}`}
                  value={editForm.ten}
                  onChange={(e) => { setEditForm((f) => ({ ...f, ten: e.target.value })); setEditErr(""); }}
                />
                {editErr && <p className="text-xs text-red-500 mt-1">{editErr}</p>}
              </div>

              <div>
                <label className={labelCls}>Đơn vị phụ trách</label>
                <select className={inputCls} value={editForm.donViPhuTrach} onChange={(e) => setEditForm((f) => ({ ...f, donViPhuTrach: e.target.value }))}>
                  {DON_VI_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Thời hạn thực hiện</label>
                <select className={inputCls} value={editForm.thoiHan} onChange={(e) => setEditForm((f) => ({ ...f, thoiHan: e.target.value }))}>
                  {THOI_HAN_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Mô tả (tuỳ chọn)</label>
                <textarea
                  rows={2}
                  className={`${inputCls} resize-none`}
                  value={editForm.moTa}
                  onChange={(e) => setEditForm((f) => ({ ...f, moTa: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditTarget(null)} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button onClick={saveEdit} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA ─────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-1">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Xóa bước này?</h3>
              <p className="text-xs text-slate-500">
                Bước <strong>"{deleteTarget.ten}"</strong> sẽ bị xóa vĩnh viễn khỏi quy trình.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="h-9 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button onClick={doDelete} className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">
                Xóa bước
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
