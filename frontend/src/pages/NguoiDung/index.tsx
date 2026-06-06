import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ThemNguoiDungModal } from "./ThemNguoiDungModal";
import { SuaNguoiDungModal } from "./SuaNguoiDungModal";
import type {
  User,
  VaiTro,
  TrangThai,
  UserAddFormValues,
  UserEditFormValues,
} from "./types";

/* ─── Badge maps ──────────────────────────────────────── */
const VAI_TRO_BADGE: Record<VaiTro, string> = {
  Admin: "bg-red-100 text-red-700",
  "Quản lý": "bg-purple-100 text-purple-700",
  "Nhân viên": "bg-slate-100 text-slate-600",
};

const TT_BADGE: Record<TrangThai, string> = {
  "Hoạt động": "bg-emerald-100 text-emerald-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Bị khóa": "bg-red-100 text-red-600",
  "Ngưng hoạt động": "bg-slate-100 text-slate-500",
};

const TT_DOT: Record<TrangThai, string> = {
  "Hoạt động": "bg-emerald-500",
  "Chờ duyệt": "bg-amber-400",
  "Bị khóa": "bg-red-500",
  "Ngưng hoạt động": "bg-slate-400",
};

/* ─── Mock data ───────────────────────────────────────── */
const INITIAL_DATA: User[] = [
  {
    id: "U001",
    hoTen: "Nguyễn Văn Admin",
    username: "admin",
    email: "admin@bvungbuou.vn",
    sdt: "0901234567",
    phong: "Ban Giám đốc",
    vaiTro: "Admin",
    trangThai: "Hoạt động",
    ngayTao: "01/01/2025",
  },
  {
    id: "U002",
    hoTen: "Trần Thị Bình",
    username: "ttbinh",
    email: "ttbinh@bvungbuou.vn",
    sdt: "0912345678",
    phong: "P.Kế hoạch",
    vaiTro: "Quản lý",
    trangThai: "Hoạt động",
    ngayTao: "05/01/2025",
  },
  {
    id: "U003",
    hoTen: "Lê Văn Cường",
    username: "lvcuong",
    email: "lvcuong@bvungbuou.vn",
    sdt: "0923456789",
    phong: "Khoa Dược",
    vaiTro: "Nhân viên",
    trangThai: "Hoạt động",
    ngayTao: "10/01/2025",
  },
  {
    id: "U004",
    hoTen: "Phạm Thị Dung",
    username: "ptdung",
    email: "ptdung@bvungbuou.vn",
    sdt: "0934567890",
    phong: "Khoa Xét nghiệm",
    vaiTro: "Nhân viên",
    trangThai: "Chờ duyệt",
    ngayTao: "15/02/2025",
  },
  {
    id: "U005",
    hoTen: "Hoàng Văn Em",
    username: "hvem",
    email: "hvem@bvungbuou.vn",
    sdt: "0945678901",
    phong: "P.HCQT",
    vaiTro: "Quản lý",
    trangThai: "Hoạt động",
    ngayTao: "20/02/2025",
  },
  {
    id: "U006",
    hoTen: "Ngô Thị Phương",
    username: "ntphuong",
    email: "ntphuong@bvungbuou.vn",
    sdt: "0956789012",
    phong: "Khoa Nội",
    vaiTro: "Nhân viên",
    trangThai: "Bị khóa",
    ngayTao: "01/03/2025",
  },
  {
    id: "U007",
    hoTen: "Đinh Quang Huy",
    username: "dqhuy",
    email: "dqhuy@bvungbuou.vn",
    sdt: "0967890123",
    phong: "Khoa Ngoại",
    vaiTro: "Nhân viên",
    trangThai: "Chờ duyệt",
    ngayTao: "10/03/2025",
  },
  {
    id: "U008",
    hoTen: "Vũ Thị Lan",
    username: "vtlan",
    email: "vtlan@bvungbuou.vn",
    sdt: "0978901234",
    phong: "Khoa Dược",
    vaiTro: "Nhân viên",
    trangThai: "Ngưng hoạt động",
    ngayTao: "15/03/2025",
  },
];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-indigo-500",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1][0]?.toUpperCase() ?? "?";
}

function parseDate(s: string): number {
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d).getTime();
}

const PAGE_SIZE = 8;
type SortCol = "hoTen" | "phong" | "vaiTro" | "trangThai" | "ngayTao";

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
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active)
    return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
  return dir === "asc" ? (
    <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
  ) : (
    <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function NguoiDung() {
  const [data, setData] = useState<User[]>(INITIAL_DATA);
  const [selected, setSelected] = useState<User>(INITIAL_DATA[0]);
  const [search, setSearch] = useState("");
  const [filterVaiTro, setFilterVaiTro] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Loading / error mock
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [lockTarget, setLockTarget] = useState<User | null>(null);
  const [disableTarget, setDisableTarget] = useState<User | null>(null);
  const [approveTarget, setApproveTarget] = useState<User | null>(null);
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);

  const simulateLoad = useCallback(() => {
    setLoading(true);
    setError(false);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return simulateLoad();
  }, [simulateLoad]);
  useEffect(() => {
    setPage(1);
  }, [search, filterVaiTro, filterTT, sortCol, sortDir]);

  /* ─ Derived list ─ */
  const filtered = useMemo(() => {
    let list = data.filter(
      (u) =>
        (u.hoTen.toLowerCase().includes(search.toLowerCase()) ||
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())) &&
        (filterVaiTro === "" || u.vaiTro === filterVaiTro) &&
        (filterTT === "" || u.trangThai === filterTT),
    );
    if (sortCol) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortCol === "ngayTao") {
          cmp = parseDate(a.ngayTao) - parseDate(b.ngayTao);
        } else {
          cmp = String(a[sortCol]).localeCompare(String(b[sortCol]), "vi");
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, filterVaiTro, filterTT, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  /* ─ CRUD / action helpers ─ */
  const existingUsernames = data.map((u) => u.username.toLowerCase());
  const existingEmails = data.map((u) => u.email.toLowerCase());

  function handleAdd(values: UserAddFormValues) {
    const newUser: User = {
      id: `U${String(data.length + 1).padStart(3, "0")}`,
      hoTen: values.hoTen.trim(),
      username: values.username.trim(),
      email: values.email.trim().toLowerCase(),
      sdt: values.sdt.trim(),
      phong: values.phong,
      vaiTro: values.vaiTro,
      trangThai: values.trangThai,
      ngayTao: new Date().toLocaleDateString("vi-VN"),
    };
    setData((prev) => [newUser, ...prev]);
    setSelected(newUser);
    toast.success(`Đã thêm người dùng "${newUser.hoTen}"`);
    setAddOpen(false);
  }

  function handleEdit(values: UserEditFormValues) {
    if (!editTarget) return;
    const updated: User = {
      ...editTarget,
      hoTen: values.hoTen.trim(),
      email: values.email.trim().toLowerCase(),
      sdt: values.sdt.trim(),
      phong: values.phong,
      vaiTro: values.vaiTro,
      trangThai: values.trangThai,
    };
    setData((prev) => prev.map((u) => (u.id === editTarget.id ? updated : u)));
    if (selected.id === editTarget.id) setSelected(updated);
    toast.success(`Đã cập nhật "${updated.hoTen}"`);
    setEditTarget(null);
  }

  function updateTrangThai(target: User, next: TrangThai, msg: string) {
    setData((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, trangThai: next } : u)),
    );
    if (selected.id === target.id)
      setSelected({ ...selected, trangThai: next });
    toast.success(msg);
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Người dùng</h1>
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
            <i className="fa-solid fa-plus text-xs" /> Thêm người dùng
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {(
              [
                [
                  "fa-users",
                  "blue",
                  "TỔNG",
                  data.length,
                  "tài khoản",
                  "text-blue-600",
                ],
                [
                  "fa-circle-check",
                  "green",
                  "HOẠT ĐỘNG",
                  data.filter((d) => d.trangThai === "Hoạt động").length,
                  "người",
                  "text-emerald-600",
                ],
                [
                  "fa-hourglass-half",
                  "amber",
                  "CHỜ DUYỆT",
                  data.filter((d) => d.trangThai === "Chờ duyệt").length,
                  "yêu cầu",
                  "text-amber-600",
                ],
                [
                  "fa-lock",
                  "red",
                  "BỊ KHÓA",
                  data.filter((d) => d.trangThai === "Bị khóa").length,
                  "tài khoản",
                  "text-red-500",
                ],
              ] as const
            ).map(([icon, color, lbl, val, sub, valCls]) => (
              <div
                key={lbl}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "blue" ? "bg-blue-100 text-blue-600" : color === "green" ? "bg-emerald-100 text-emerald-600" : color === "amber" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}
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

          {/* FILTER + TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Filter bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800 text-sm flex-1 min-w-0">
                Danh sách tài khoản
              </span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm tên, username, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
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
                value={filterVaiTro}
                onChange={(e) => setFilterVaiTro(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả vai trò</option>
                <option>Admin</option>
                <option>Quản lý</option>
                <option>Nhân viên</option>
              </select>
              <select
                value={filterTT}
                onChange={(e) => setFilterTT(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option>Hoạt động</option>
                <option>Chờ duyệt</option>
                <option>Bị khóa</option>
                <option>Ngưng hoạt động</option>
              </select>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Error */}
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
                        onClick={() => toggleSort("hoTen")}
                      >
                        Người dùng
                        <SortIcon active={sortCol === "hoTen"} dir={sortDir} />
                      </th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("phong")}
                      >
                        Khoa/phòng
                        <SortIcon active={sortCol === "phong"} dir={sortDir} />
                      </th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("vaiTro")}
                      >
                        Vai trò
                        <SortIcon active={sortCol === "vaiTro"} dir={sortDir} />
                      </th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("trangThai")}
                      >
                        Trạng thái
                        <SortIcon
                          active={sortCol === "trangThai"}
                          dir={sortDir}
                        />
                      </th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("ngayTao")}
                      >
                        Ngày tạo
                        <SortIcon
                          active={sortCol === "ngayTao"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <i className="fa-solid fa-user-slash text-4xl text-slate-200" />
                            <p className="text-sm font-medium text-slate-500">
                              {search || filterVaiTro || filterTT
                                ? "Không tìm thấy tài khoản phù hợp với bộ lọc"
                                : "Chưa có tài khoản nào"}
                            </p>
                            {(search || filterVaiTro || filterTT) && (
                              <button
                                onClick={() => {
                                  setSearch("");
                                  setFilterVaiTro("");
                                  setFilterTT("");
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
                      paginated.map((u, i) => (
                        <tr
                          key={u.id}
                          onClick={() => setSelected(u)}
                          className={`cursor-pointer transition-colors ${selected.id === u.id ? "bg-blue-50" : "hover:bg-slate-50"} ${u.trangThai === "Ngưng hoạt động" || u.trangThai === "Bị khóa" ? "opacity-60" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                              >
                                {getInitials(u.hoTen)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">
                                  {u.hoTen}
                                </div>
                                <div className="text-xs text-slate-400">
                                  @{u.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {u.phong}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${VAI_TRO_BADGE[u.vaiTro]}`}
                            >
                              {u.vaiTro}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TT_BADGE[u.trangThai]}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${TT_DOT[u.trangThai]}`}
                              />
                              {u.trangThai}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 text-xs">
                            {u.ngayTao}
                          </td>
                          <td className="px-5 py-3">
                            <div
                              className="flex items-center justify-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Duyệt / Từ chối (Chờ duyệt) */}
                              {u.trangThai === "Chờ duyệt" && (
                                <>
                                  <button
                                    title="Duyệt"
                                    onClick={() => setApproveTarget(u)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50"
                                  >
                                    <i className="fa-solid fa-check text-xs" />
                                  </button>
                                  <button
                                    title="Từ chối"
                                    onClick={() => setRejectTarget(u)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                                  >
                                    <i className="fa-solid fa-ban text-xs" />
                                  </button>
                                </>
                              )}
                              {/* Sửa */}
                              <button
                                title="Chỉnh sửa"
                                onClick={() => setEditTarget(u)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50"
                              >
                                <i className="fa-solid fa-pen text-xs" />
                              </button>
                              {/* Khóa / Tắt hoạt động */}
                              {u.trangThai === "Hoạt động" && (
                                <>
                                  <button
                                    title="Tắt hoạt động"
                                    onClick={() => setDisableTarget(u)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                                  >
                                    <i className="fa-solid fa-eye-slash text-xs" />
                                  </button>
                                  <button
                                    title="Khóa tài khoản"
                                    onClick={() => setLockTarget(u)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-orange-400 hover:bg-orange-50"
                                  >
                                    <i className="fa-solid fa-lock text-xs" />
                                  </button>
                                </>
                              )}
                              {/* Mở khóa nếu đang bị khóa/ngưng */}
                              {(u.trangThai === "Bị khóa" ||
                                u.trangThai === "Ngưng hoạt động") && (
                                <button
                                  title="Kích hoạt lại"
                                  onClick={() => setDisableTarget(u)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50"
                                >
                                  <i className="fa-solid fa-lock-open text-xs" />
                                </button>
                              )}
                              {/* Xóa */}
                              <button
                                title="Xóa tài khoản"
                                onClick={() => setDeleteTarget(u)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
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
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
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
          {(() => {
            const i = data.findIndex((u) => u.id === selected.id);
            const idx = i >= 0 ? i : 0;
            return (
              <>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                >
                  {getInitials(selected.hoTen)}
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">
                  {selected.hoTen}
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  @{selected.username}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${VAI_TRO_BADGE[selected.vaiTro]}`}
                  >
                    {selected.vaiTro}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TT_BADGE[selected.trangThai]}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${TT_DOT[selected.trangThai]}`}
                    />
                    {selected.trangThai}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  {(
                    [
                      ["Mã", selected.id],
                      ["Email", selected.email],
                      ["Điện thoại", selected.sdt || "—"],
                      ["Khoa/phòng", selected.phong],
                      ["Ngày tạo", selected.ngayTao],
                    ] as [string, string][]
                  ).map(([lbl, val]) => (
                    <div key={lbl} className="flex flex-col text-xs gap-0.5">
                      <span className="text-slate-400">{lbl}</span>
                      <span className="text-slate-800 font-medium break-all">
                        {val}
                      </span>
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

                  {selected.trangThai === "Chờ duyệt" && (
                    <>
                      <button
                        onClick={() => setApproveTarget(selected)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 transition-colors"
                      >
                        <i className="fa-solid fa-check text-xs" /> Duyệt tài
                        khoản
                      </button>
                      <button
                        onClick={() => setRejectTarget(selected)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl py-2.5 transition-colors"
                      >
                        <i className="fa-solid fa-ban text-xs" /> Từ chối
                      </button>
                    </>
                  )}

                  {selected.trangThai === "Hoạt động" && (
                    <>
                      <button
                        onClick={() => setDisableTarget(selected)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl py-2.5 transition-colors"
                      >
                        <i className="fa-solid fa-eye-slash text-xs" /> Tắt hoạt
                        động
                      </button>
                      <button
                        onClick={() => setLockTarget(selected)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-orange-500 hover:bg-orange-50 border border-orange-200 rounded-xl py-2.5 transition-colors"
                      >
                        <i className="fa-solid fa-lock text-xs" /> Khóa tài
                        khoản
                      </button>
                    </>
                  )}

                  {(selected.trangThai === "Bị khóa" ||
                    selected.trangThai === "Ngưng hoạt động") && (
                    <button
                      onClick={() => setDisableTarget(selected)}
                      className="w-full flex items-center justify-center gap-2 text-sm text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 transition-colors"
                    >
                      <i className="fa-solid fa-lock-open text-xs" /> Kích hoạt
                      lại
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(selected)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl py-2.5 transition-colors"
                  >
                    <i className="fa-solid fa-trash text-xs" /> Xóa tài khoản
                  </button>
                </div>
              </>
            );
          })()}
        </aside>
      </div>

      {/* ── Modals ── */}
      {addOpen && (
        <ThemNguoiDungModal
          existingUsernames={existingUsernames}
          existingEmails={existingEmails}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      )}

      {editTarget && (
        <SuaNguoiDungModal
          user={editTarget}
          existingEmails={existingEmails.filter(
            (e) => e !== editTarget.email.toLowerCase(),
          )}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          danger
          title="Xóa tài khoản"
          message={`Bạn có chắc muốn xóa tài khoản "${deleteTarget.hoTen}" (@${deleteTarget.username})? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onConfirm={() => {
            const remaining = data.filter((u) => u.id !== deleteTarget.id);
            setData(remaining);
            if (selected.id === deleteTarget.id && remaining.length > 0)
              setSelected(remaining[0]);
            toast.success(`Đã xóa tài khoản "${deleteTarget.hoTen}"`);
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {lockTarget && (
        <ConfirmModal
          danger
          title="Khóa tài khoản"
          message={`Bạn có chắc muốn khóa tài khoản "${lockTarget.hoTen}"? Người dùng sẽ không thể đăng nhập.`}
          confirmLabel="Khóa"
          onConfirm={() => {
            updateTrangThai(
              lockTarget,
              "Bị khóa",
              `Đã khóa tài khoản "${lockTarget.hoTen}"`,
            );
            setLockTarget(null);
          }}
          onClose={() => setLockTarget(null)}
        />
      )}

      {disableTarget && (
        <ConfirmModal
          title={
            disableTarget.trangThai === "Hoạt động"
              ? "Tắt hoạt động"
              : "Kích hoạt lại"
          }
          message={
            disableTarget.trangThai === "Hoạt động"
              ? `Bạn có chắc muốn tắt hoạt động tài khoản "${disableTarget.hoTen}"?`
              : `Bạn có chắc muốn kích hoạt lại tài khoản "${disableTarget.hoTen}"?`
          }
          confirmLabel={
            disableTarget.trangThai === "Hoạt động"
              ? "Tắt hoạt động"
              : "Kích hoạt"
          }
          onConfirm={() => {
            const next: TrangThai =
              disableTarget.trangThai === "Hoạt động"
                ? "Ngưng hoạt động"
                : "Hoạt động";
            updateTrangThai(
              disableTarget,
              next,
              `"${disableTarget.hoTen}" chuyển sang ${next}`,
            );
            setDisableTarget(null);
          }}
          onClose={() => setDisableTarget(null)}
        />
      )}

      {approveTarget && (
        <ConfirmModal
          title="Duyệt tài khoản"
          message={`Bạn có chắc muốn duyệt tài khoản "${approveTarget.hoTen}"? Người dùng sẽ được phép đăng nhập.`}
          confirmLabel="Duyệt"
          onConfirm={() => {
            updateTrangThai(
              approveTarget,
              "Hoạt động",
              `Đã duyệt tài khoản "${approveTarget.hoTen}"`,
            );
            setApproveTarget(null);
          }}
          onClose={() => setApproveTarget(null)}
        />
      )}

      {rejectTarget && (
        <ConfirmModal
          danger
          title="Từ chối tài khoản"
          message={`Bạn có chắc muốn từ chối tài khoản "${rejectTarget.hoTen}"?`}
          confirmLabel="Từ chối"
          onConfirm={() => {
            updateTrangThai(
              rejectTarget,
              "Bị khóa",
              `Đã từ chối tài khoản "${rejectTarget.hoTen}"`,
            );
            setRejectTarget(null);
          }}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  );
}
