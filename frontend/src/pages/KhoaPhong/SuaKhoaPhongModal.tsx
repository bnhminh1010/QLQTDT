import { useForm } from "react-hook-form";
import type { Phong, PhongFormValues } from "./types";

type Props = {
  phong: Phong;
  existingIds: string[];
  existingNames: string[];
  onSave: (values: PhongFormValues) => void;
  onClose: () => void;
};

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 bg-red-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export function SuaKhoaPhongModal({
  phong,
  onSave,
  onClose,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PhongFormValues>({
    defaultValues: {
      ma: phong.id,
      ten: phong.ten,
      trangThai: phong.trangThai,
    },
  });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-pen-to-square text-amber-500" />
            Chỉnh sửa: {phong.ten}
          </h3>
          <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Mã khoa/phòng <span className="text-red-500">*</span></label>
              <input className={errors.ma ? inputErrCls : inputCls} disabled
                {...register("ma")} />
            </div>
            <div>
              <label className={labelCls}>Tên khoa / phòng <span className="text-red-500">*</span></label>
              <input className={errors.ten ? inputErrCls : inputCls} placeholder="VD: Khoa Ung Bướu"
                {...register("ten", {
                  required: "Vui lòng nhập tên",
                  validate: v => v.trim().length > 0 || "Tên không được để trống",
                  minLength: { value: 3, message: "Tên phải có ít nhất 3 ký tự" },
                  maxLength: { value: 100, message: "Tên tối đa 100 ký tự" },
                })} />
              {errors.ten && <p className="text-xs text-red-500 mt-1">{errors.ten.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="h-9 px-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-floppy-disk text-xs" /> Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
