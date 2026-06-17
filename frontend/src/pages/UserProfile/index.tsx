import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/* ─ Mock current user ─ */
const MOCK_USER = {
  hoTen: "Nguyễn Mạnh Tuấn",
  tenDangNhap: "nmtuan",
  email: "nmtuan@bvub.vn",
  sdt: "0901234567",
  donVi: "P.HCQT",
  vaiTro: "Quản lý",
  trangThai: "Hoạt động",
  ngayTao: "01/01/2024",
};

type NotifItem = {
  id: number;
  icon: string;
  color: string;
  title: string;
  time: string;
  read: boolean;
};

const INITIAL_NOTIFS: NotifItem[] = [
  {
    id: 1,
    icon: "fa-triangle-exclamation",
    color: "text-red-500 bg-red-50",
    title: "GT2025-003 trễ hạn 21 ngày",
    time: "Vừa xong",
    read: false,
  },
  {
    id: 2,
    icon: "fa-circle-check",
    color: "text-emerald-500 bg-emerald-50",
    title: "GT2025-002 đã hoàn thành",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: 3,
    icon: "fa-file-lines",
    color: "text-blue-500 bg-blue-50",
    title: "GT2025-001 cần duyệt tờ trình",
    time: "5 giờ trước",
    read: true,
  },
];

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputReadonlyCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-500 cursor-not-allowed";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export default function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "notifications"
  >("profile");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>(INITIAL_NOTIFS);

  /* ── Password form ── */
  const [pwdForm, setPwdForm] = useState({
    current: "",
    newPwd: "",
    confirm: "",
  });
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState({
    current: false,
    newPwd: false,
    confirm: false,
  });
  const [savingPwd, setSavingPwd] = useState(false);

  const unreadCount = notifs.filter((n) => !n.read).length;

  function validatePassword(): boolean {
    const errs: Record<string, string> = {};
    if (!pwdForm.current) errs.current = "Vui lòng nhập mật khẩu hiện tại";
    if (!pwdForm.newPwd) errs.newPwd = "Vui lòng nhập mật khẩu mới";
    else if (pwdForm.newPwd.length < 8)
      errs.newPwd = "Mật khẩu mới phải có ít nhất 8 ký tự";
    else if (!/[A-Z]/.test(pwdForm.newPwd))
      errs.newPwd = "Mật khẩu phải có ít nhất 1 chữ hoa";
    else if (!/[0-9]/.test(pwdForm.newPwd))
      errs.newPwd = "Mật khẩu phải có ít nhất 1 chữ số";
    else if (pwdForm.newPwd === pwdForm.current)
      errs.newPwd = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    if (!pwdForm.confirm) errs.confirm = "Vui lòng xác nhận mật khẩu mới";
    else if (pwdForm.confirm !== pwdForm.newPwd)
      errs.confirm = "Xác nhận mật khẩu không khớp";
    setPwdErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleChangePassword() {
    if (!validatePassword()) return;
    setSavingPwd(true);
    setTimeout(() => {
      setSavingPwd(false);
      setPwdForm({ current: "", newPwd: "", confirm: "" });
      setPwdErrors({});
      toast.success("Đổi mật khẩu thành công");
    }, 700);
  }

  function handleLogout() {
    toast.success("Đã đăng xuất");
    navigate("/login");
  }

  const BADGE_CLS: Record<string, string> = {
    "Hoạt động": "bg-emerald-100 text-emerald-700",
    "Bị khóa": "bg-red-100 text-red-600",
    "Ngưng hoạt động": "bg-slate-100 text-slate-500",
  };

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">
            Hồ sơ cá nhân
          </h1>
        </div>
        <button
          onClick={() => setLogoutConfirm(true)}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2 rounded-lg transition-colors"
        >
          <i className="fa-solid fa-right-from-bracket text-xs" /> Đăng xuất
        </button>
      </header>

      <div className="w-full p-4 lg:p-6 space-y-5">
        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {MOCK_USER.hoTen.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-slate-900">
              {MOCK_USER.hoTen}
            </div>
            <div className="text-sm text-slate-500">
              {MOCK_USER.donVi} · {MOCK_USER.vaiTro}
            </div>
            <div className="mt-1.5 flex gap-2 flex-wrap">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_CLS[MOCK_USER.trangThai] ?? "bg-slate-100 text-slate-500"}`}
              >
                {MOCK_USER.trangThai}
              </span>
              <span className="text-xs text-slate-400">
                Tạo: {MOCK_USER.ngayTao}
              </span>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500"
            >
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
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "profile"
                ? "Thông tin cá nhân"
                : tab === "password"
                  ? "Đổi mật khẩu"
                  : `Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-user-circle text-blue-500" />
              Thông tin tài khoản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Họ và tên</label>
                <input
                  readOnly
                  value={MOCK_USER.hoTen}
                  className={inputReadonlyCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tên đăng nhập</label>
                <input
                  readOnly
                  value={MOCK_USER.tenDangNhap}
                  className={inputReadonlyCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  readOnly
                  value={MOCK_USER.email}
                  className={inputReadonlyCls}
                />
              </div>
              <div>
                <label className={labelCls}>Số điện thoại</label>
                <input
                  readOnly
                  value={MOCK_USER.sdt}
                  className={inputReadonlyCls}
                />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <input
                  readOnly
                  value={MOCK_USER.donVi}
                  className={inputReadonlyCls}
                />
              </div>
              <div>
                <label className={labelCls}>Vai trò</label>
                <input
                  readOnly
                  value={MOCK_USER.vaiTro}
                  className={inputReadonlyCls}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info" />
              Để thay đổi thông tin cá nhân, vui lòng liên hệ Quản trị viên.
            </p>
          </div>
        )}

        {/* Password tab */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-lock text-blue-500" />
              Đổi mật khẩu
            </h2>

            {/* Password strength guide */}
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
                    {field === "current"
                      ? "Mật khẩu hiện tại"
                      : field === "newPwd"
                        ? "Mật khẩu mới"
                        : "Xác nhận mật khẩu mới"}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd[field] ? "text" : "password"}
                      value={pwdForm[field]}
                      onChange={(e) => {
                        setPwdForm((f) => ({ ...f, [field]: e.target.value }));
                        setPwdErrors((err) => ({ ...err, [field]: "" }));
                      }}
                      className={`${pwdErrors[field] ? "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 pr-10" : `${inputCls} pr-10`}`}
                      placeholder={
                        field === "current"
                          ? "Nhập mật khẩu hiện tại"
                          : field === "newPwd"
                            ? "Nhập mật khẩu mới"
                            : "Nhập lại mật khẩu mới"
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPwd((s) => ({ ...s, [field]: !s[field] }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i
                        className={`fa-solid ${showPwd[field] ? "fa-eye-slash" : "fa-eye"} text-xs`}
                      />
                    </button>
                  </div>
                  {pwdErrors[field] && (
                    <p className="text-xs text-red-500 mt-1">
                      {pwdErrors[field]}
                    </p>
                  )}
                  {/* Strength bar for new password */}
                  {field === "newPwd" && pwdForm.newPwd && (
                    <div className="mt-1.5 flex items-center gap-2">
                      {[1, 2, 3, 4].map((i) => {
                        const len = pwdForm.newPwd.length;
                        const hasUpper = /[A-Z]/.test(pwdForm.newPwd);
                        const hasNum = /[0-9]/.test(pwdForm.newPwd);
                        const strength =
                          (len >= 8 ? 1 : 0) +
                          (hasUpper ? 1 : 0) +
                          (hasNum ? 1 : 0) +
                          (len >= 12 ? 1 : 0);
                        return (
                          <div
                            key={i}
                            className={`flex-1 h-1 rounded-full ${
                              i <= strength
                                ? strength <= 1
                                  ? "bg-red-400"
                                  : strength <= 2
                                    ? "bg-amber-400"
                                    : strength <= 3
                                      ? "bg-blue-500"
                                      : "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        );
                      })}
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {(() => {
                          const len = pwdForm.newPwd.length;
                          const hasUpper = /[A-Z]/.test(pwdForm.newPwd);
                          const hasNum = /[0-9]/.test(pwdForm.newPwd);
                          const s =
                            (len >= 8 ? 1 : 0) +
                            (hasUpper ? 1 : 0) +
                            (hasNum ? 1 : 0) +
                            (len >= 12 ? 1 : 0);
                          return s <= 1
                            ? "Yếu"
                            : s <= 2
                              ? "Trung bình"
                              : s <= 3
                                ? "Mạnh"
                                : "Rất mạnh";
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={savingPwd}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-60"
              >
                {savingPwd ? (
                  <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                ) : (
                  <i className="fa-solid fa-lock text-xs" />
                )}
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
                Thông báo{" "}
                {unreadCount > 0 && (
                  <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount} mới
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() =>
                    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
                  }
                  className="text-xs text-blue-600 hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() =>
                    setNotifs((prev) =>
                      prev.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    )
                  }
                  className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${n.color}`}
                  >
                    <i className={`fa-solid ${n.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>
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
                <h3 className="font-bold text-slate-800 text-sm">
                  Xác nhận đăng xuất
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bạn có chắc muốn đăng xuất khỏi hệ thống?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLogoutConfirm(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Ở lại
              </button>
              <button
                onClick={handleLogout}
                className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
