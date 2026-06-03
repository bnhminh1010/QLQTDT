import { useForm } from "react-hook-form";

/* ─── Types ─────────────────────────────────────────── */
type LoaiPhong = "Khoa lâm sàng" | "Khoa cận lâm sàng" | "Phòng chức năng";

type FormValues = {
  ten: string;
  loai: LoaiPhong;
  truongKhoa: string;
  soNhanVien: number;
  email: string;
  sdt: string;
};

type Props = {
  onSave: (values: FormValues) => void;
  onClose: () => void;
};

/* ─── Constants ─────────────────────────────────────── */
const LOAI_OPTIONS: LoaiPhong[] = [
  "Khoa lâm sàng",
  "Khoa cận lâm sàng",
  "Phòng chức năng",
];

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 bg-red-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

/* ─── Component ─────────────────────────────────────── */
export function ThemKhoaPhongModal({ onSave, onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ten: "",
      loai: "Khoa lâm sàng",
      truongKhoa: "",
      soNhanVien: 1,
      email: "",
      sdt: "",
    },
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-building text-blue-500" />
            Thêm khoa / phòng mới
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {/* Tên khoa/phòng */}
          <div>
            <label className={labelCls}>
              Tên khoa / phòng <span className="text-red-500">*</span>
            </label>
            <input
              className={errors.ten ? inputErrCls : inputCls}
              placeholder="Ví dụ: Khoa Ung Bướu"
              {...register("ten", {
                required: "Vui lòng nhập tên khoa/phòng",
                validate: (v) => v.trim().length > 0 || "Tên không được chỉ là khoảng trắng",
                minLength: { value: 3, message: "Tên phải có ít nhất 3 ký tự" },
                maxLength: { value: 100, message: "Tên không được vượt quá 100 ký tự" },
              })}
            />
            {errors.ten && (
              <p className="text-xs text-red-500 mt-1">{errors.ten.message}</p>
            )}
          </div>

          {/* Loại */}
          <div>
            <label className={labelCls}>
              Loại <span className="text-red-500">*</span>
            </label>
            <select
              className={errors.loai ? inputErrCls : inputCls}
              {...register("loai", { required: "Vui lòng chọn loại" })}
            >
              {LOAI_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {errors.loai && (
              <p className="text-xs text-red-500 mt-1">{errors.loai.message}</p>
            )}
          </div>

          {/* Trưởng khoa + Số nhân viên */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Trưởng khoa / phòng <span className="text-red-500">*</span>
              </label>
              <input
                className={errors.truongKhoa ? inputErrCls : inputCls}
                placeholder="BS. Nguyễn Văn A"
                {...register("truongKhoa", {
                  required: "Vui lòng nhập tên trưởng khoa",
                  validate: (v) => v.trim().length > 0 || "Không được chỉ là khoảng trắng",
                  minLength: { value: 3, message: "Ít nhất 3 ký tự" },
                  maxLength: { value: 80, message: "Tối đa 80 ký tự" },
                })}
              />
              {errors.truongKhoa && (
                <p className="text-xs text-red-500 mt-1">{errors.truongKhoa.message}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>
                Số nhân viên <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                className={errors.soNhanVien ? inputErrCls : inputCls}
                {...register("soNhanVien", {
                  required: "Vui lòng nhập số nhân viên",
                  min: { value: 1, message: "Phải có ít nhất 1 nhân viên" },
                  max: { value: 500, message: "Không quá 500 nhân viên" },
                  valueAsNumber: true,
                })}
              />
              {errors.soNhanVien && (
                <p className="text-xs text-red-500 mt-1">{errors.soNhanVien.message}</p>
              )}
            </div>
          </div>

          {/* Email + SĐT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email liên hệ</label>
              <input
                type="email"
                className={errors.email ? inputErrCls : inputCls}
                placeholder="khoa@benhvien.vn"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Email không hợp lệ",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input
                type="tel"
                className={errors.sdt ? inputErrCls : inputCls}
                placeholder="028 3812 xxxx"
                {...register("sdt", {
                  pattern: {
                    value: /^[0-9\s\-+()]{7,20}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                })}
              />
              {errors.sdt && (
                <p className="text-xs text-red-500 mt-1">{errors.sdt.message}</p>
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
              Thêm khoa/phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
