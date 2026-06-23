import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import { ThemKhoaPhongModal } from "./ThemKhoaPhongModal";
import { SuaKhoaPhongModal } from "./SuaKhoaPhongModal";
import type { Phong, TrangThai, PhongFormValues } from "./types";
import { getKhoaPhongs, createKhoaPhong, updateKhoaPhong, deleteKhoaPhong } from "@/services/adminApi";

/* ─── Badge maps ──────────────────────────────────────── */
const TRANG_THAI_BADGE: Record<string, string> = {
  "Đang hoạt động": "bg-emerald-100 text-emerald-700",
  "Ngưng hoạt động": "bg-red-100 text-red-600",
};

const PAGE_SIZE = 8;
type SortCol = "ten" | "ma";

/* ─── Confirm modal ───────────────────────────────────── */
type ConfirmProps = { title: string; message: string; confirmLabel: string; onConfirm: () => void; onClose: () => void; danger?: boolean };
function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose, danger = false }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
            <i className={`fa-solid fa-triangle-exclamation ${danger ? "text-red-500" : "text-amber-500"}`} />
          </div>
          <div><h3 className="font-bold text-slate-800 text-sm">{title}</h3><p className="text-sm text-slate-500 mt-1">{message}</p></div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
          <button onClick={onConfirm} className={`h-9 px-5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
  return dir === "asc" ? <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" /> : <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />;
}

export default function KhoaPhong() {
  const [data, setData] = useState<Phong[]>([]);
  const [selected, setSelected] = useState<Phong>(() => ({
    id: "", ten: "", ma: "", trangThai: "Đang hoạt động",
  }));
  const [search, setSearch] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Phong | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Phong | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await getKhoaPhongs();
      const mapped: Phong[] = items.map((k: any) => ({
        id: String(k.id), ten: k.tenKhoaPhong, ma: k.maKhoaPhong || "",
        trangThai: k.trangThaiHoatDong ? "Đang hoạt động" as TrangThai : "Ngưng hoạt động" as TrangThai,
      }));
      setData(mapped);
      if (mapped.length > 0) setSelected(mapped[0]);
    } catch (e: any) { setError(e?.message || "Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [search, filterTT, sortCol, sortDir]);

  const filtered = useMemo(() => {
    let list = data.filter((r) =>
      (r.ten.toLowerCase().includes(search.toLowerCase())) &&
      (filterTT === "" || r.trangThai === filterTT));
    if (sortCol) {
      list = [...list].sort((a, b) => {
        let cmp = sortCol === "ten" ? a.ten.localeCompare(b.ten, "vi") : a.ma.localeCompare(b.ma, "vi");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, filterTT, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  function handleAdd(values: PhongFormValues) {
    createKhoaPhong({ tenKhoaPhong: values.ten, maKhoaPhong: values.ma }).then(() => {
      loadData();
      toast.success(`Đã thêm "${values.ten}"`);
      setAddOpen(false);
    }).catch(() => toast.error("Không thể tạo khoa/phòng"));
  }

  function handleEdit(values: PhongFormValues) {
    const id = parseInt(values.ma) || 0;
    if (!id) { toast.error("Mã khoa/phòng không hợp lệ"); return; }
    updateKhoaPhong(id, { tenKhoaPhong: values.ten }).then(() => {
      loadData();
      toast.success(`Đã cập nhật "${values.ten}"`);
      setEditTarget(null);
    }).catch(() => toast.error("Không thể cập nhật"));
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const id = parseInt(deleteTarget.id) || 0;
    if (!id) { toast.error("Không thể xóa khoa/phòng này"); return; }
    deleteKhoaPhong(id).then(() => {
      loadData();
      toast.success(`Đã xóa "${deleteTarget.ten}"`);
      setDeleteTarget(null);
    }).catch(() => toast.error("Không thể xóa"));
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Khoa/Phòng</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => loadData()} title="Tải lại" className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <i className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <i className="fa-solid fa-plus text-xs" /> Thêm khoa/phòng
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {([{ label: "TỔNG", val: data.length, sub: "khoa/phòng", cls: "text-blue-600", icon: "fa-building" },
               { label: "ĐANG HOẠT ĐỘNG", val: data.filter((d) => d.trangThai === "Đang hoạt động").length, sub: "khoa/phòng", cls: "text-emerald-600", icon: "fa-circle-check" },
               { label: "NGƯNG HOẠT ĐỘNG", val: data.filter((d) => d.trangThai === "Ngưng hoạt động").length, sub: "khoa/phòng", cls: "text-amber-600", icon: "fa-eye-slash" },
            ] as const).map(({ label, val, sub, cls, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-lg"><i className={`fa-solid ${icon}`} /></div>
                <div><div className="text-[10px] font-bold text-slate-400 tracking-wide">{label}</div><div className={`text-2xl font-extrabold ${cls}`}>{val}</div><div className="text-xs text-slate-400">{sub}</div></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800 text-sm flex-1 min-w-0">Danh sách khoa/phòng</span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input type="text" placeholder="Tìm tên khoa/phòng..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xs" /></button>}
              </div>
              <SelectField value={filterTT || "__all"} onValueChange={(v) => setFilterTT(v === "__all" ? "" : v)}
                options={[{ value: "__all", label: "Tất cả trạng thái" }, { value: "Đang hoạt động", label: "Đang hoạt động" }, { value: "Ngưng hoạt động", label: "Ngưng hoạt động" }]}
                triggerClassName="h-10 min-w-[170px] bg-white" />
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" /><p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            )}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400" /><p className="text-sm text-slate-600">{error}</p>
                <button onClick={() => loadData()} className="mt-1 h-8 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg"><i className="fa-solid fa-rotate-right" /> Thử lại</button>
              </div>
            )}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left cursor-pointer" onClick={() => toggleSort("ma")}>Mã <SortIcon active={sortCol === "ma"} dir={sortDir} /></th>
                    <th className="px-5 py-3 text-left cursor-pointer" onClick={() => toggleSort("ten")}>Khoa/Phòng <SortIcon active={sortCol === "ten"} dir={sortDir} /></th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-center">Thao tác</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={4} className="py-20 text-center text-slate-400">Không có dữ liệu</td></tr>
                    ) : paginated.map((r) => (
                      <tr key={r.id} onClick={() => setSelected(r)}
                        className={`cursor-pointer transition-colors ${selected.id === r.id ? "bg-blue-50" : "hover:bg-slate-50"} ${r.trangThai === "Ngưng hoạt động" ? "opacity-60" : ""}`}>
                        <td className="px-5 py-3 font-mono text-xs font-bold text-blue-700">{r.ma || "—"}</td>
                        <td className="px-5 py-3 font-medium text-slate-800">{r.ten}</td>
                        <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TRANG_THAI_BADGE[r.trangThai]}`}>{r.trangThai}</span></td>
                        <td className="px-5 py-3"><div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button title="Sửa" onClick={() => setEditTarget(r)} className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50"><i className="fa-solid fa-pen text-xs" /></button>
                          <button title="Xóa" onClick={() => setDeleteTarget(r)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"><i className="fa-solid fa-trash text-xs" /></button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Hiển thị {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}</span>
                <div className="flex items-center gap-1">{Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{n}</button>
                ))}</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {addOpen && <ThemKhoaPhongModal
        existingIds={data.map((d) => d.id)}
        existingNames={data.map((d) => d.ten)}
        onSave={handleAdd} onClose={() => setAddOpen(false)} />}
      {editTarget && <SuaKhoaPhongModal
        existingIds={data.map((d) => d.id).filter((id) => id !== editTarget.id)}
        existingNames={data.map((d) => d.ten)}
        phong={editTarget}
        onSave={handleEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && (
        <ConfirmModal danger title="Xóa khoa/phòng" message={`Xóa "${deleteTarget.ten}"?`} confirmLabel="Xóa"
          onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
