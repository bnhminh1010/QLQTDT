import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const BADGE_OPTIONS = [
  { label: "Xanh dương", cls: "bg-blue-100 text-blue-700" },
  { label: "Xanh lá", cls: "bg-emerald-100 text-emerald-700" },
  { label: "Vàng", cls: "bg-amber-100 text-amber-700" },
  { label: "Tím", cls: "bg-purple-100 text-purple-700" },
];

type FormValues = {
  id: string;
  hinhThuc: string;
  badge: string;
};

type Props = {
  defaultValues: FormValues;
  existingItems: { id: string; hinhThuc: string }[];
  onSave: (values: FormValues) => void;
  onClose: () => void;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function EditModal({
  defaultValues,
  existingItems,
  onSave,
  onClose,
}: Props) {
  const [confirmClose, setConfirmClose] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({ defaultValues });

  // Đồng bộ khi item được chỉnh sửa thay đổi
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues.id, defaultValues.hinhThuc, defaultValues.badge, reset]);

  const selectedBadge = watch("badge");
  const previewName = watch("hinhThuc").trim() || defaultValues.hinhThuc;

  function requestClose() {
    if (isDirty) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-[420px] p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Chỉnh sửa danh mục
        </h2>

        <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-4">
          {/* Mã hình thức */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">
              Mã hình thức đấu thầu <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              placeholder="VD: CDT-RG, CHCT, DTRR"
              {...register("id", {
                required: "Vui lòng nhập mã hình thức đấu thầu",
                validate: {
                  notBlank: (v) =>
                    v.trim().length > 0 ||
                    "Mã hình thức không được chỉ là khoảng trắng",
                  duplicate: (v) =>
                    !existingItems.some(
                      (item) =>
                        normalize(item.id) !== normalize(defaultValues.id) &&
                        normalize(item.id) === normalize(v),
                    ) || "Mã hình thức đấu thầu đã tồn tại.",
                },
              })}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.id ? "border-red-400 bg-red-50" : "border-slate-200"
              }`}
            />
            {errors.id && (
              <p className="text-xs text-red-500 mt-1">{errors.id.message}</p>
            )}
          </div>

          {/* Tên hình thức */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">
              Tên hình thức đấu thầu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Chỉ định thầu rút gọn"
              {...register("hinhThuc", {
                required: "Vui lòng nhập tên hình thức",
                validate: {
                  notBlank: (v) =>
                    v.trim().length > 0 ||
                    "Tên không được chỉ là khoảng trắng",
                  duplicate: (v) =>
                    !existingItems.some(
                      (item) =>
                        normalize(item.id) !== normalize(defaultValues.id) &&
                        normalize(item.hinhThuc) === normalize(v),
                    ) || "Tên hình thức đấu thầu đã tồn tại.",
                },
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
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-[11px] text-slate-400 mb-1">Preview màu nhãn</p>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${selectedBadge}`}
              >
                {previewName}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">
              Bạn có muốn hủy thay đổi không?
            </h3>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                Dừng chỉnh sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Tiếp tục chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
