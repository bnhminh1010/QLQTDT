import { useForm } from "react-hook-form";

/* ─── Types ─────────────────────────────────────────── */
type LoaiBaoCao =
  | "Tổng hợp"
  | "Theo hình thức đấu thầu"
  | "Theo khoa/phòng"
  | "Tài chính – tiết kiệm";

type FormValues = {
  tenBaoCao: string;
  loai: LoaiBaoCao;
  nam: string;
  tuThang: string;
  denThang: string;
  ghiChu: string;
};

type Props = {
  onSave: (values: FormValues) => void;
  onClose: () => void;
};

/* ─── Constants ─────────────────────────────────────── */
const LOAI_OPTIONS: LoaiBaoCao[] = [
  "Tổng hợp",
  "Theo hình thức đấu thầu",
  "Theo khoa/phòng",
  "Tài chính – tiết kiệm",
];

const NAM_OPTIONS = ["2023", "2024", "2025", "2026"];
const THANG_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 bg-red-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

/* ─── Component ─────────────────────────────────────── */
export function TaoBaoCaoModal({ onSave, onClose }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      tenBaoCao: "",
      loai: "Tổng hợp",
      nam: "2025",
      tuThang: "1",
      denThang: "12",
      ghiChu: "",
    },
  });

  const tuThang = watch("tuThang");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-blue-500" />
            Tạo báo cáo mới
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
          {/* Tên báo cáo */}
          <div>
            <label className={labelCls}>
              Tên báo cáo <span className="text-red-500">*</span>
            </label>
            <input
              className={errors.tenBaoCao ? inputErrCls : inputCls}
              placeholder="Ví dụ: Báo cáo tổng hợp mua sắm Q1/2025"
              {...register("tenBaoCao", {
                required: "Vui lòng nhập tên báo cáo",
                validate: (v) => v.trim().length > 0 || "Tên không được chỉ là khoảng trắng",
                minLength: { value: 5, message: "Tên phải có ít nhất 5 ký tự" },
                maxLength: { value: 150, message: "Tên không được vượt quá 150 ký tự" },
              })}
            />
            {errors.tenBaoCao && (
              <p className="text-xs text-red-500 mt-1">{errors.tenBaoCao.message}</p>
            )}
          </div>

          {/* Loại báo cáo */}
          <div>
            <label className={labelCls}>
              Loại báo cáo <span className="text-red-500">*</span>
            </label>
            <select
              className={errors.loai ? inputErrCls : inputCls}
              {...register("loai", { required: "Vui lòng chọn loại báo cáo" })}
            >
              {LOAI_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {errors.loai && (
              <p className="text-xs text-red-500 mt-1">{errors.loai.message}</p>
            )}
          </div>

          {/* Năm + khoảng tháng */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Năm <span className="text-red-500">*</span></label>
              <select
                className={errors.nam ? inputErrCls : inputCls}
                {...register("nam", { required: "Chọn năm" })}
              >
                {NAM_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {errors.nam && (
                <p className="text-xs text-red-500 mt-1">{errors.nam.message}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Từ tháng</label>
              <select
                className={inputCls}
                {...register("tuThang")}
              >
                {THANG_OPTIONS.map((t) => (
                  <option key={t} value={t}>Tháng {t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Đến tháng</label>
              <select
                className={errors.denThang ? inputErrCls : inputCls}
                {...register("denThang", {
                  validate: (v) =>
                    parseInt(v) >= parseInt(tuThang) ||
                    "Phải ≥ tháng bắt đầu",
                })}
              >
                {THANG_OPTIONS.map((t) => (
                  <option key={t} value={t}>Tháng {t}</option>
                ))}
              </select>
              {errors.denThang && (
                <p className="text-xs text-red-500 mt-1">{errors.denThang.message}</p>
              )}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className={labelCls}>Ghi chú (tuỳ chọn)</label>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Mô tả thêm về báo cáo này..."
              {...register("ghiChu", {
                maxLength: { value: 300, message: "Ghi chú không quá 300 ký tự" },
              })}
            />
            {errors.ghiChu && (
              <p className="text-xs text-red-500 mt-1">{errors.ghiChu.message}</p>
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
              className="h-9 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-chart-bar text-xs" />
              Tạo báo cáo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
