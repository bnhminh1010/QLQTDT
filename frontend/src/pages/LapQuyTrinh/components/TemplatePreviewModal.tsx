import type { WorkflowTemplatePreview } from "@/services/workflowApi";
import type { ParallelGroupDto } from "@/services/workflowApi";

interface Props {
  open: boolean;
  preview: WorkflowTemplatePreview | null;
  loading: boolean;
  onClose: () => void;
}

function renderParallelGroups(groups: ParallelGroupDto[]) {
  if (!groups.length) return null;
  return (
    <div className="mt-2">
      {groups.map((g) => (
        <div key={g.id} className="ml-4 border-l-2 border-amber-300 pl-3 my-1 text-xs text-amber-700">
          <div className="font-semibold">Tách nhánh: {g.tenNhom}</div>
          {g.branches.map((b) => (
            <div key={b.id} className="ml-2 text-slate-600">
              ├─ {b.tenNhanh}
            </div>
          ))}
          <div className="text-purple-600 font-semibold mt-1">
            Điều kiện hợp nhất: {g.dieuKienHopNhat}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TemplatePreviewModal({
  open,
  preview,
  loading,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 my-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {preview?.tenWorkflow ?? "Xem trước quy trình"}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <i className="fa-solid fa-circle-notch fa-spin text-2xl mr-2" />
            <span className="text-sm">Đang tải...</span>
          </div>
        )}

        {preview && !loading && (
          <div className="space-y-1">
            {preview.loaiHinhDauThau && (
              <p className="text-xs text-slate-400 mb-3">
                Loại hình: {preview.loaiHinhDauThau}
              </p>
            )}
            {preview.steps.map((s, idx) => (
              <div key={s.id} className="flex items-start gap-2 py-1">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-700">{s.tenBuoc}</span>
              </div>
            ))}
            {renderParallelGroups(preview.parallelGroups)}
          </div>
        )}

        {!preview && !loading && (
          <p className="text-sm text-slate-400 text-center py-8">
            Không có dữ liệu preview.
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
