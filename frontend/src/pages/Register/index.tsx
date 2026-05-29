import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useShowPassword } from "@/util/showPassword";
import { registerSchema } from "@/util/validate";

type RegisterFormData = {
  username: string;
  ho: string;
  ten: string;
  email: string;
  phone: string;
  maNhanVien: string;
  phong: string;
  vaiTro: string;
  lyDo: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

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
        Yêu cầu tạo
        <br />
        <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          tài khoản mới
        </span>
      </h2>
      <p className="text-slate-400 text-[14.5px] leading-[1.7] mb-10">
        Điền đầy đủ thông tin. Phòng CNTT sẽ xét duyệt và kích hoạt tài khoản
        trong vòng 1–2 ngày làm việc.
      </p>
      <ul className="space-y-5">
        {[
          [
            "1",
            "Gửi yêu cầu",
            "Điền thông tin cá nhân & chức vụ trong bệnh viện",
          ],
          [
            "2",
            "Phê duyệt IT",
            "Phòng CNTT xác minh và phân quyền phù hợp với vai trò",
          ],
          [
            "3",
            "Nhận thông báo",
            "Email kích hoạt gửi về hòm thư công vụ của bạn",
          ],
        ].map(([num, title, desc]) => (
          <li key={num} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
              {num}
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">{title}</h4>
              <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

type InputFieldProps = {
  label: string;
  required?: boolean;
  icon: string;
  children: ReactNode;
  error?: string;
};
type DividerProps = { label: string };

function InputField({
  label,
  required,
  icon,
  children,
  error,
}: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
          <i className={`fa-solid ${icon}`} />
        </span>
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { show: showPwd1, toggle: togglePwd1 } = useShowPassword();
  const { show: showPwd2, toggle: togglePwd2 } = useShowPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  function onSubmit(_data: RegisterFormData) {
    // TODO: gửi yêu cầu tạo tài khoản
  }

  const inputCls =
    "w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const selectCls = `${inputCls} appearance-none pr-8`;

  return (
    <div className="flex min-h-screen overflow-hidden">
      <LeftPanel />

      {/* RIGHT */}
      <div className="flex-1 lg:max-w-[580px] flex items-start justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-[480px] py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Tạo tài khoản</h2>
            <p className="text-slate-500 text-sm mt-1">
              Điền đầy đủ thông tin để gửi yêu cầu đến Phòng CNTT
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-6">
            {[
              ["1", "Cá nhân", true],
              ["2", "Tài khoản", false],
              ["3", "Xác nhận", false],
            ].map(([n, lbl, active], i) => (
              <div key={n as string} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}
                  >
                    {n}
                  </div>
                  <span
                    className={`text-xs ${active ? "text-slate-700 font-medium" : "text-slate-400"}`}
                  >
                    {lbl}
                  </span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-slate-200 mx-2" />}
              </div>
            ))}
          </div>

          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6 text-sm text-slate-700">
            <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 shrink-0" />
            <span>
              Chỉ dành cho <strong>cán bộ, nhân viên BV Ung Bướu TP.HCM</strong>
              . Tài khoản giả mạo sẽ bị xử lý theo quy định.
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Divider label="Thông tin cá nhân" />

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Họ và tên đệm"
                required
                icon="fa-user"
                error={errors.ho?.message}
              >
                <input
                  {...register("ho")}
                  type="text"
                  placeholder="Nguyễn Văn"
                  className={inputCls}
                />
              </InputField>
              <InputField
                label="Tên"
                required
                icon="fa-user"
                error={errors.ten?.message}
              >
                <input
                  {...register("ten")}
                  type="text"
                  placeholder="An"
                  className={inputCls}
                />
              </InputField>
            </div>

            <InputField
              label="Email công vụ"
              required
              icon="fa-envelope"
              error={errors.email?.message}
            >
              <input
                {...register("email")}
                type="email"
                placeholder="tennv@bvungbuou.vn"
                className={inputCls}
              />
            </InputField>

            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Số điện thoại nội bộ"
                icon="fa-phone"
                error={errors.phone?.message}
              >
                <input
                  {...register("phone")}
                  type="text"
                  placeholder="Ext. 1234"
                  className={inputCls}
                />
              </InputField>
              <InputField
                label="Mã nhân viên"
                required
                icon="fa-id-badge"
                error={errors.maNhanVien?.message}
              >
                <input
                  {...register("maNhanVien")}
                  type="text"
                  placeholder="NV00001"
                  className={inputCls}
                />
              </InputField>
            </div>

            <Divider label="Chức vụ &amp; Phân quyền" />

            <InputField
              label="Phòng / Khoa"
              required
              icon="fa-building"
              error={errors.phong?.message}
            >
              <select
                {...register("phong")}
                className={selectCls}
                defaultValue=""
              >
                <option value="" disabled>
                  -- Chọn phòng/khoa --
                </option>
                <option>Phòng Kế hoạch – Tổng hợp</option>
                <option>Ban Chủ nhiệm</option>
                <option>Phòng Đấu thầu</option>
                <option>Phòng Kế toán – Tài chính</option>
                <option>Ban Giám đốc</option>
                <option>Phòng Công nghệ thông tin</option>
                <option>Khoa lâm sàng</option>
                <option>Khác</option>
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none">
                <i className="fa-solid fa-chevron-down" />
              </span>
            </InputField>

            <InputField
              label="Vai trò trong hệ thống"
              required
              icon="fa-user-gear"
              error={errors.vaiTro?.message}
            >
              <select
                {...register("vaiTro")}
                className={selectCls}
                defaultValue=""
              >
                <option value="" disabled>
                  -- Chọn vai trò --
                </option>
                <option>K/P – Khởi tạo hồ sơ đề xuất</option>
                <option>BCN – Ban chủ nhiệm duyệt</option>
                <option>Phòng ĐT – Xử lý đấu thầu</option>
                <option>Kế toán – Thẩm định tài chính</option>
                <option>Viện trưởng – Phê duyệt cuối</option>
                <option>Nhà thầu – Tham dự thầu</option>
              </select>
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none">
                <i className="fa-solid fa-chevron-down" />
              </span>
            </InputField>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Lý do yêu cầu
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 text-sm pointer-events-none">
                  <i className="fa-solid fa-comment-dots" />
                </span>
                <textarea
                  {...register("lyDo")}
                  rows={3}
                  placeholder="Mô tả ngắn gọn lý do bạn cần tài khoản..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <Divider label="Thông tin đăng nhập" />

            <InputField
              label="Tên đăng nhập"
              required
              icon="fa-at"
              error={errors.username?.message}
            >
              <input
                {...register("username")}
                type="text"
                placeholder="vd: nguyen.van.a hoặc nva_01"
                className={inputCls}
              />
            </InputField>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  {...register("password")}
                  type={showPwd1 ? "text" : "password"}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={togglePwd1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i
                    className={`fa-regular ${showPwd1 ? "fa-eye-slash" : "fa-eye"}`}
                  />
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  {...register("confirmPassword")}
                  type={showPwd2 ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={togglePwd2}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i
                    className={`fa-regular ${showPwd2 ? "fa-eye-slash" : "fa-eye"}`}
                  />
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  {...register("terms")}
                  type="checkbox"
                  className="mt-0.5 rounded shrink-0"
                />
                <span>
                  Tôi đã đọc và đồng ý với{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Điều khoản sử dụng
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Chính sách bảo mật
                  </a>{" "}
                  của hệ thống
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.terms.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-paper-plane" /> Gửi yêu cầu tạo tài
              khoản
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-slate-200" />
      <span
        className="text-xs text-slate-400 font-medium"
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
