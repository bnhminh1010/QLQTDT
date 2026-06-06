import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ThemKhoaPhongModal } from "./ThemKhoaPhongModal";
import { SuaKhoaPhongModal } from "./SuaKhoaPhongModal";
import type { Phong, LoaiPhong, TrangThai } from "./types";

/* ─── Badge maps ──────────────────────────────────────── */
const LOAI_BADGE: Record<LoaiPhong, string> = {
  "Khoa lâm sàng": "bg-blue-100 text-blue-700",
  "Khoa cận lâm sàng": "bg-purple-100 text-purple-700",
  "Phòng chức năng": "bg-slate-100 text-slate-600",
};
const TRANG_THAI_BADGE: Record<TrangThai, string> = {
  "Đang hoạt động": "bg-emerald-100 text-emerald-700",
  "Ngưng hoạt động": "bg-red-100 text-red-600",
};

/* ─── Mock data ───────────────────────────────────────── */
const INITIAL_DATA: Phong[] = [
  {
    id: "KN",
    ten: "Khoa Nội",
    loai: "Khoa lâm sàng",
    truongKhoa: "BS. Nguyễn Văn An",
    soNhanVien: 24,
    soGoiThau: 5,
    email: "khoanoi@bvungbuou.vn",
    sdt: "028 3812 1234",
    trangThai: "Đang hoạt động",
    donViCha: "",
    moTa: "Chuyên điều trị bệnh nội khoa",
  },
  {
    id: "KNG",
    ten: "Khoa Ngoại",
    loai: "Khoa lâm sàng",
    truongKhoa: "BS. Trần Thị Bình",
    soNhanVien: 18,
    soGoiThau: 3,
    email: "khoangoa@bvungbuou.vn",
    sdt: "028 3812 1235",
    trangThai: "Đang hoạt động",
    donViCha: "",
    moTa: "",
  },
  {
    id: "KD",
    ten: "Khoa Dược",
    loai: "Khoa cận lâm sàng",
    truongKhoa: "DS. Lê Văn Cường",
    soNhanVien: 12,
    soGoiThau: 8,
    email: "khoaduoc@bvungbuou.vn",
    sdt: "028 3812 1236",
    trangThai: "Đang hoạt động",
    donViCha: "",
    moTa: "",
  },
  {
    id: "KXN",
    ten: "Khoa Xét nghiệm",
    loai: "Khoa cận lâm sàng",
    truongKhoa: "BS. Phạm Thị Dung",
    soNhanVien: 15,
    soGoiThau: 2,
    email: "khoaxn@bvungbuou.vn",
    sdt: "028 3812 1237",
    trangThai: "Ngưng hoạt động",
    donViCha: "",
    moTa: "Tạm ngưng do cải tạo cơ sở vật chất",
  },
  {
    id: "PHCQT",
    ten: "P.Hành chính quản trị",
    loai: "Phòng chức năng",
    truongKhoa: "Ông Hoàng Văn Em",
    soNhanVien: 10,
    soGoiThau: 6,
    email: "phcqt@bvungbuou.vn",
    sdt: "028 3812 1238",
    trangThai: "Đang hoạt động",
    donViCha: "",
    moTa: "",
  },
  {
    id: "PKH",
    ten: "P.Kế hoạch",
    loai: "Phòng chức năng",
    truongKhoa: "Bà Ngô Thị Phương",
    soNhanVien: 8,
    soGoiThau: 4,
    email: "pkh@bvungbuou.vn",
    sdt: "028 3812 1239",
    trangThai: "Đang hoạt động",
    donViCha: "",
    moTa: "",
  },
];

const PAGE_SIZE = 8;
type SortCol = "ten" | "soNhanVien" | "soGoiThau";

/* ─── Confirm modal ───────────────────────────────────── */
type ConfirmProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
};
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  danger = false,
}: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}
          >
            <i
              className={`fa-solid fa-triangle-exclamation ${danger ? "text-red-500" : "text-amber-500"}`}
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`h-9 px-5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sort icon ───────────────────────────────────────── */
function SortIcon({
  col,
  active,
  dir,
}: {
  col: SortCol;
  active: boolean;
  dir: "asc" | "desc";
}) {
  if (!active)
    return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
  return dir === "asc" ? (
    <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
  ) : (
    <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function KhoaPhong() {
  const [data, setData] = useState<Phong[]>(INITIAL_DATA);
  const [selected, setSelected] = useState<Phong>(INITIAL_DATA[0]);
  const [search, setSearch] = useState("");
  const [filterLoai, setFilterLoai] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Phong | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Phong | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Phong | null>(null);

  // Loading / error mock
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const simulateLoad = useCallback(() => {
    setLoading(true);
    setError(false);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return simulateLoad();
  }, [simulateLoad]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterLoai, filterTrangThai, sortCol, sortDir]);

  /* ─ Derived list ─ */
  const filtered = useMemo(() => {
    let list = data.filter(
      (p) =>
        (p.ten.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase())) &&
        (filterLoai === "" || p.loai === filterLoai) &&
        (filterTrangThai === "" || p.trangThai === filterTrangThai),
    );
    if (sortCol) {
      list = [...list].sort((a, b) => {
        const av = a[sortCol];
        const bv = b[sortCol];
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), "vi");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, filterLoai, filterTrangThai, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ─ Sort handler ─ */
  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  /* ─ CRUD handlers ─ */
  function handleAdd(
    values: Parameters<
      typeof ThemKhoaPhongModal extends React.ComponentType<infer P> ? P : never
    >["onSave"] extends (v: infer V) => void
      ? V
      : never,
  ) {
    // use explicit type from imports
    const newPhong: Phong = {
      id: values.ma.trim().toUpperCase(),
      ten: values.ten.trim(),
      loai: values.loai,
      truongKhoa: values.truongKhoa.trim(),
      soNhanVien: values.soNhanVien,
      soGoiThau: 0,
      email: values.email.trim(),
      sdt: values.sdt.trim(),
      trangThai: values.trangThai,
      donViCha: values.donViCha.trim(),
      moTa: values.moTa.trim(),
    };
    setData((prev) => [...prev, newPhong]);
    setSelected(newPhong);
    toast.success(`Đã thêm "${newPhong.ten}"`);
    setAddOpen(false);
  }

  function handleEdit(
    values: Parameters<
      typeof SuaKhoaPhongModal extends React.ComponentType<infer P> ? P : never
    >["onSave"] extends (v: infer V) => void
      ? V
      : never,
  ) {
    if (!editTarget) return;
    const updated: Phong = {
      ...editTarget,
      id: values.ma.trim().toUpperCase(),
      ten: values.ten.trim(),
      loai: values.loai,
      truongKhoa: values.truongKhoa.trim(),
      soNhanVien: values.soNhanVien,
      email: values.email.trim(),
      sdt: values.sdt.trim(),
      trangThai: values.trangThai,
      donViCha: values.donViCha.trim(),
      moTa: values.moTa.trim(),
    };
    setData((prev) => prev.map((p) => (p.id === editTarget.id ? updated : p)));
    if (selected.id === editTarget.id) setSelected(updated);
    toast.success(`Đã cập nhật "${updated.ten}"`);
    setEditTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    if (selected.id === deleteTarget.id) {
      const remaining = data.filter((p) => p.id !== deleteTarget.id);
      if (remaining.length > 0) setSelected(remaining[0]);
    }
    toast.success(`Đã xóa "${deleteTarget.ten}"`);
    setDeleteTarget(null);
  }

  function handleToggle() {
    if (!toggleTarget) return;
    const next: TrangThai =
      toggleTarget.trangThai === "Đang hoạt động"
        ? "Ngưng hoạt động"
        : "Đang hoạt động";
    setData((prev) =>
      prev.map((p) =>
        p.id === toggleTarget.id ? { ...p, trangThai: next } : p,
      ),
    );
    if (selected.id === toggleTarget.id)
      setSelected({ ...selected, trangThai: next });
    toast.success(`"${toggleTarget.ten}" chuyển sang ${next}`);
    setToggleTarget(null);
  }

  const existingIds = data.map((p) => p.id.toUpperCase());

  /* ─ Render ─ */
  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Khoa / Phòng</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => simulateLoad()}
            title="Tải lại danh sách"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i
              className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus text-xs" /> Thêm khoa/phòng
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              [
                "fa-building",
                "blue",
                "TỔNG",
                data.length,
                "đơn vị",
                "text-blue-600",
              ],
              [
                "fa-stethoscope",
                "purple",
                "LÂM SÀNG",
                data.filter((d) => d.loai === "Khoa lâm sàng").length,
                "khoa",
                "text-purple-600",
              ],
              [
                "fa-flask",
                "indigo",
                "CẬN LÂM SÀNG",
                data.filter((d) => d.loai === "Khoa cận lâm sàng").length,
                "khoa",
                "text-indigo-600",
              ],
              [
                "fa-circle-check",
                "emerald",
                "ĐANG HOẠT ĐỘNG",
                data.filter((d) => d.trangThai === "Đang hoạt động").length,
                "đơn vị",
                "text-emerald-600",
              ],
            ].map(([icon, color, lbl, val, sub, valCls]) => (
              <div
                key={String(lbl)}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "blue" ? "bg-blue-100 text-blue-600" : color === "purple" ? "bg-purple-100 text-purple-600" : color === "indigo" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"}`}
                >
                  <i className={`fa-solid ${icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">
                    {lbl}
                  </div>
                  <div className={`text-2xl font-extrabold ${valCls}`}>
                    {val}
                  </div>
                  <div className="text-xs text-slate-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FILTER BAR + TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Filter bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800 text-sm flex-1 min-w-0">
                Danh sách khoa/phòng
              </span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm tên, mã..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                )}
              </div>
              <select
                value={filterLoai}
                onChange={(e) => setFilterLoai(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả loại</option>
                <option>Khoa lâm sàng</option>
                <option>Khoa cận lâm sàng</option>
                <option>Phòng chức năng</option>
              </select>
              <select
                value={filterTrangThai}
                onChange={(e) => setFilterTrangThai(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option>Đang hoạt động</option>
                <option>Ngưng hoạt động</option>
              </select>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400" />
                <p className="text-sm text-slate-600">
                  Không thể tải dữ liệu. Vui lòng thử lại.
                </p>
                <button
                  onClick={() => simulateLoad()}
                  className="mt-1 h-8 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-right" /> Thử lại
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("ten")}
                      >
                        Tên khoa/phòng
                        <SortIcon
                          col="ten"
                          active={sortCol === "ten"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-left">Loại</th>
                      <th className="px-5 py-3 text-left">Trưởng khoa/phòng</th>
                      <th
                        className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("soNhanVien")}
                      >
                        Nhân viên
                        <SortIcon
                          col="soNhanVien"
                          active={sortCol === "soNhanVien"}
                          dir={sortDir}
                        />
                      </th>
                      <th
                        className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("soGoiThau")}
                      >
                        Gói thầu
                        <SortIcon
                          col="soGoiThau"
                          active={sortCol === "soGoiThau"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-center">Trạng thái</th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <i className="fa-solid fa-building-circle-xmark text-4xl text-slate-200" />
                            <p className="text-sm font-medium text-slate-500">
                              {search || filterLoai || filterTrangThai
                                ? "Không tìm thấy khoa/phòng phù hợp với bộ lọc"
                                : "Chưa có khoa/phòng nào"}
                            </p>
                            {(search || filterLoai || filterTrangThai) && (
                              <button
                                onClick={() => {
                                  setSearch("");
                                  setFilterLoai("");
                                  setFilterTrangThai("");
                                }}
                                className="text-xs text-blue-600 hover:underline mt-1"
                              >
                                Xóa bộ lọc
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className={`cursor-pointer transition-colors ${selected.id === p.id ? "bg-blue-50" : "hover:bg-slate-50"} ${p.trangThai === "Ngưng hoạt động" ? "opacity-60" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                <i className="fa-solid fa-building text-slate-400 text-sm" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">
                                  {p.ten}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {p.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LOAI_BADGE[p.loai]}`}
                            >
                              {p.loai}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {p.truongKhoa}
                          </td>
                          <td className="px-5 py-3 text-center font-semibold text-slate-700">
                            {p.soNhanVien}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                              {p.soGoiThau}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TRANG_THAI_BADGE[p.trangThai]}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${p.trangThai === "Đang hoạt động" ? "bg-emerald-500" : "bg-red-400"}`}
                              />
                              {p.trangThai}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div
                              className="flex items-center justify-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                title="Chỉnh sửa"
                                onClick={() => setEditTarget(p)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                              >
                                <i className="fa-solid fa-pen text-xs" />
                              </button>
                              <button
                                title={
                                  p.trangThai === "Đang hoạt động"
                                    ? "Tắt hoạt động"
                                    : "Bật hoạt động"
                                }
                                onClick={() => setToggleTarget(p)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${p.trangThai === "Đang hoạt động" ? "text-slate-500 hover:bg-slate-100" : "text-emerald-500 hover:bg-emerald-50"}`}
                              >
                                <i
                                  className={`fa-solid text-xs ${p.trangThai === "Đang hoạt động" ? "fa-eye-slash" : "fa-eye"}`}
                                />
                              </button>
                              <button
                                title="Xóa"
                                onClick={() => setDeleteTarget(p)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                              >
                                <i className="fa-solid fa-trash text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && filtered.length > PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-xs text-slate-400">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} /{" "}
                  {filtered.length} kết quả
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (n) =>
                        n === 1 || n === totalPages || Math.abs(n - page) <= 1,
                    )
                    .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1)
                        acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "…" ? (
                        <span
                          key={`e${i}`}
                          className="px-1 text-slate-400 text-xs"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* DETAIL PANEL */}
        <aside className="w-[272px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${selected.trangThai === "Đang hoạt động" ? "bg-blue-100" : "bg-slate-100"}`}
          >
            <i
              className={`fa-solid fa-building text-xl ${selected.trangThai === "Đang hoạt động" ? "text-blue-600" : "text-slate-400"}`}
            />
          </div>
          <div className="text-sm font-bold text-slate-900 mb-0.5">
            {selected.ten}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LOAI_BADGE[selected.loai]}`}
            >
              {selected.loai}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TRANG_THAI_BADGE[selected.trangThai]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${selected.trangThai === "Đang hoạt động" ? "bg-emerald-500" : "bg-red-400"}`}
              />
              {selected.trangThai}
            </span>
          </div>

          <div className="space-y-2.5 mb-5">
            {[
              ["Mã", selected.id],
              ["Trưởng khoa/phòng", selected.truongKhoa],
              ["Email", selected.email || "—"],
              ["Điện thoại", selected.sdt || "—"],
              ["Đơn vị cha", selected.donViCha || "—"],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex flex-col text-xs gap-0.5">
                <span className="text-slate-400">{lbl}</span>
                <span className="text-slate-800 font-medium break-all">
                  {val}
                </span>
              </div>
            ))}
            {selected.moTa && (
              <div className="flex flex-col text-xs gap-0.5">
                <span className="text-slate-400">Mô tả</span>
                <span className="text-slate-600 leading-relaxed">
                  {selected.moTa}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              [
                "fa-users",
                "Nhân viên",
                selected.soNhanVien.toString(),
                "bg-slate-50",
              ],
              [
                "fa-box-archive",
                "Gói thầu",
                selected.soGoiThau.toString(),
                "bg-blue-50",
              ],
            ].map(([icon, lbl, val, bg]) => (
              <div key={lbl} className={`${bg} rounded-xl p-3 text-center`}>
                <i className={`fa-solid ${icon} text-slate-400 mb-1`} />
                <div className="text-xl font-extrabold text-slate-800">
                  {val}
                </div>
                <div className="text-[11px] text-slate-400">{lbl}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setEditTarget(selected)}
              className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl py-2.5 transition-colors"
            >
              <i className="fa-solid fa-pen text-xs" /> Chỉnh sửa
            </button>
            <button
              onClick={() => setToggleTarget(selected)}
              className={`w-full flex items-center justify-center gap-2 text-sm rounded-xl py-2.5 border transition-colors ${selected.trangThai === "Đang hoạt động" ? "text-slate-600 border-slate-200 hover:bg-slate-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
            >
              <i
                className={`fa-solid text-xs ${selected.trangThai === "Đang hoạt động" ? "fa-eye-slash" : "fa-eye"}`}
              />
              {selected.trangThai === "Đang hoạt động"
                ? "Tắt hoạt động"
                : "Bật hoạt động"}
            </button>
            <button
              onClick={() => setDeleteTarget(selected)}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl py-2.5 transition-colors"
            >
              <i className="fa-solid fa-trash text-xs" /> Xóa khoa/phòng
            </button>
          </div>
        </aside>
      </div>

      {/* ── Modals ── */}
      {addOpen && (
        <ThemKhoaPhongModal
          existingIds={existingIds}
          onSave={(values) => {
            const newPhong: Phong = {
              id: values.ma.trim().toUpperCase(),
              ten: values.ten.trim(),
              loai: values.loai,
              truongKhoa: values.truongKhoa.trim(),
              soNhanVien: values.soNhanVien,
              soGoiThau: 0,
              email: values.email.trim(),
              sdt: values.sdt.trim(),
              trangThai: values.trangThai,
              donViCha: values.donViCha.trim(),
              moTa: values.moTa.trim(),
            };
            setData((prev) => [...prev, newPhong]);
            setSelected(newPhong);
            toast.success(`Đã thêm "${newPhong.ten}"`);
            setAddOpen(false);
          }}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editTarget && (
        <SuaKhoaPhongModal
          phong={editTarget}
          existingIds={existingIds.filter(
            (id) => id !== editTarget.id.toUpperCase(),
          )}
          onSave={(values) => {
            const updated: Phong = {
              ...editTarget,
              id: values.ma.trim().toUpperCase(),
              ten: values.ten.trim(),
              loai: values.loai,
              truongKhoa: values.truongKhoa.trim(),
              soNhanVien: values.soNhanVien,
              email: values.email.trim(),
              sdt: values.sdt.trim(),
              trangThai: values.trangThai,
              donViCha: values.donViCha.trim(),
              moTa: values.moTa.trim(),
            };
            setData((prev) =>
              prev.map((p) => (p.id === editTarget.id ? updated : p)),
            );
            if (selected.id === editTarget.id) setSelected(updated);
            toast.success(`Đã cập nhật "${updated.ten}"`);
            setEditTarget(null);
          }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          danger
          title="Xóa khoa/phòng"
          message={`Bạn có chắc muốn xóa "${deleteTarget.ten}" (${deleteTarget.id})? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onConfirm={() => {
            setData((prev) => prev.filter((p) => p.id !== deleteTarget.id));
            if (selected.id === deleteTarget.id) {
              const remaining = data.filter((p) => p.id !== deleteTarget.id);
              if (remaining.length > 0) setSelected(remaining[0]);
            }
            toast.success(`Đã xóa "${deleteTarget.ten}"`);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {toggleTarget && (
        <ConfirmModal
          title={
            toggleTarget.trangThai === "Đang hoạt động"
              ? "Tắt hoạt động"
              : "Bật hoạt động"
          }
          message={
            toggleTarget.trangThai === "Đang hoạt động"
              ? `Bạn có chắc muốn tắt hoạt động "${toggleTarget.ten}"?`
              : `Bạn có chắc muốn kích hoạt lại "${toggleTarget.ten}"?`
          }
          confirmLabel={
            toggleTarget.trangThai === "Đang hoạt động"
              ? "Tắt hoạt động"
              : "Kích hoạt"
          }
          onConfirm={() => {
            const next: TrangThai =
              toggleTarget.trangThai === "Đang hoạt động"
                ? "Ngưng hoạt động"
                : "Đang hoạt động";
            setData((prev) =>
              prev.map((p) =>
                p.id === toggleTarget.id ? { ...p, trangThai: next } : p,
              ),
            );
            if (selected.id === toggleTarget.id)
              setSelected({ ...selected, trangThai: next });
            toast.success(`"${toggleTarget.ten}" chuyển sang ${next}`);
            setToggleTarget(null);
          }}
          onClose={() => setToggleTarget(null)}
        />
      )}
    </>
  );
}
