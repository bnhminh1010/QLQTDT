import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUserApi, getMyPendingProfileChangeRequest, sendProfileChangeRequest, updateProfileApi, logoutApi } from "@/services/api";
import type { LoginUserDto, ProfileChangeRequest } from "@/services/api";
import { getThongBaos, markAllReadThongBao, markReadThongBao } from "@/services/thongBaoApi";
import type { ThongBaoItem } from "@/services/thongBaoApi";
import { getThongBaoStyle } from "@/util/thongBaoStyle";

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputReadonlyCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

const BADGE_CLS: Record<string, string> = {
  "Hoạt động": "bg-emerald-100 text-emerald-700",
  "Bị khóa": "bg-red-100 text-red-600",
  "Ngưng hoạt động": "bg-slate-100 text-slate-500",
};

export default function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "notifications">("profile");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [notifs, setNotifs] = useState<ThongBaoItem[]>([]);
  const [notifsCount, setNotifsCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ hoTen: "", email: "", soDienThoai: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [pendingProfileChangeRequest, setPendingProfileChangeRequest] = useState<ProfileChangeRequest | null>(null);
  const [user, setUser] = useState<LoginUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Password form ── */
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [savingPwd, setSavingPwd] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    Promise.all([
      getCurrentUserApi(),
      getMyPendingProfileChangeRequest().catch(() => null),
    ])
      .then(([u, pending]) => {
        setUser(u);
        setPendingProfileChangeRequest(pending);
      })
      .catch(() => toast.error("Không thể tải thông tin người dùng"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getThongBaos({ page: 1, pageSize: 50 })
      .then((res) => { setNotifs(res.items); setNotifsCount(res.totalCount); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const unreadCount = notifs.filter((n) => !n.daDoc).length;

  // Derived fields
  const donVi = user?.roles?.[0]?.tenKhoaPhong ?? "—";
  const vaiTro = user?.roles?.[0]?.tenVaiTro ?? "—";
  const trangThaiLabel = user?.trangThaiHoatDong ? "Hoạt động" : "Bị khóa";
  const isAdmin = user?.roles?.some((r) => r.tenVaiTro === "ADMIN") ?? false;

  function validatePassword(): boolean {
    const errs: Record<string, string> = {};
    if (!pwdForm.current) errs.current = "Vui lòng nhập mật khẩu hiện tại";
    if (!pwdForm.newPwd) errs.newPwd = "Vui lòng nhập mật khẩu mới";
    else if (pwdForm.newPwd.length < 8) errs.newPwd = "Mật khẩu mới phải có ít nhất 8 ký tự";
    else if (!/[A-Z]/.test(pwdForm.newPwd)) errs.newPwd = "Mật khẩu phải có ít nhất 1 chữ hoa";
    else if (!/[0-9]/.test(pwdForm.newPwd)) errs.newPwd = "Mật khẩu phải có ít nhất 1 chữ số";
    else if (pwdForm.newPwd === pwdForm.current) errs.newPwd = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    if (!pwdForm.confirm) errs.confirm = "Vui lòng xác nhận mật khẩu mới";
    else if (pwdForm.confirm !== pwdForm.newPwd) errs.confirm = "Xác nhận mật khẩu không khớp";
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleChangePassword() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!validatePassword()) return;
    setSavingPwd(true);
    timeoutRef.current = setTimeout(() => {
      setSavingPwd(false);
      setPwdForm({ current: "", newPwd: "", confirm: "" });
      setPwdErrors({});
      toast.success("Đổi mật khẩu thành công");
    }, 700);
  }

  async function handleLogout() {
    try { await logoutApi(); } catch { /* ignore */ }
    toast.success("Đã đăng xuất");
    navigate("/login", { replace: true });
  }

  function handleOpenNotification(item: ThongBaoItem) {
    markReadThongBao(item.idCongKhai).catch(() => {});
    setNotifs((prev) => prev.map((x) => x.idCongKhai === item.idCongKhai ? { ...x, daDoc: true } : x));
    if (item.urlDieuHuong) navigate(item.urlDieuHuong);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        <i className="fa-solid fa-circle-notch fa-spin text-2xl mr-2" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">Hồ sơ cá nhân</h1>
        </div>
        <button onClick={() => setLogoutConfirm(true)}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2 rounded-lg transition-colors">
          <i className="fa-solid fa-right-from-bracket text-xs" /> Đăng xuất
        </button>
      </header>

      <div className="w-full p-4 lg:p-6 space-y-5">
        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {user?.hoTen?.charAt(0) ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-slate-900">{user?.hoTen ?? "—"}</div>
            <div className="text-sm text-slate-500">{donVi} · {vaiTro}</div>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_CLS[trangThaiLabel] ?? "bg-slate-100 text-slate-500"}`}>
                {trangThaiLabel}
              </span>
              <span className="text-xs text-slate-400">
                Tạo: {user?.ngayTao ? new Date(user.ngayTao).toLocaleDateString("vi-VN") : "—"}
              </span>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => setActiveTab("notifications")}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500">
              <i className="fa-solid fa-bell" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["profile", "password", "notifications"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab === "profile" ? "Thông tin cá nhân" : tab === "password" ? "Đổi mật khẩu" : `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-user-circle text-blue-500" /> Thông tin tài khoản
              </h2>
              {isAdmin && (
                <button onClick={() => {
                  if (editing) {
                    setSavingProfile(true);
                    updateProfileApi(editForm)
                      .then((updated) => { setUser(updated); setEditing(false); toast.success("Cập nhật thành công"); })
                      .catch(() => toast.error("Cập nhật thất bại"))
                      .finally(() => setSavingProfile(false));
                  } else {
                    setEditForm({ hoTen: user?.hoTen ?? "", email: user?.email ?? "", soDienThoai: user?.soDienThoai ?? "" });
                    setEditing(true);
                  }
                }}
                  className="h-8 px-3.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                  {savingProfile ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className={`fa-solid ${editing ? "fa-floppy-disk" : "fa-pen"}`} />}
                  {savingProfile ? "Đang lưu..." : editing ? "Lưu" : "Chỉnh sửa"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Họ và tên</label>
                <input readOnly={!editing} value={editing ? editForm.hoTen : (user?.hoTen ?? "—")}
                  onChange={(e) => setEditForm((f) => ({ ...f, hoTen: e.target.value }))}
                  className={editing ? inputCls : inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Tên đăng nhập</label>
                <input readOnly value={user?.tenDangNhap ?? "—"} className={inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input readOnly={!editing} value={editing ? editForm.email : (user?.email ?? "—")}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className={editing ? inputCls : inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Số điện thoại</label>
                <input readOnly={!editing} value={editing ? editForm.soDienThoai : (user?.soDienThoai ?? "—")}
                  onChange={(e) => setEditForm((f) => ({ ...f, soDienThoai: e.target.value }))}
                  className={editing ? inputCls : inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <input readOnly value={donVi} className={inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Vai trò</label>
                <input readOnly value={vaiTro} className={inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Lần đăng nhập gần nhất</label>
                <input readOnly value={user?.ngayDangNhapCuoi ? new Date(user.ngayDangNhapCuoi).toLocaleString("vi-VN") : "—"} className={inputReadonlyCls} />
              </div>
              <div>
                <label className={labelCls}>Ngày cập nhật gần nhất</label>
                <input readOnly value={user?.ngayCapNhat ? new Date(user.ngayCapNhat).toLocaleString("vi-VN") : "—"} className={inputReadonlyCls} />
              </div>
            </div>
            {editing && (
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="h-8 px-4 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">Hủy</button>
                <button onClick={() => {
                  setSavingProfile(true);
                  updateProfileApi(editForm)
                    .then((updated) => { setUser(updated); setEditing(false); toast.success("Cập nhật thành công"); })
                    .catch(() => toast.error("Cập nhật thất bại"))
                    .finally(() => setSavingProfile(false));
                }} disabled={savingProfile}
                  className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60">
                  {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
            {!isAdmin && pendingProfileChangeRequest && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <div className="flex items-center gap-2 font-semibold">
                  <i className="fa-solid fa-hourglass-half text-amber-500" />
                  Yêu cầu đang chờ duyệt
                </div>
                <div className="mt-2 grid gap-1 sm:grid-cols-3">
                  <span>Họ tên: {pendingProfileChangeRequest.giaTriMoi.hoTen ?? "—"}</span>
                  <span>Email: {pendingProfileChangeRequest.giaTriMoi.email ?? "—"}</span>
                  <span>Điện thoại: {pendingProfileChangeRequest.giaTriMoi.soDienThoai || "—"}</span>
                </div>
              </div>
            )}
            {!isAdmin && !editing && !pendingProfileChangeRequest && (
              <div className="space-y-3">
                <button onClick={() => {
                  setEditForm({ hoTen: user?.hoTen ?? "", email: user?.email ?? "", soDienThoai: user?.soDienThoai ?? "" });
                  setRequestSent(false);
                  setEditing(true);
                }}
                  className="h-8 px-3.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                  <i className="fa-solid fa-pen" /> Yêu cầu thay đổi thông tin
                </button>
              </div>
            )}
            {!isAdmin && editing && (
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEditing(false)} className="h-8 px-4 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">Hủy</button>
                <button onClick={() => {
                  setSavingProfile(true);
                  sendProfileChangeRequest(editForm)
                    .then((request) => {
                      setPendingProfileChangeRequest(request);
                      setEditing(false);
                      setRequestSent(true);
                      toast.success("Yêu cầu đã gửi đến Quản trị viên");
                    })
                    .catch((error) => toast.error(error?.response?.data?.error || "Gửi yêu cầu thất bại"))
                    .finally(() => setSavingProfile(false));
                }} disabled={savingProfile}
                  className="h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-60 flex items-center gap-1.5">
                  {savingProfile ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
                  {savingProfile ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </div>
            )}
            {requestSent && (
              <p className="text-xs text-emerald-700 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <i className="fa-solid fa-circle-check text-emerald-500" />
                Yêu cầu của bạn đã được gửi đến Quản trị viên và đang chờ xử lý.
              </p>
            )}
          </div>
        )}

        {/* Password tab (unchanged) */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-lock text-blue-500" /> Đổi mật khẩu
            </h2>
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Yêu cầu mật khẩu mạnh:</p>
              <ul className="list-disc ml-4 space-y-0.5">
                <li>Ít nhất 8 ký tự</li>
                <li>Có ít nhất 1 chữ hoa (A–Z)</li>
                <li>Có ít nhất 1 chữ số (0–9)</li>
                <li>Khác mật khẩu hiện tại</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {(["current", "newPwd", "confirm"] as const).map((field) => (
                <div key={field}>
                  <label className={labelCls}>
                    {field === "current" ? "Mật khẩu hiện tại" : field === "newPwd" ? "Mật khẩu mới" : "Xác nhận mật khẩu mới"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPwd[field] ? "text" : "password"}
                      value={pwdForm[field]}
                      onChange={(e) => { setPwdForm((f) => ({ ...f, [field]: e.target.value })); setPwdErrors((err) => ({ ...err, [field]: "" })); }}
                      className={`${pwdErrors[field] ? `${inputCls} pr-10 border-red-400` : `${inputCls} pr-10`}`}
                      placeholder={field === "current" ? "Nhập mật khẩu hiện tại" : field === "newPwd" ? "Nhập mật khẩu mới" : "Nhập lại mật khẩu mới"}
                    />
                    <button type="button" onClick={() => setShowPwd((s) => ({ ...s, [field]: !s[field] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <i className={`fa-solid ${showPwd[field] ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                    </button>
                  </div>
                  {pwdErrors[field] && <p className="text-xs text-red-500 mt-1">{pwdErrors[field]}</p>}
                  {field === "newPwd" && pwdForm.newPwd && (
                    <div className="mt-1.5 flex items-center gap-2">
                      {[1, 2, 3, 4].map((i) => {
                        const len = pwdForm.newPwd.length;
                        const hasUpper = /[A-Z]/.test(pwdForm.newPwd);
                        const hasNum = /[0-9]/.test(pwdForm.newPwd);
                        const s = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (len >= 12 ? 1 : 0);
                        return <div key={i} className={`flex-1 h-1 rounded-full ${i <= s ? s <= 1 ? "bg-red-400" : s <= 2 ? "bg-amber-400" : s <= 3 ? "bg-blue-500" : "bg-emerald-500" : "bg-slate-200"}`} />;
                      })}
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {(() => {
                          const len = pwdForm.newPwd.length;
                          const hasUpper = /[A-Z]/.test(pwdForm.newPwd);
                          const hasNum = /[0-9]/.test(pwdForm.newPwd);
                          const s = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (len >= 12 ? 1 : 0);
                          return s <= 1 ? "Yếu" : s <= 2 ? "Trung bình" : s <= 3 ? "Mạnh" : "Rất mạnh";
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={handleChangePassword} disabled={savingPwd}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-60">
                {savingPwd ? <i className="fa-solid fa-circle-notch fa-spin text-xs" /> : <i className="fa-solid fa-lock text-xs" />}
                {savingPwd ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">
                Thông báo{unreadCount > 0 && (
                  <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{unreadCount} mới</span>
                )}
                <span className="ml-2 text-xs font-normal text-slate-400">({notifsCount} tổng)</span>
              </span>
              {unreadCount > 0 && (
                <button onClick={() => {
                  markAllReadThongBao().then(() => {
                    setNotifs((prev) => prev.map((n) => ({ ...n, daDoc: true })));
                  }).catch(() => {});
                }} className="text-xs text-blue-600 hover:underline">Đánh dấu tất cả đã đọc</button>
              )}
            </div>
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <i className="fa-regular fa-bell text-3xl text-slate-200 mb-2" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifs.map((n) => {
                  const style = getThongBaoStyle(n);
                  return (
                  <div key={n.idCongKhai} onClick={() => handleOpenNotification(n)}
                    className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.daDoc ? "bg-slate-50/70" : ""}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${style.iconClassName}`}>
                      <i className={`fa-solid ${style.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p className={`min-w-0 flex-1 text-sm leading-5 ${style.titleClassName} ${!n.daDoc ? "font-semibold" : "font-medium"}`}>{n.tieuDe}</p>
                        <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.badgeClassName}`}>
                          {style.label}
                        </span>
                      </div>
                      {n.noiDung && <p className="text-xs text-slate-400 mt-0.5">{n.noiDung}</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {n.ngayTao ? new Date(n.ngayTao).toLocaleString("vi-VN") : ""}
                      </p>
                    </div>
                    {!n.daDoc && <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dotClassName}`} />}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOGOUT CONFIRM */}
      {logoutConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-right-from-bracket text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Xác nhận đăng xuất</h3>
                <p className="text-sm text-slate-500 mt-1">Bạn có chắc muốn đăng xuất khỏi hệ thống?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setLogoutConfirm(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
              <button onClick={handleLogout} className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl">Đăng xuất</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
