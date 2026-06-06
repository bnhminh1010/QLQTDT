import { useForm } from "react-hook-form";

const BADGE_OPTIONS = [
  { label: "Xanh dương", cls: "bg-blue-100 text-blue-700" },
  { label: "Xanh lá", cls: "bg-emerald-100 text-emerald-700" },
  { label: "Vàng", cls: "bg-amber-100 text-amber-700" },
  { label: "Tím", cls: "bg-purple-100 text-purple-700" },
];

type FormValues = {
  hinhThuc: string;
  badge: string;
};

type Props = {
  onSave: (values: FormValues) => void;
  onClose: () => void;
};

export function AddModal({ onSave, onClose }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { hinhThuc: "", badge: BADGE_OPTIONS[0].cls },
  });

  const selectedBadge = watch("badge");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[420px] p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Thêm danh mục mới
        </h2>

        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
          {/* Tên hình thức */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">
              Tên hình thức đấu thầu <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              placeholder="VD: Chỉ định thầu rút gọn"
              {...register("hinhThuc", {
                required: "Vui lòng nhập tên hình thức",
                validate: (v) =>
                  v.trim().length > 0 || "Tên không được chỉ là khoảng trắng",
                minLength: { value: 3, message: "Tên phải có ít nhất 3 ký tự" },
                maxLength: {
                  value: 100,
                  message: "Tên không được vượt quá 100 ký tự",
                },
              })}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.hinhThuc
                  ? "border-red-400 bg-red-50"
                  : "border-slate-200"
              }`}
            />
            {errors.hinhThuc && (
              <p className="text-xs text-red-500 mt-1">
                {errors.hinhThuc.message}
              </p>
            )}
          </div>

          {/* Màu nhãn */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">
              Màu nhãn
            </label>
            <input type="hidden" {...register("badge")} />
            <div className="flex gap-2 flex-wrap">
              {BADGE_OPTIONS.map((b) => (
                <button
                  key={b.cls}
                  type="button"
                  onClick={() =>
                    setValue("badge", b.cls, { shouldDirty: true })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${b.cls} ${
                    selectedBadge === b.cls
                      ? "border-slate-500 scale-105"
                      : "border-transparent"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              Thêm danh mục
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
