import { useState } from "react";
import { useForm } from "react-hook-form";
import type { UserAddFormValues } from "./types";
import { PHONG_OPTIONS, VAI_TRO_OPTIONS } from "./types";

type Props = {
  existingUsernames: string[];
  existingEmails: string[];
  onSave: (values: UserAddFormValues) => void;
  onClose: () => void;
};

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 bg-red-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export function ThemNguoiDungModal({
  existingUsernames,
  existingEmails,
  onSave,
  onClose,
}: Props) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserAddFormValues>({
    defaultValues: {
      hoTen: "",
      username: "",
      email: "",
      sdt: "",
      phong: "",
      vaiTro: "Nhân viên",
      trangThai: "Hoạt động",
      matKhau: "",
      xacNhanMatKhau: "",
    },
  });

  const matKhauValue = watch("matKhau");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-user-plus text-blue-500" />
            Thêm người dùng mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {/* Họ tên + Username */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                className={errors.hoTen ? inputErrCls : inputCls}
                placeholder="Nguyễn Văn A"
                {...register("hoTen", {
                  required: "Vui lòng nhập họ tên",
                  validate: {
                    noBlank: (v) =>
                      v.trim().length > 0 ||
                      "Họ tên không được chỉ là khoảng trắng",
                    notOnlyNumbers: (v) =>
                      !/^\d+$/.test(v.trim()) || "Họ tên không được toàn là số",
                    hasLetter: (v) =>
                      /[A-Za-zÀ-ỹ]/.test(v.trim()) ||
                      "Họ tên phải chứa ít nhất một chữ cái",
                  },
                  minLength: {
                    value: 2,
                    message: "Họ tên phải có ít nhất 2 ký tự",
                  },
                  maxLength: { value: 100, message: "Họ tên tối đa 100 ký tự" },
                })}
              />
              {errors.hoTen && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.hoTen.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Username <span className="text-red-500">*</span>
              </label>
              <input
                className={errors.username ? inputErrCls : inputCls}
                placeholder="nguyen.van.a"
                {...register("username", {
                  required: "Vui lòng nhập username",
                  validate: {
                    noSpace: (v) =>
                      !/\s/.test(v) || "Username không được chứa khoảng trắng",
                    validChars: (v) =>
                      /^[a-zA-Z0-9._]+$/.test(v) ||
                      "Username chỉ được chứa chữ không dấu, số, dấu chấm hoặc gạch dưới",
                    unique: (v) =>
                      !existingUsernames.includes(v.toLowerCase()) ||
                      "Username đã tồn tại trong hệ thống",
                  },
                  minLength: {
                    value: 3,
                    message: "Username phải có ít nhất 3 ký tự",
                  },
                  maxLength: { value: 30, message: "Username tối đa 30 ký tự" },
                })}
              />
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>
          </div>

          {/* Email + SĐT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className={errors.email ? inputErrCls : inputCls}
                placeholder="example@benhvien.vn"
                {...register("email", {
                  required: "Vui lòng nhập email",
                  validate: {
                    format: (v) =>
                      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ||
                      "Email không đúng định dạng",
                    unique: (v) =>
                      !existingEmails.includes(v.toLowerCase()) ||
                      "Email đã được sử dụng trong hệ thống",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className={errors.sdt ? inputErrCls : inputCls}
                placeholder="0912345678"
                {...register("sdt", {
                  required: "Vui lòng nhập số điện thoại",
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: "Số điện thoại phải là 10–11 chữ số",
                  },
                })}
              />
              {errors.sdt && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.sdt.message}
                </p>
              )}
            </div>
          </div>

          {/* Khoa/phòng + Vai trò */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Khoa/phòng <span className="text-red-500">*</span>
              </label>
              <select
                className={errors.phong ? inputErrCls : inputCls}
                {...register("phong", { required: "Vui lòng chọn khoa/phòng" })}
              >
                <option value="">-- Chọn khoa/phòng --</option>
                {PHONG_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.phong && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.phong.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                className={errors.vaiTro ? inputErrCls : inputCls}
                {...register("vaiTro", { required: "Vui lòng chọn vai trò" })}
              >
                {VAI_TRO_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              {errors.vaiTro && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.vaiTro.message}
                </p>
              )}
            </div>
          </div>

          {/* Trạng thái */}
          <div>
            <label className={labelCls}>
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              className={errors.trangThai ? inputErrCls : inputCls}
              {...register("trangThai", {
                required: "Vui lòng chọn trạng thái",
              })}
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Chờ duyệt">Chờ duyệt</option>
              <option value="Bị khóa">Bị khóa</option>
              <option value="Ngưng hoạt động">Ngưng hoạt động</option>
            </select>
            {errors.trangThai && (
              <p className="text-xs text-red-500 mt-1">
                {errors.trangThai.message}
              </p>
            )}
          </div>

          {/* Mật khẩu + Xác nhận */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className={`${errors.matKhau ? inputErrCls : inputCls} pr-10`}
                  placeholder="••••••••"
                  {...register("matKhau", {
                    required: "Vui lòng nhập mật khẩu",
                    validate: {
                      noBlank: (v) =>
                        v.trim().length > 0 ||
                        "Mật khẩu không được chỉ là khoảng trắng",
                      hasUpper: (v) =>
                        /[A-Z]/.test(v) || "Mật khẩu phải có ít nhất 1 chữ hoa",
                      hasLower: (v) =>
                        /[a-z]/.test(v) ||
                        "Mật khẩu phải có ít nhất 1 chữ thường",
                      hasNumber: (v) =>
                        /[0-9]/.test(v) || "Mật khẩu phải có ít nhất 1 chữ số",
                      hasSpecial: (v) =>
                        /[^A-Za-z0-9]/.test(v) ||
                        "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
                    },
                    minLength: {
                      value: 8,
                      message: "Mật khẩu phải có ít nhất 8 ký tự",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i
                    className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"} text-xs`}
                  />
                </button>
              </div>
              {errors.matKhau && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.matKhau.message}
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? "text" : "password"}
                  className={`${errors.xacNhanMatKhau ? inputErrCls : inputCls} pr-10`}
                  placeholder="••••••••"
                  {...register("xacNhanMatKhau", {
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (v) =>
                      v === matKhauValue || "Mật khẩu xác nhận không khớp",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i
                    className={`fa-solid ${showConfirmPwd ? "fa-eye-slash" : "fa-eye"} text-xs`}
                  />
                </button>
              </div>
              {errors.xacNhanMatKhau && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.xacNhanMatKhau.message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-plus text-xs" />
              Thêm người dùng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
