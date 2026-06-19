import { useForm } from "react-hook-form";
import { SelectField } from "@/components/ui/select";
import type { Phong, LoaiPhong, PhongFormValues } from "./types";

/* ─── Constants ─────────────────────────────────────── */
const LOAI_OPTIONS: LoaiPhong[] = [
  "Khoa lâm sàng",
  "Khoa cận lâm sàng",
  "Phòng chức năng",
];

type Props = {
  phong: Phong;
  existingIds: string[]; // excludes current phong.id — passed from parent
  existingNames: string[]; // for donViCha dropdown
  onSave: (values: PhongFormValues) => void;
  onClose: () => void;
};

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 bg-red-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

/* ─── Component ─────────────────────────────────────── */
export function SuaKhoaPhongModal({
  phong,
  existingIds,
  existingNames,
  onSave,
  onClose,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PhongFormValues>({
    defaultValues: {
      ma: phong.id,
      ten: phong.ten,
      loai: phong.loai,
      truongKhoa: phong.truongKhoa,
      soNhanVien: phong.soNhanVien,
      email: phong.email,
      sdt: phong.sdt,
      trangThai: phong.trangThai,
      donViCha: phong.donViCha,
      moTa: phong.moTa,
    },
  });
  const watched = watch();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-amber-500" />
            Chỉnh sửa: {phong.ten}
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
          {/* Mã + Tên */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Mã khoa/phòng <span className="text-red-500">*</span>
              </label>
              <input
                className={errors.ma ? inputErrCls : inputCls}
                placeholder="VD: KUB"
                {...register("ma", {
                  required: "Vui lòng nhập mã khoa/phòng",
                  validate: {
                    noBlank: (v) =>
                      v.trim().length > 0 ||
                      "Mã không được chỉ là khoảng trắng",
                    noSpecial: (v) =>
                      /^[A-Za-z0-9_-]+$/.test(v.trim()) ||
                      "Mã chỉ được chứa chữ cái, số, dấu gạch dưới hoặc gạch ngang",
                    unique: (v) =>
                      !existingIds.includes(v.trim().toUpperCase()) ||
                      "Mã này đã tồn tại trong hệ thống",
                  },
                  maxLength: { value: 20, message: "Mã tối đa 20 ký tự" },
                })}
              />
              {errors.ma && (
                <p className="text-xs text-red-500 mt-1">{errors.ma.message}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                Tên khoa / phòng <span className="text-red-500">*</span>
              </label>
              <input
                className={errors.ten ? inputErrCls : inputCls}
                placeholder="Ví dụ: Khoa Ung Bướu"
                {...register("ten", {
                  required: "Vui lòng nhập tên khoa/phòng",
                  validate: (v) =>
                    v.trim().length > 0 || "Tên không được chỉ là khoảng trắng",
                  minLength: {
                    value: 3,
                    message: "Tên phải có ít nhất 3 ký tự",
                  },
                  maxLength: {
                    value: 100,
                    message: "Tên không được vượt quá 100 ký tự",
                  },
                })}
              />
              {errors.ten && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.ten.message}
                </p>
              )}
            </div>
          </div>

          {/* Loại */}
          <div>
            <div>
              <label className={labelCls}>
                Loại <span className="text-red-500">*</span>
              </label>
              <SelectField
                value={watched.loai || "__empty"}
                onValueChange={(value) =>
                  setValue("loai", value === "__empty" ? ("" as LoaiPhong) : (value as LoaiPhong), {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                options={[
                  { value: "__empty", label: "-- Chọn loại khoa/phòng --" },
                  ...LOAI_OPTIONS.map((l) => ({ value: l, label: l })),
                ]}
                triggerClassName={errors.loai ? inputErrCls : inputCls}
              />
              {errors.loai && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.loai.message}
                </p>
              )}
            </div>
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
                  required: "Vui lòng nhập tên trưởng khoa/phòng",
                  validate: {
                    noBlank: (v) =>
                      v.trim().length > 0 || "Không được chỉ là khoảng trắng",
                    notOnlyNumbers: (v) =>
                      !/^\d+$/.test(v.trim()) || "Tên không được toàn là số",
                    notOnlySpecial: (v) =>
                      /[A-Za-zÀ-ỹ]/.test(v.trim()) ||
                      "Tên phải chứa ít nhất một chữ cái",
                  },
                  minLength: {
                    value: 3,
                    message: "Tên phải có ít nhất 3 ký tự",
                  },
                  maxLength: {
                    value: 80,
                    message: "Tên không được vượt quá 80 ký tự",
                  },
                })}
              />
              {errors.truongKhoa && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.truongKhoa.message}
                </p>
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
                  min: {
                    value: 1,
                    message: "Số nhân viên phải lớn hơn hoặc bằng 1",
                  },
                  max: {
                    value: 500,
                    message: "Số nhân viên không được vượt quá 500",
                  },
                  valueAsNumber: true,
                })}
              />
              {errors.soNhanVien && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.soNhanVien.message}
                </p>
              )}
            </div>
          </div>

          {/* Đơn vị cha */}
          <div>
            <label className={labelCls}>Đơn vị cha</label>
            <SelectField
              value={watched.donViCha || "__none"}
              onValueChange={(value) =>
                setValue("donViCha", value === "__none" ? "" : value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={[
                { value: "__none", label: "-- Không có đơn vị cha --" },
                ...existingNames
                  .filter((n) => n !== phong.ten)
                  .map((n) => ({ value: n, label: n })),
              ]}
              triggerClassName={inputCls}
            />
          </div>

          {/* Email + SĐT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email liên hệ</label>
              <input
                className={errors.email ? inputErrCls : inputCls}
                placeholder="khoa@benhvien.vn"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                    message: "Email không đúng định dạng",
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
              <label className={labelCls}>Số điện thoại</label>
              <input
                type="tel"
                className={errors.sdt ? inputErrCls : inputCls}
                placeholder="028 3812 xxxx"
                {...register("sdt", {
                  pattern: {
                    value: /^[0-9]{7,15}$|^[0-9][0-9\s\-]{5,18}[0-9]$/,
                    message: "Số điện thoại không hợp lệ",
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

          {/* Mô tả */}
          <div>
            <label className={labelCls}>Mô tả</label>
            <textarea
              rows={3}
              className={errors.moTa ? inputErrCls : inputCls}
              placeholder="Ghi chú thêm về khoa/phòng (không bắt buộc)"
              {...register("moTa", {
                maxLength: { value: 300, message: "Mô tả tối đa 300 ký tự" },
              })}
            />
            {errors.moTa && (
              <p className="text-xs text-red-500 mt-1">{errors.moTa.message}</p>
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
