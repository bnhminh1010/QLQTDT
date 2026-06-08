import { useForm } from "react-hook-form";
import type { User, UserEditFormValues } from "./types";
import { PHONG_OPTIONS, VAI_TRO_OPTIONS } from "./types";

type Props = {
  user: User;
  existingEmails: string[]; // excludes current user's email
  onSave: (values: UserEditFormValues) => void;
  onClose: () => void;
};

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 bg-red-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export function SuaNguoiDungModal({
  user,
  existingEmails,
  onSave,
  onClose,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserEditFormValues>({
    defaultValues: {
      hoTen: user.hoTen,
      email: user.email,
      sdt: user.sdt,
      phong: user.phong,
      vaiTro: user.vaiTro,
      trangThai: user.trangThai,
    },
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-user-pen text-amber-500" />
            Chỉnh sửa: {user.hoTen}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Username readonly info */}
        <div className="mb-4 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-sm text-slate-500">
          <i className="fa-solid fa-at text-slate-400 text-xs" />
          <span>Username:</span>
          <span className="font-semibold text-slate-700">{user.username}</span>
          <span className="ml-auto text-xs text-slate-400 italic">
            Không thể thay đổi
          </span>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {/* Họ tên */}
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
              <option value="Bị khóa">Bị khóa</option>
              <option value="Ngưng hoạt động">Ngưng hoạt động</option>
            </select>
            {errors.trangThai && (
              <p className="text-xs text-red-500 mt-1">
                {errors.trangThai.message}
              </p>
            )}
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
              className="h-9 px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-floppy-disk text-xs" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
