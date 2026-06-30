import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { useShowPassword } from "@/util/showPassword";
import { loginSchema } from "@/util/validate";
import { loginApi } from "@/services/api";

type LoginFormData = {
  username: string;
  password: string;
  rememberMe: boolean;
};

export default function Login() {
  const navigate = useNavigate();
  const { show: showPwd, toggle: togglePwd } = useShowPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: false },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await loginApi({
        tenDangNhap: data.username.trim(),
        matKhau: data.password,
      });
      toast.success("Đăng nhập thành công");
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Tên đăng nhập hoặc mật khẩu không đúng";
      toast.error(msg);
    }
  }

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg,#0f172a 0%,#1e3a8a 55%,#0e7490 100%)",
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
            <div className="w-17 h-17 rounded-md bg-white border-3 border-blue-950 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}bvungbuouLogo_no_text.png`}
                alt="BV Ung Bướu TP.HCM"
                className="w-15 h-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-white text-[23px] font-extrabold">
                Bệnh viện Ung Bướu TP.HCM
              </h1>
              <p className="text-cyan-200 text-[17px]">
                Hệ thống Quản lý Đấu thầu
              </p>
            </div>
          </div>

          <h2 className="text-[34px] font-extrabold text-white leading-tight mb-4">
            Quản lý đấu thầu
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              minh bạch &amp; hiệu quả
            </span>
          </h2>
          <p className="text-slate-400 text-[14.5px] leading-[1.7] mb-10">
            Nền tảng số hóa toàn bộ quy trình mua sắm – từ lập hồ sơ đề xuất đến
            ký kết hợp đồng – theo đúng Luật Đấu thầu 22/2023.
          </p>

          <div className="flex flex-wrap gap-2 mb-10">
            {[
              ["fa-check", "Luật ĐT 22/2023"],
              ["fa-check", "NĐ 214/2025"],
              ["fa-check", "TT 79 & 80"],
              ["fa-shield-halved", "Bảo mật OWASP"],
            ].map(([icon, label]) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-slate-300 text-xs bg-white/[0.07]"
              >
                <i className={`fa-solid ${icon} text-blue-400 text-[10px]`} />
                {label}
              </div>
            ))}
          </div>

          <div className="flex border-t border-white/10 pt-7">
            {[
              ["120+", "Gói thầu"],
              ["7", "Nhóm người dùng"],
              ["99.5%", "Uptime"],
            ].map(([val, lbl]) => (
              <div
                key={lbl}
                className="flex-1 text-center px-4 border-r border-white/10 last:border-r-0"
              >
                <span className="block text-white text-[22px] font-extrabold">
                  {val}
                </span>
                <span className="block text-slate-500 text-[11.5px] mt-0.5">
                  {lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 lg:max-w-[520px] flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[420px]">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
            <p className="text-slate-500 text-sm mt-1">
              Nhập tài khoản được cấp bởi bộ phận IT để tiếp tục
            </p>
          </div>

          <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-6 text-sm text-slate-700">
            <i className="fa-solid fa-circle-info text-blue-500 mt-0.5 shrink-0" />
            <span>
              Sử dụng tài khoản được cấp bởi Phòng Công nghệ thông tin. Liên hệ{" "}
              <strong>ext. 1234</strong> nếu chưa có tài khoản.
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  <i className="fa-solid fa-user" />
                </span>
                <input
                  {...register("username")}
                  type="text"
                  autoComplete="username"
                  placeholder="username hoặc email công vụ"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  {...register("password")}
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  {...register("rememberMe")}
                  type="checkbox"
                  className="rounded"
                />{" "}
                Ghi nhớ đăng nhập
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-right-to-bracket" /> Đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
