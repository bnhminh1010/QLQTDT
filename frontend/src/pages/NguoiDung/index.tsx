import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import { ThemNguoiDungModal } from "./ThemNguoiDungModal";
import { SuaNguoiDungModal } from "./SuaNguoiDungModal";
import type {
  User,
  VaiTro,
  TrangThai,
  UserAddFormValues,
  UserEditFormValues,
} from "./types";
import { getUsers, createUser, updateUser, deleteUser, getAllRoles, getUserRoles, assignUserRole, removeUserRole, getKhoaPhongs, getUserAuditLogs } from "@/services/adminApi";
import type { RoleItem, UserRoleInfo, KhoaPhong, UserAuditLog } from "@/services/adminApi";

/* ─── Badge maps ──────────────────────────────────────── */
const VAI_TRO_COLORS = [
  "bg-red-100 text-red-700", "bg-purple-100 text-purple-700",
  "bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
  "bg-indigo-100 text-indigo-700", "bg-pink-100 text-pink-700",
  "bg-teal-100 text-teal-700", "bg-orange-100 text-orange-700",
];
function getVaiTroBadge(v: string): string {
  let hash = 0;
  for (let i = 0; i < v.length; i++) hash = (hash * 31 + v.charCodeAt(i)) | 0;
  return VAI_TRO_COLORS[Math.abs(hash) % VAI_TRO_COLORS.length];
}

const TT_BADGE: Record<TrangThai, string> = {
  "Hoạt động": "bg-emerald-100 text-emerald-700",
  "Bị khóa": "bg-red-100 text-red-600",
  "Ngưng hoạt động": "bg-slate-100 text-slate-500",
};

const TT_DOT: Record<TrangThai, string> = {
  "Hoạt động": "bg-emerald-500",
  "Bị khóa": "bg-red-500",
  "Ngưng hoạt động": "bg-slate-400",
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500",
  "bg-amber-500", "bg-red-500", "bg-indigo-500",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1][0]?.toUpperCase() ?? "?";
}

const PAGE_SIZE = 8;
type SortCol = "hoTen" | "phong" | "vaiTro" | "trangThai" | "ngayTao";

function parseDate(s: string): number {
  const [d, m, y] = s.split("/").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function formatDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDateTime(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} ${formatDate(raw)}`;
}

function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    CREATE_USER: "Tạo người dùng",
    UPDATE_USER: "Cập nhật người dùng",
    DELETE_USER: "Xóa người dùng",
  };
  return labels[action] ?? action;
}

function formatAuditDescription(raw: string): string {
  if (!raw) return "—";
  try {
    const parsed = JSON.parse(raw) as { moTa?: string };
    return parsed.moTa || raw;
  } catch {
    return raw;
  }
}

/* ─── Confirm modal ───────────────────────────────────── */
type ConfirmProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
};
function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose, danger = false }: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
            <i className={`fa-solid fa-triangle-exclamation ${danger ? "text-red-500" : "text-amber-500"}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
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
  return dir === "asc"
    ? <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
    : <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />;
}

/* ─── Main component ──────────────────────────────────── */
export default function NguoiDung() {
  const [data, setData] = useState<User[]>([]);
  const [selected, setSelected] = useState<User>(() => ({
    id: "", hoTen: "", username: "", email: "", sdt: "",
    phong: "", vaiTro: "Nhân viên", trangThai: "Hoạt động", ngayTao: "",
  }));
  const [search, setSearch] = useState("");
  const [filterVaiTro, setFilterVaiTro] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [lockTarget, setLockTarget] = useState<User | null>(null);
  const [disableTarget, setDisableTarget] = useState<User | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "roles" | "history" | "access">("info");
  const [pageSizeOpt] = useState(PAGE_SIZE);
  const [allRoles, setAllRoles] = useState<RoleItem[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleInfo[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [khoaPhongList, setKhoaPhongList] = useState<KhoaPhong[]>([]);
  const [selectedKhoaPhongId, setSelectedKhoaPhongId] = useState("");
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers({ page: 1, pageSize: 100 });
      const mapped: User[] = result.items.map((u: any) => ({
        id: String(u.id),
        hoTen: u.hoTen,
        username: u.tenDangNhap,
        email: u.email,
        sdt: u.soDienThoai || "",
        phong: u.roles?.find((r: any) => r.laChinh)?.tenKhoaPhong ?? u.roles?.[0]?.tenKhoaPhong ?? "",
        vaiTro: u.roles?.map((r: any) => r.tenVaiTro).filter(Boolean).join(", ") || "Không có vai trò",
        quyen: u.quyen ?? [],
        trangThai: u.trangThaiHoatDong ? "Hoạt động" as TrangThai : "Ngưng hoạt động" as TrangThai,
        ngayTao: formatDate(u.ngayTao),
      }));
      setData(mapped);
      if (mapped.length > 0) setSelected(mapped[0]);
    } catch (e: any) {
      setError(e?.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    let ignore = false;
    getAllRoles().then(data => { if (!ignore) setAllRoles(data); }).catch(() => {});
    return () => { ignore = true; };
  }, []);
  useEffect(() => {
    let ignore = false;
    getKhoaPhongs().then(data => { if (!ignore) setKhoaPhongList(data); }).catch(() => {});
    return () => { ignore = true; };
  }, []);
  useEffect(() => { setPage(1); }, [search, filterVaiTro, filterTT, sortCol, sortDir]);
  useEffect(() => {
    const numId = parseInt(selected.id);
    if (numId) getUserRoles(numId).then(setUserRoles).catch(() => setUserRoles([]));
  }, [selected.id]);

  const loadAuditLogs = useCallback(async (userId: string) => {
    const numId = parseInt(userId);
    if (!numId) {
      setAuditLogs([]);
      return;
    }

    setAuditLoading(true);
    try {
      const logs = await getUserAuditLogs(numId);
      setAuditLogs(logs);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs(selected.id);
  }, [selected.id, loadAuditLogs]);

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
        if (sortCol === "ngayTao") cmp = parseDate(a.ngayTao) - parseDate(b.ngayTao);
        else cmp = String(a[sortCol]).localeCompare(String(b[sortCol]), "vi");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, filterVaiTro, filterTT, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSizeOpt));
  const paginated = filtered.slice((page - 1) * pageSizeOpt, page * pageSizeOpt);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  const existingUsernames = data.map((u) => u.username.toLowerCase());
  const existingEmails = data.map((u) => u.email.toLowerCase());

  function addAudit(_userId: string, hanhDong: string) {
    toast.info(hanhDong);
  }

  function handleAdd(values: UserAddFormValues) {
    const v = values as UserAddFormValues & { vaiTro: VaiTro };
    const newUser: User = {
      id: `U${String(data.length + 1).padStart(3, "0")}`,
      hoTen: v.hoTen.trim(),
      username: v.username.trim(),
      email: v.email.trim().toLowerCase(),
      sdt: v.sdt.trim(),
      phong: v.phong,
      vaiTro: v.vaiTro,
      trangThai: "Hoạt động",
      ngayTao: new Date().toLocaleDateString("vi-VN"),
    };
    const khoaPhongId = khoaPhongList.find((k) => k.tenKhoaPhong === v.phong)?.id;
    const vaiTroId = allRoles.find((r) => r.tenVaiTro === v.vaiTro)?.id;
    createUser({
      hoTen: newUser.hoTen, email: newUser.email,
      tenDangNhap: newUser.username, matKhau: v.matKhau || "Default@123",
      soDienThoai: newUser.sdt || undefined,
      khoaPhongId,
      vaiTroId,
    }).then(() => {
      setData((prev) => [newUser, ...prev]);
      setSelected(newUser);
      addAudit(newUser.id, `Tạo tài khoản "${newUser.hoTen}"`);
      toast.success(`Đã thêm người dùng "${newUser.hoTen}"`);
      setAddOpen(false);
    }).catch(() => toast.error("Không thể tạo người dùng"));
  }

  function handleEdit(values: UserEditFormValues) {
    if (!editTarget) return;
    updateUser(parseInt(editTarget.id), {
      hoTen: values.hoTen.trim(),
      email: values.email.trim().toLowerCase(),
      soDienThoai: values.sdt.trim() || undefined,
    }).then(() => {
      const updated: User = { ...editTarget, ...values };
      setData((prev) => prev.map((u) => (u.id === editTarget.id ? updated : u)));
      if (selected.id === editTarget.id) {
        setSelected(updated);
        loadAuditLogs(editTarget.id);
      }
      toast.success(`Đã cập nhật "${updated.hoTen}"`);
      setEditTarget(null);
    }).catch(() => toast.error("Không thể cập nhật người dùng"));
  }

  function updateTrangThai(target: User, _next: TrangThai, msg: string) {
    setData((prev) => prev.map((u) => (u.id === target.id ? { ...u, trangThai: _next } : u)));
    if (selected.id === target.id) setSelected({ ...selected, trangThai: _next });
    toast.success(msg);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Người dùng</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => loadData()} title="Tải lại"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <i className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <i className="fa-solid fa-plus text-xs" /> Thêm người dùng
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col 2xl:flex-row overflow-hidden">
        <main className="flex-1 min-w-0 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {([
              ["fa-users", "blue", "TỔNG", data.length, "tài khoản", "text-blue-600"],
              ["fa-circle-check", "green", "HOẠT ĐỘNG", data.filter((d) => d.trangThai === "Hoạt động").length, "người", "text-emerald-600"],
              ["fa-eye-slash", "amber", "NGƯNG HOẠT ĐỘNG", data.filter((d) => d.trangThai === "Ngưng hoạt động").length, "tài khoản", "text-amber-600"],
              ["fa-lock", "red", "BỊ KHÓA", data.filter((d) => d.trangThai === "Bị khóa").length, "tài khoản", "text-red-500"],
            ] as const).map(([icon, color, lbl, val, sub, valCls]) => (
              <div key={lbl} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "blue" ? "bg-blue-100 text-blue-600" : color === "green" ? "bg-emerald-100 text-emerald-600" : color === "amber" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}>
                  <i className={`fa-solid ${icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">{lbl}</div>
                  <div className={`text-2xl font-extrabold ${valCls}`}>{val}</div>
                  <div className="text-xs text-slate-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800 text-sm flex-1 min-w-0">Danh sách tài khoản</span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input type="text" placeholder="Tìm tên, username, email..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52" />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xs" /></button>}
              </div>
              <SelectField value={filterVaiTro || "__all"} onValueChange={(value) => setFilterVaiTro(value === "__all" ? "" : value)}
                options={[
                  { value: "__all", label: "Tất cả vai trò" },
                  ...Array.from(new Set(data.map(u => u.vaiTro).filter(Boolean)))
                    .sort()
                    .map(v => ({ value: v, label: v }))
                ]}
                triggerClassName="h-10 min-w-[150px] bg-white" />
              <SelectField value={filterTT || "__all"} onValueChange={(value) => setFilterTT(value === "__all" ? "" : value)}
                options={[{ value: "__all", label: "Tất cả trạng thái" }, { value: "Hoạt động", label: "Hoạt động" }, { value: "Bị khóa", label: "Bị khóa" }, { value: "Ngưng hoạt động", label: "Ngưng hoạt động" }]}
                triggerClassName="h-10 min-w-[170px] bg-white" />
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400" />
                <p className="text-sm text-slate-600">{error}</p>
                <button onClick={() => loadData()} className="mt-1 h-8 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-rotate-right" /> Thử lại
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("hoTen")}>Người dùng<SortIcon active={sortCol === "hoTen"} dir={sortDir} /></th>
                      <th className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("phong")}>Khoa/phòng<SortIcon active={sortCol === "phong"} dir={sortDir} /></th>
                      <th className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("vaiTro")}>Vai trò<SortIcon active={sortCol === "vaiTro"} dir={sortDir} /></th>
                      <th className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("trangThai")}>Trạng thái<SortIcon active={sortCol === "trangThai"} dir={sortDir} /></th>
                      <th className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("ngayTao")}>Ngày tạo<SortIcon active={sortCol === "ngayTao"} dir={sortDir} /></th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <i className="fa-solid fa-user-slash text-4xl text-slate-200" />
                          <p className="text-sm font-medium text-slate-500">{search || filterVaiTro || filterTT ? "Không tìm thấy" : "Chưa có tài khoản"}</p>
                        </div>
                      </td></tr>
                    ) : (
                      paginated.map((u, i) => (
                        <tr key={u.id} onClick={() => setSelected(u)}
                          className={`cursor-pointer transition-colors ${selected.id === u.id ? "bg-blue-50" : "hover:bg-slate-50"} ${u.trangThai === "Ngưng hoạt động" || u.trangThai === "Bị khóa" ? "opacity-60" : ""}`}>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{getInitials(u.hoTen)}</div>
                              <div><div className="font-medium text-slate-800">{u.hoTen}</div><div className="text-xs text-slate-400">@{u.username}</div></div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-500">{u.phong}</td>
                          <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getVaiTroBadge(u.vaiTro)}`}>{u.vaiTro}</span></td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TT_BADGE[u.trangThai]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${TT_DOT[u.trangThai]}`} />{u.trangThai}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{u.ngayTao}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button title="Chỉnh sửa" onClick={() => setEditTarget(u)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50"><i className="fa-solid fa-pen text-xs" /></button>
                              <button title="Xóa" onClick={() => setDeleteTarget(u)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50"><i className="fa-solid fa-trash text-xs" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">Hiển thị {filtered.length === 0 ? 0 : (page - 1) * pageSizeOpt + 1}–{Math.min(page * pageSizeOpt, filtered.length)} / {filtered.length} kết quả</span>
                <div className="flex items-center gap-1">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"><i className="fa-solid fa-chevron-left text-xs" /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1).reduce<(number | "…")[]>((acc, n, idx, arr) => {
                    if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(n); return acc;
                  }, []).map((n, i) =>
                    n === "…" ? <span key={`e${i}`} className="px-1 text-slate-400 text-xs">…</span>
                      : <button key={n} onClick={() => setPage(n as number)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{n}</button>
                  )}
                  <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"><i className="fa-solid fa-chevron-right text-xs" /></button>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="w-full shrink-0 border-t border-slate-200 bg-white overflow-y-auto 2xl:w-[340px] 2xl:border-l 2xl:border-t-0">
          {selected?.id ? (() => {
            const i = data.findIndex((u) => u.id === selected.id);
            const idx = i >= 0 ? i : 0;
            return (
              <>
                <div className="p-5 border-b border-slate-100">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>{getInitials(selected.hoTen)}</div>
                  <div className="text-sm font-bold text-slate-900 mb-0.5">{selected.hoTen}</div>
                  <div className="text-xs text-slate-400 mb-3">@{selected.username}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getVaiTroBadge(selected.vaiTro)}`}>{selected.vaiTro}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TT_BADGE[selected.trangThai]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${TT_DOT[selected.trangThai]}`} />{selected.trangThai}
                    </span>
                  </div>
                </div>
                <div className="flex overflow-x-auto border-b border-slate-100">
                  {(["info", "roles", "access", "history"] as const).map((tab) => (
                    <button key={tab} onClick={() => setDetailTab(tab)}
                      className={`min-w-[72px] flex-1 py-2.5 text-xs font-semibold transition-colors ${detailTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>
                      {tab === "info" ? "Thông tin" : tab === "roles" ? "Phân quyền" : tab === "access" ? "Truy cập" : "Lịch sử"}
                    </button>
                  ))}
                </div>
                {detailTab === "info" ? (
                  <div className="p-5">
                    <div className="space-y-2.5 mb-5">
                      {([["Mã", selected.id], ["Email", selected.email], ["Điện thoại", selected.sdt || "—"], ["Khoa/phòng", selected.phong], ["Ngày tạo", selected.ngayTao]] as [string, string][]).map(([lbl, val]) => (
                        <div key={lbl} className="flex flex-col text-xs gap-0.5">
                          <span className="text-slate-400">{lbl}</span>
                          <span className="text-slate-800 font-medium break-all">{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setEditTarget(selected)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl py-2.5 transition-colors">
                        <i className="fa-solid fa-pen text-xs" /> Chỉnh sửa
                      </button>
                      <button onClick={() => setDeleteTarget(selected)}
                        className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl py-2.5 transition-colors">
                        <i className="fa-solid fa-trash text-xs" /> Xóa tài khoản
                      </button>
                    </div>
                  </div>
                ) : detailTab === "roles" ? (
                  <div className="p-5 space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-2">Vai trò hiện tại</p>
                    {userRoles.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Chưa có vai trò</p>
                    ) : (
                      <div className="space-y-1.5 mb-4">
                        {userRoles.map((r) => (
                          <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                            <div>
                              <span className="text-xs font-semibold text-slate-700">{r.tenVaiTro}</span>
                              {r.tenKhoaPhong && <span className="text-[10px] text-slate-400 ml-1">· {r.tenKhoaPhong}</span>}
                            </div>
                            <button onClick={() => removeUserRole(r.id).then(() => {
                              setUserRoles((prev) => prev.filter((x) => x.id !== r.id));
                              loadData();
                              loadAuditLogs(selected.id);
                              toast.success("Đã gỡ vai trò");
                            }).catch(() => toast.error("Gỡ vai trò thất bại"))}
                              className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50">
                              <i className="fa-solid fa-xmark text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-2">Thêm vai trò</p>
                    <div className="flex flex-col gap-2">
                      <SelectField value={selectedRoleId} onValueChange={setSelectedRoleId}
                        options={[{ value: "__empty", label: "-- Chọn vai trò --" }, ...allRoles.map((r) => ({ value: String(r.id), label: `${r.tenVaiTro} (${r.maVaiTro})` }))]}
                        triggerClassName="h-9 w-full bg-white text-xs" />
                      <SelectField value={selectedKhoaPhongId} onValueChange={setSelectedKhoaPhongId}
                        options={[{ value: "__empty", label: "-- Chọn khoa/phòng --" }, ...khoaPhongList.filter(k => k.trangThaiHoatDong).map((k) => ({ value: String(k.id), label: k.tenKhoaPhong }))]}
                        triggerClassName="h-9 w-full bg-white text-xs" />
                      <button onClick={() => {
                        const roleId = parseInt(selectedRoleId);
                        if (!roleId) { toast.error("Chọn vai trò"); return; }
                        const userIdNum = parseInt(selected.id);
                        if (!userIdNum) { toast.error("User ID không hợp lệ"); return; }
                        assignUserRole(userIdNum, { khoaPhongId: parseInt(selectedKhoaPhongId), vaiTroId: roleId })
                          .then(() => {
                            toast.success("Đã thêm vai trò");
                            setSelectedRoleId("");
                            return getUserRoles(userIdNum);
                          })
                          .then((roles) => {
                            setUserRoles(roles);
                            loadData();
                            loadAuditLogs(selected.id);
                          })
                          .catch(() => toast.error("Gán vai trò thất bại"));
                      }}
                        className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
                        <i className="fa-solid fa-plus" /> Gán
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Thay đổi vai trò yêu cầu user đăng nhập lại để cập nhật quyền.</p>
                  </div>
                ) : detailTab === "access" ? (
                  <AccessTabView userRoles={userRoles} permissions={selected.quyen ?? []} />
                ) : (
                  <div className="p-5">
                    <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-3">Lịch sử thao tác</p>
                    {auditLoading ? (
                      <div className="text-center py-8 text-slate-400">
                        <i className="fa-solid fa-circle-notch fa-spin text-2xl text-blue-400" />
                        <p className="text-xs mt-2">Đang tải lịch sử...</p>
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fa-solid fa-clock-rotate-left text-3xl text-slate-200" />
                        <p className="text-xs text-slate-400 mt-2">Chưa có lịch sử</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-700">{formatAuditAction(log.hanhDong)}</span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDateTime(log.thoiGianThucHien)}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 break-words">{formatAuditDescription(log.moTaChiTiet)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })() : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <i className="fa-solid fa-user text-3xl mb-2" />
              <p className="text-xs">Chọn người dùng để xem chi tiết</p>
            </div>
          )}
        </aside>
      </div>

      {addOpen && (
        <ThemNguoiDungModal
          existingUsernames={existingUsernames}
          existingEmails={existingEmails}
          khoaPhongOptions={khoaPhongList.filter(k => k.trangThaiHoatDong).map(k => k.tenKhoaPhong)}
          vaiTroOptions={allRoles.map(r => r.tenVaiTro)}
          onSave={handleAdd}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editTarget && (
        <SuaNguoiDungModal
          user={editTarget}
          existingEmails={existingEmails.filter((e) => e !== editTarget.email.toLowerCase())}
          khoaPhongOptions={khoaPhongList.filter(k => k.trangThaiHoatDong).map(k => k.tenKhoaPhong)}
          vaiTroOptions={allRoles.map(r => r.tenVaiTro)}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal danger title="Xóa tài khoản"
          message={`Bạn có chắc muốn xóa tài khoản "${deleteTarget.hoTen}"?`}
          confirmLabel="Xóa"
          onConfirm={() => {
            deleteUser(parseInt(deleteTarget.id)).then(() => {
              const remaining = data.filter((u) => u.id !== deleteTarget.id);
              setData(remaining);
              if (selected.id === deleteTarget.id && remaining.length > 0) setSelected(remaining[0]);
              toast.success(`Đã xóa tài khoản "${deleteTarget.hoTen}"`);
              setDeleteTarget(null);
            }).catch(() => toast.error("Không thể xóa"));
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {lockTarget && (
        <ConfirmModal danger title="Khóa tài khoản"
          message={`Bạn có chắc muốn khóa tài khoản "${lockTarget.hoTen}"?`}
          confirmLabel="Khóa"
          onConfirm={() => {
            updateTrangThai(lockTarget, "Bị khóa", `Đã khóa tài khoản "${lockTarget.hoTen}"`);
            setLockTarget(null);
          }}
          onClose={() => setLockTarget(null)}
        />
      )}
      {disableTarget && (
        <ConfirmModal
          title={disableTarget.trangThai === "Hoạt động" ? "Tắt hoạt động" : "Kích hoạt lại"}
          message={disableTarget.trangThai === "Hoạt động" ? `Tắt hoạt động "${disableTarget.hoTen}"?` : `Kích hoạt lại "${disableTarget.hoTen}"?`}
          confirmLabel={disableTarget.trangThai === "Hoạt động" ? "Tắt hoạt động" : "Kích hoạt"}
          onConfirm={() => {
            const next: TrangThai = disableTarget.trangThai === "Hoạt động" ? "Ngưng hoạt động" : "Hoạt động";
            updateTrangThai(disableTarget, next, `"${disableTarget.hoTen}" chuyển sang ${next}`);
            setDisableTarget(null);
          }}
          onClose={() => setDisableTarget(null)}
        />
      )}
    </>
  );
}

/* ─── Access Tab ─────────────────────────────────────── */
const PAGE_ACCESS: { key: string; label: string; desc: string; permissions: string[] }[] = [
  { key: "dashboard", label: "Dashboard", desc: "Xem tổng quan", permissions: [] },
  { key: "tao-goi-thau", label: "Tạo gói thầu", desc: "Tạo mới gói thầu", permissions: ["GOITHAU.CREATE"] },
  { key: "danh-sach-goi-thau", label: "DS gói thầu", desc: "Danh sách gói thầu", permissions: ["GOITHAU.VIEW", "GOITHAU.VIEW_ALL", "GOITHAU.VIEW_INTERNAL"] },
  { key: "danh-sach-quy-trinh", label: "DS quy trình", desc: "Danh sách quy trình", permissions: ["WORKFLOW.VIEW", "WORKFLOW.VIEW_ALL"] },
  { key: "lap-quy-trinh", label: "Lập quy trình", desc: "Thiết lập quy trình", permissions: ["WORKFLOW.CREATE", "WORKFLOW.CONFIG", "WORKFLOW.VIEW", "WORKFLOW.VIEW_ALL"] },
  { key: "bao-cao", label: "Báo cáo", desc: "Báo cáo & thống kê", permissions: ["REPORT.VIEW", "REPORT.VIEW_INTERNAL", "REPORT.VIEW_ALL"] },
  { key: "xu-ly-buoc", label: "Xử lý bước", desc: "Xử lý bước workflow", permissions: ["WORKFLOW.PROCESS"] },
  { key: "danh-muc-thuc-hien", label: "Danh mục thực hiện", desc: "QL hình thức đấu thầu", permissions: ["HINHTHUCDAUTHAU.VIEW", "DANHMUC.VIEW", "DANHMUC.VIEW_ALL"] },
  { key: "khoa-phong", label: "Khoa/phòng", desc: "QL khoa phòng", permissions: ["USER.VIEW", "USER.VIEW_ALL"] },
  { key: "nguoi-dung", label: "Người dùng", desc: "QL người dùng & phân quyền", permissions: ["USER.VIEW", "USER.VIEW_ALL"] },
];
function AccessTabView({ userRoles, permissions }: { userRoles: UserRoleInfo[]; permissions: string[] }) {
  const isAdmin = userRoles.some((r) => r.maVaiTro === "ADMIN");
  const permissionSet = new Set(permissions);
  const roleLabel = userRoles.length > 0
    ? userRoles.map((r) => r.maVaiTro || r.tenVaiTro).join(", ")
    : "Chưa có vai trò";
  return (
    <div className="p-5 space-y-3">
      <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-2">
        Vai trò hiện tại: <span className="text-blue-600">{roleLabel}</span>
      </p>
      <div className="space-y-0.5">
        {PAGE_ACCESS.map((p) => {
          const ok = isAdmin || p.permissions.length === 0 || p.permissions.some((permission) => permissionSet.has(permission));
          return (
            <div key={p.key} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${ok ? "bg-emerald-50" : "bg-slate-50"}`}>
              <i className={`fa-solid ${ok ? "fa-circle-check text-emerald-500" : "fa-circle-xmark text-slate-300"}`} />
              <span className={`font-medium ${ok ? "text-slate-800" : "text-slate-400"}`}>{p.label}</span>
              <span className="text-[10px] text-slate-400 ml-auto">{p.desc}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-400 mt-2">
        Quyền truy cập được tính từ quyền thật gắn với các vai trò của user.
      </p>
    </div>
  );
}
