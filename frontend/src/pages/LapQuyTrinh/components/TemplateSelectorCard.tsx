import { SelectField } from "@/components/ui/select";
import { LOAI_HINH_DAU_THAU, getHtBadge } from "./constants";
import type { TemplateInfo } from "../workflowDesignerTypes";

interface Props {
  tenWorkflow: string;
  tenErr: string;
  onTenChange: (val: string) => void;
  selectedLoaiHinh: string;
  onLoaiHinhChange: (val: string) => void;
  loaiHinhErr: string;
  templateInfo: TemplateInfo | null;
  loadingTemplate: boolean;
  onPreview: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
  canPreview: boolean;
  isEdit: boolean;
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export default function TemplateSelectorCard({
  tenWorkflow,
  tenErr,
  onTenChange,
  selectedLoaiHinh,
  onLoaiHinhChange,
  loaiHinhErr,
  templateInfo,
  loadingTemplate,
  onPreview,
  onGenerate,
  canGenerate,
  canPreview,
  isEdit,
}: Props) {
  const tenLen = tenWorkflow.trim().length;

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <i className="fa-solid fa-circle-info text-blue-500" />
        Thông tin quy trình
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
        {/* Tên quy trình */}
        <div>
          <label className={labelCls}>
            Tên quy trình <span className="text-red-500">*</span>
          </label>
          <input
            className={tenErr ? inputErrCls : inputCls}
            placeholder="Ví dụ: Quy trình mua sắm vật tư y tế 2025"
            value={tenWorkflow}
            maxLength={260}
            onChange={(e) => {
              onTenChange(e.target.value);
            }}
          />
          <div className="flex items-center justify-between mt-1">
            {tenErr ? (
              <p className="text-xs text-red-500">{tenErr}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-[11px] ml-auto ${tenLen > 255 ? "text-red-500 font-semibold" : "text-slate-400"}`}
            >
              {tenLen}/255
            </span>
          </div>
        </div>

        {/* Loại hình đấu thầu */}
        <div>
          <label className={labelCls}>
            Loại hình đấu thầu <span className="text-red-500">*</span>
          </label>
          <SelectField
            value={selectedLoaiHinh || "__empty"}
            onValueChange={(value) =>
              onLoaiHinhChange(value === "__empty" ? "" : value)
            }
            options={[
              { value: "__empty", label: "-- Chọn loại hình đấu thầu --" },
              ...LOAI_HINH_DAU_THAU.map((ht) => ({ value: ht, label: ht })),
            ]}
            triggerClassName={loaiHinhErr ? inputErrCls : inputCls}
          />
          {loaiHinhErr && (
            <p className="text-xs text-red-500 mt-1">{loaiHinhErr}</p>
          )}
        </div>
      </div>

      {/* Quy trình chuẩn card */}
      {templateInfo && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              Quy trình chuẩn
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHtBadge(templateInfo.loaiHinhDauThau)}`}
            >
              {templateInfo.loaiHinhDauThau}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {templateInfo.tenWorkflow}
          </p>
          <p className="text-xs text-slate-500">
            <strong>Số bước:</strong> {templateInfo.soBuoc}
          </p>
          {templateInfo.phamViApDung && (
            <p className="text-xs text-slate-500">
              <strong>Phạm vi áp dụng:</strong> {templateInfo.phamViApDung}
            </p>
          )}
          {templateInfo.moTaNgan && (
            <p className="text-xs text-slate-500">{templateInfo.moTaNgan}</p>
          )}
        </div>
      )}

      {/* Loading */}
      {loadingTemplate && (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
          <i className="fa-solid fa-circle-notch fa-spin text-blue-400" />
          Đang tải quy trình chuẩn...
        </div>
      )}

      {/* Actions */}
      {!isEdit && (
        <div className="flex gap-3">
          <button
            onClick={onPreview}
            disabled={!canPreview}
            className="h-9 px-5 border border-slate-200 text-sm text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xem trước quy trình
          </button>
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-xs" />
            Tạo quy trình
          </button>
        </div>
      )}
    </section>
  );
}
