import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShowPassword } from "@/util/showPassword";

const LeftPanel = () => (
  <div
    className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden"
    style={{
      background: "linear-gradient(145deg,#0f172a 0%,#1e3a8a 55%,#0e7490 100%)",
    }}
  >
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at 70% 30%,rgba(37,99,235,.25) 0%,transparent 65%),radial-gradient(ellipse at 20% 80%,rgba(6,182,212,.2) 0%,transparent 60%)",
      }}
    />
    <div className="relative z-10 max-w-sm w-full">
      <div className="flex items-center gap-3.5 mb-12">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <i className="fa-solid fa-gavel text-white text-xl" />
        </div>
        <div>
          <h1 className="text-white text-[17px] font-extrabold">
            BV Ung Bướu TP.HCM
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Hệ thống Quản lý Đấu thầu
          </p>
        </div>
      </div>
      <h2 className="text-[34px] font-extrabold text-white leading-tight mb-4">
        Khôi phục
        <br />
        <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          quyền truy cập
        </span>
      </h2>
      <p className="text-slate-400 text-[14.5px] leading-[1.7] mb-10">
        Xác minh danh tính qua một trong các phương thức bên dưới để đặt lại mật
        khẩu an toàn.
      </p>
      <div className="space-y-4">
        {[
          [
            "fa-envelope",
            "blue",
            "Email công vụ",
            "Mã OTP gửi đến email nội bộ @bvungbuou.vn",
          ],
          [
            "fa-phone",
            "green",
            "SMS nội bộ",
            "Gửi đến số điện thoại đã đăng ký trong hồ sơ nhân viên",
          ],
          [
            "fa-headset",
            "orange",
            "Liên hệ IT",
            "Gọi ext. 1234 hoặc email cntt@bvungbuou.vn",
          ],
        ].map(([icon, color, title, desc]) => (
          <div key={title} className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color === "blue" ? "bg-blue-600/20 text-blue-400" : color === "green" ? "bg-emerald-600/20 text-emerald-400" : "bg-orange-600/20 text-orange-400"}`}
            >
              <i className={`fa-solid ${icon}`} />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">{title}</h4>
              <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

type ProgressDotsProps = { current: number };

const ProgressDots = ({ current }: ProgressDotsProps) => (
  <div className="flex items-center justify-center gap-2 mb-6">
    {[1, 2, 3].map((n) => (
      <div
        key={n}
        className={`rounded-full transition-all ${n < current ? "w-5 h-5 bg-emerald-500 flex items-center justify-center" : n === current ? "w-5 h-5 bg-blue-600" : "w-2 h-2 bg-slate-200"}`}
      >
        {n < current && (
          <i className="fa-solid fa-check text-white text-[8px]" />
        )}
      </div>
    ))}
  </div>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [view, setView] = useState(1);
  const [method, setMethod] = useState("email");
  const { show: showPwd, toggle: togglePwd } = useShowPassword();
  const { show: showConf, toggle: toggleConf } = useShowPassword();
  const [timeLeft, setTimeLeft] = useState(587);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (view === 2) {
      setTimeLeft(587);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current ?? undefined);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current ?? undefined);
    }
    return () => clearInterval(timerRef.current ?? undefined);
  }, [view]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const inputCls =
    "w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const btnPrimary =
    "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors";
  const btnGhost =
    "w-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors";

  return (
    <div className="flex min-h-screen overflow-hidden">
      <LeftPanel />

      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-[420px] py-4">
          {/* VIEW 1 */}
          {view === 1 && (
            <div>
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
              >
                <i className="fa-solid fa-arrow-left text-xs" /> Quay lại đăng
                nhập
              </Link>
              <ProgressDots current={1} />
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-key text-blue-600 text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Quên mật khẩu?
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Nhập tên đăng nhập hoặc email công vụ của bạn
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tên đăng nhập hoặc email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                    <i className="fa-solid fa-user" />
                  </span>
                  <input
                    type="text"
                    placeholder="username hoặc email@bvungbuou.vn"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phương thức nhận mã
                </label>
                <div className="space-y-2">
                  {[
                    [
                      "email",
                      "fa-envelope",
                      "blue",
                      "Email công vụ",
                      "Gửi OTP đến ••••@bvungbuou.vn",
                    ],
                    [
                      "sms",
                      "fa-phone",
                      "green",
                      "SMS nội bộ",
                      "Gửi OTP đến SĐT ••• ••• 34",
                    ],
                  ].map(([val, icon, color, title, desc]) => (
                    <label
                      key={val}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${method === val ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={val}
                        checked={method === val}
                        onChange={() => setMethod(val)}
                        className="sr-only"
                      />
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color === "blue" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}
                      >
                        <i className={`fa-solid ${icon} text-sm`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">
                          {title}
                        </div>
                        <div className="text-xs text-slate-500">{desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${method === val ? "border-blue-600" : "border-slate-300"}`}
                      >
                        {method === val && (
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView(2)}
                className={btnPrimary}
              >
                <i className="fa-solid fa-paper-plane" /> Gửi mã xác minh
              </button>
              <button type="button" className={`${btnGhost} mt-2`}>
                <i className="fa-solid fa-headset" /> Liên hệ Phòng CNTT
              </button>
            </div>
          )}

          {/* VIEW 2 */}
          {view === 2 && (
            <div>
              <button
                onClick={() => setView(1)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
              >
                <i className="fa-solid fa-arrow-left text-xs" /> Thay đổi phương
                thức
              </button>
              <ProgressDots current={2} />
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-shield-halved text-orange-500 text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Nhập mã xác minh
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Mã 6 chữ số đã được gửi đến <strong>••••@bvungbuou.vn</strong>
                </p>
              </div>

              <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-sm text-slate-700">
                <i className="fa-solid fa-circle-info text-blue-500 mt-0.5 shrink-0" />
                <span>
                  Mã có hiệu lực trong <strong>10 phút</strong>. Kiểm tra hòm
                  thư spam nếu không nhận được.
                </span>
              </div>

              <div className="flex justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <input
                    key={n}
                    type="text"
                    maxLength={1}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50"
                  />
                ))}
              </div>

              <div className="text-center text-sm text-slate-500 mb-1">
                Mã hết hạn sau{" "}
                <strong className="text-slate-800">{fmtTime(timeLeft)}</strong>
              </div>
              <div className="text-center text-sm text-slate-500 mb-5">
                Chưa nhận được?{" "}
                <button
                  onClick={() => setTimeLeft(587)}
                  className="text-blue-600 hover:underline"
                >
                  Gửi lại mã
                </button>
              </div>

              <button
                type="button"
                onClick={() => setView(3)}
                className={btnPrimary}
              >
                <i className="fa-solid fa-check" /> Xác nhận mã
              </button>
              <button
                type="button"
                onClick={() => setView(1)}
                className={`${btnGhost} mt-2`}
              >
                <i className="fa-solid fa-arrow-left" /> Quay lại
              </button>
            </div>
          )}

          {/* VIEW 3 */}
          {view === 3 && (
            <div>
              <ProgressDots current={3} />
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-lock-open text-blue-600 text-2xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Đặt mật khẩu mới
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Tạo mật khẩu mạnh, khác với mật khẩu đã dùng trước
                </p>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                      <i className="fa-solid fa-lock" />
                    </span>
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Tối thiểu 8 ký tự"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={togglePwd}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i
                        className={`fa-regular ${showPwd ? "fa-eye-slash" : "fa-eye"}`}
                      />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                      <i className="fa-solid fa-lock" />
                    </span>
                    <input
                      type={showConf ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={toggleConf}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i
                        className={`fa-regular ${showConf ? "fa-eye-slash" : "fa-eye"}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView(4)}
                className={btnPrimary}
              >
                <i className="fa-solid fa-rotate" /> Đặt lại mật khẩu
              </button>
            </div>
          )}

          {/* VIEW 4 */}
          {view === 4 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <i className="fa-solid fa-check text-emerald-600 text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Đặt lại thành công!
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại để
                tiếp tục sử dụng hệ thống.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-2 text-left mb-6">
                {[
                  ["fa-shield-check", "Mật khẩu cũ đã bị vô hiệu hóa"],
                  ["fa-clock", "Phiên đăng nhập cũ đã được đăng xuất"],
                  ["fa-bell", "Email xác nhận đã được gửi đến hòm thư"],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-2">
                    <i className={`fa-solid ${icon} text-emerald-500`} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className={btnPrimary}
              >
                <i className="fa-solid fa-right-to-bracket" /> Đến trang đăng
                nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
