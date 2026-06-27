import { SelectField } from "@/components/ui/select";
import type { LoaiBuocUI, LoaiThoiHanUI, HuongXuLyUI, StepModalContext } from "../workflowDesignerTypes";
import { LOAI_BUOC_UI_VALUES } from "../workflowDesignerTypes";

const DON_VI_OPTIONS = [
  "K/P mua sắm", "K/P sử dụng", "Tổ kiểm tra giá",
  "Tổ chuyên gia", "Tổ thẩm định", "Tư vấn LCNT",
  "Tư vấn thẩm định", "Chủ đầu tư", "CĐT + Nhà thầu",
  "Nhà thầu", "Nhà thầu tư vấn LCNT",
  "K/P mua sắm hoặc tư vấn LCNT",
];

const VAI_TRO_OPTIONS = [
  "Nhân viên K/P mua sắm", "Nhân viên K/P sử dụng",
  "Tổ kiểm tra giá", "Tổ chuyên gia", "Tổ thẩm định",
  "Tư vấn LCNT", "Tư vấn thẩm định", "Chủ đầu tư",
  "Nhà thầu", "CĐT + Nhà thầu",
];

const DON_VI_KY_OPTIONS = [
  "K/P mua sắm", "K/P mua sắm và Giám đốc BV",
  "Giám đốc BV", "PGĐ được ủy quyền",
  "Giám đốc BV hoặc PGĐ được ủy quyền",
  "Kế toán trưởng", "Tổ kiểm tra giá", "Tổ chuyên gia",
  "Tổ thẩm định", "Tư vấn LCNT", "Tư vấn thẩm định",
  "Chủ đầu tư", "CĐT + Nhà thầu", "Nhà thầu",
  "Nhà thầu tư vấn LCNT", "K/P mua sắm hoặc tư vấn LCNT",
];

const VAI_TRO_KY_OPTIONS = [
  "Trưởng K/P", "Giám đốc BV", "PGĐ được ủy quyền",
  "Kế toán trưởng", "Ban Giám đốc", "Tổ kiểm tra giá",
  "Tổ chuyên gia", "Tổ thẩm định", "Chủ đầu tư",
  "Nhà thầu", "CĐT + Nhà thầu",
];

const HUONG_XU_LY_OPTIONS = [
  "Trả về bước trước", "Dừng quy trình",
] as const;

const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls = "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export type StepFormData = {
  tenBuoc: string;
  loaiBuoc: LoaiBuocUI;
  moTa: string;
  donViPhuTrach: string;
  vaiTroXuLy: string;
  slaNgay: number;
  loaiThoiHan: LoaiThoiHanUI;
  coKyDuyet: boolean;
  donViKyHoSo: string;
  vaiTroKyDuyet: string;
  soNgayKyDuyet: number | undefined;
  huongXuLyKhongDuyet: HuongXuLyUI;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  batBuocKyTruocChuyenBuoc: boolean;
  batBuocDungSLA: boolean;
};

export function emptyStepForm(): StepFormData {
  return {
    tenBuoc: "",
    loaiBuoc: "Thường",
    moTa: "",
    donViPhuTrach: "",
    vaiTroXuLy: "",
    slaNgay: 1,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
    coKyDuyet: false,
    donViKyHoSo: "",
    vaiTroKyDuyet: "",
    soNgayKyDuyet: undefined,
    huongXuLyKhongDuyet: "Trả về bước trước",
    batBuocGhiChu: false,
    batBuocTaiLieu: false,
    batBuocKyTruocChuyenBuoc: true,
    batBuocDungSLA: false,
  };
}

interface Props {
  open: boolean;
  mode: "add" | "edit";
  context: StepModalContext;
  form: StepFormData;
  errors: Partial<Record<keyof StepFormData, string>>;
  nextStepName?: string;
  allowSpecialLoaiBuoc?: boolean;
  donViOptions?: string[];
  vaiTroOptions?: string[];
  onChange: (data: StepFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function StepFormModal({
  open,
  mode,
  context,
  form,
  errors,
  nextStepName,
  allowSpecialLoaiBuoc = true,
  donViOptions,
  vaiTroOptions,
  onChange,
  onSave,
  onClose,
}: Props) {
  const effectiveErrors = errors.tenBuoc ? errors : errors;

  if (!open) return null;

  const isBranch = context.type === "branch";
  const effectiveDonViOptions = donViOptions?.length ? donViOptions : DON_VI_OPTIONS;
  const effectiveVaiTroOptions = vaiTroOptions?.length ? vaiTroOptions : VAI_TRO_OPTIONS;
  const effectiveDonViKyOptions = donViOptions?.length ? donViOptions : DON_VI_KY_OPTIONS;
  const effectiveVaiTroKyOptions = vaiTroOptions?.length ? vaiTroOptions : VAI_TRO_KY_OPTIONS;
  const availableLoaiBuoc = mode === "edit" || allowSpecialLoaiBuoc
    ? LOAI_BUOC_UI_VALUES
    : (["Thường"] as const);
  const saveLabel = mode === "add" ? (isBranch ? "Thêm vào nhánh" : "Thêm bước") : "Lưu thay đổi";

  function set<K extends keyof StepFormData>(key: K, value: StepFormData[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 my-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {mode === "add" ? "Thêm bước mới" : "Chỉnh sửa bước"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Vị trí thêm: {context.type === "branch" ? `Nhánh ${context.branchId}` : "Luồng chính"}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* 1. Thông tin bước */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <i className="fa-solid fa-circle-info text-blue-400" />1. Thông tin bước
          </p>
          <div>
            <label className={labelCls}>Tên bước <span className="text-red-500">*</span></label>
            <input className={effectiveErrors.tenBuoc ? inputErrCls : inputCls}
              placeholder="Ví dụ: Đề xuất mua sắm/sửa chữa"
              value={form.tenBuoc}
              onChange={(e) => set("tenBuoc", e.target.value)}
            />
            {effectiveErrors.tenBuoc && <p className="text-xs text-red-500 mt-1">{effectiveErrors.tenBuoc}</p>}
          </div>
          <div>
            <label className={labelCls}>Loại bước <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {availableLoaiBuoc.map((l) => (
                <button key={l} type="button"
                  onClick={() => set("loaiBuoc", l)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    form.loaiBuoc === l
                      ? l === "Bắt đầu" ? "bg-emerald-500 text-white border-emerald-500"
                        : l === "Kết thúc" ? "bg-red-500 text-white border-red-500"
                        : "bg-blue-600 text-white border-blue-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            {!allowSpecialLoaiBuoc && mode === "add" && (
              <p className="text-[11px] text-slate-400 mt-1">
                Khi thêm bước sau hoặc trong nhánh, chỉ dùng loại Thường.
              </p>
            )}
            {effectiveErrors.loaiBuoc && <p className="text-xs text-red-500 mt-1">{effectiveErrors.loaiBuoc}</p>}
          </div>
          <div>
            <label className={labelCls}>Mô tả (tuỳ chọn)</label>
            <textarea rows={2} className={`${inputCls} resize-none`}
              placeholder="Ghi chú thêm về bước này..."
              value={form.moTa}
              onChange={(e) => set("moTa", e.target.value)}
            />
          </div>
        </div>

        {/* 2. Đơn vị xử lý */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <i className="fa-solid fa-building text-blue-400" />2. Đơn vị xử lý
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Đơn vị phụ trách <span className="text-red-500">*</span></label>
              <SelectField
                value={form.donViPhuTrach || "__empty"}
                onValueChange={(v) => set("donViPhuTrach", v === "__empty" ? "" : v)}
                options={[{ value: "__empty", label: "-- Chọn đơn vị --" }, ...effectiveDonViOptions.map((d) => ({ value: d, label: d }))]}
                triggerClassName={effectiveErrors.donViPhuTrach ? inputErrCls : inputCls}
              />
              {effectiveErrors.donViPhuTrach && <p className="text-xs text-red-500 mt-1">{effectiveErrors.donViPhuTrach}</p>}
            </div>
            <div>
              <label className={labelCls}>Vai trò xử lý <span className="text-red-500">*</span></label>
              <SelectField
                value={form.vaiTroXuLy || "__empty"}
                onValueChange={(v) => set("vaiTroXuLy", v === "__empty" ? "" : v)}
                options={[{ value: "__empty", label: "-- Chọn vai trò --" }, ...effectiveVaiTroOptions.map((v) => ({ value: v, label: v }))]}
                triggerClassName={effectiveErrors.vaiTroXuLy ? inputErrCls : inputCls}
              />
              {effectiveErrors.vaiTroXuLy && <p className="text-xs text-red-500 mt-1">{effectiveErrors.vaiTroXuLy}</p>}
            </div>
          </div>
        </div>

        {/* 3. Thời hạn */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <i className="fa-regular fa-clock text-blue-400" />3. Thời hạn
          </p>
          <div>
            <label className={labelCls}>Thời hạn xử lý (ngày) <span className="text-red-500">*</span></label>
            <input type="number" min={0} step={0.5}
              className={effectiveErrors.slaNgay ? inputErrCls : inputCls}
              value={form.slaNgay}
              onChange={(e) => set("slaNgay", parseFloat(e.target.value) || 0)}
            />
            {effectiveErrors.slaNgay && <p className="text-xs text-red-500 mt-1">{effectiveErrors.slaNgay}</p>}
          </div>
          <div>
            <label className={labelCls}>Loại thời hạn <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2">
              {(["Chỉ cảnh báo quá hạn", "Bắt buộc hoàn thành trước hạn"] as LoaiThoiHanUI[]).map((opt) => (
                <label key={opt} className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="loaiThoiHan" value={opt}
                    checked={form.loaiThoiHan === opt}
                    onChange={() => set("loaiThoiHan", opt)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Ký duyệt */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <i className="fa-solid fa-signature text-blue-400" />4. Ký duyệt
          </p>
          <div>
            <label className={labelCls}>Có yêu cầu ký duyệt?</label>
            <div className="flex gap-5">
              {[false, true].map((v) => (
                <label key={String(v)} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="coKyDuyet" checked={form.coKyDuyet === v}
                    onChange={() => set("coKyDuyet", v)}
                  />
                  <span className="text-xs text-slate-700">{v ? "Có" : "Không"}</span>
                </label>
              ))}
            </div>
          </div>
          {form.coKyDuyet && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Đơn vị kiểm tra/ký hồ sơ <span className="text-red-500">*</span></label>
                  <SelectField
                    value={form.donViKyHoSo || "__empty"}
                    onValueChange={(v) => set("donViKyHoSo", v === "__empty" ? "" : v)}
                    options={[{ value: "__empty", label: "-- Chọn đơn vị --" }, ...effectiveDonViKyOptions.map((d) => ({ value: d, label: d }))]}
                    triggerClassName={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Vai trò ký duyệt <span className="text-red-500">*</span></label>
                  <SelectField
                    value={form.vaiTroKyDuyet || "__empty"}
                    onValueChange={(v) => set("vaiTroKyDuyet", v === "__empty" ? "" : v)}
                    options={[{ value: "__empty", label: "-- Chọn vai trò --" }, ...effectiveVaiTroKyOptions.map((v) => ({ value: v, label: v }))]}
                    triggerClassName={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Số ngày ký duyệt</label>
                <input type="number" min={0} step={0.5} className={inputCls}
                  value={form.soNgayKyDuyet ?? ""}
                  onChange={(e) => set("soNgayKyDuyet", parseFloat(e.target.value) || undefined)}
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Điều kiện chuyển tiếp (2-card design) */}
        <div className="border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <i className="fa-solid fa-arrow-right-arrow-left text-blue-400" />5. Điều kiện chuyển tiếp
          </p>

          {/* KHI DUYET */}
          <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/50">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <i className="fa-solid fa-check-circle text-emerald-500" />
              KHI DUYỆT
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Bước tiếp theo: <span className="text-slate-700 font-medium">{nextStepName || "Tự động theo quy trình"}</span>
            </p>
          </div>

          {/* KHI KHONG DUYET */}
          <div className="border border-red-200 rounded-lg p-3 bg-red-50/50 space-y-2">
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <i className="fa-solid fa-xmark-circle text-red-500" />
              KHI KHÔNG DUYỆT
            </p>
            <div>
              <label className={labelCls}>Hướng xử lý <span className="text-red-500">*</span></label>
              <SelectField
                value={form.huongXuLyKhongDuyet}
                onValueChange={(v) => set("huongXuLyKhongDuyet", v as HuongXuLyUI)}
                options={HUONG_XU_LY_OPTIONS.map((h) => ({ value: h, label: h }))}
                triggerClassName={inputCls}
              />
            </div>
          </div>

          {/* Checkbox batch */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.batBuocGhiChu}
                onChange={(e) => set("batBuocGhiChu", e.target.checked)}
              />
              <span className="text-xs text-slate-600">Bắt buộc ghi chú</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.batBuocTaiLieu}
                onChange={(e) => set("batBuocTaiLieu", e.target.checked)}
              />
              <span className="text-xs text-slate-600">Bắt buộc upload tài liệu</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.batBuocKyTruocChuyenBuoc}
                onChange={(e) => set("batBuocKyTruocChuyenBuoc", e.target.checked)}
              />
              <span className="text-xs text-slate-600">Bắt buộc ký duyệt</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={form.batBuocDungSLA}
                onChange={(e) => set("batBuocDungSLA", e.target.checked)}
              />
              <span className="text-xs text-slate-600">Bắt buộc hoàn thành trước SLA</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Hủy
          </button>
          <button onClick={onSave} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
