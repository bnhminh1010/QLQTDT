import type { WorkflowDetailStep } from "./workflowDetailTypes";
import type { WorkflowParallelBranchStep } from "./workflowDetailTypes";
import ParallelGroupCard from "./ParallelGroupCard";

type Props = {
  loading?: boolean;
  steps: WorkflowDetailStep[];
  emptyMessage?: string;
  onCurrentStepAction?: (step: WorkflowDetailStep) => void;
  canShowCurrentStepAction?: (step: WorkflowDetailStep) => boolean;
  currentStepActionLabel?: string;
  onBranchStepClick?: (step: WorkflowParallelBranchStep) => void;
  onBranchCurrentStepAction?: (branch: NonNullable<WorkflowDetailStep["parallelInfo"]>["branches"][number]) => void;
  onBranchSkip?: (branch: NonNullable<WorkflowDetailStep["parallelInfo"]>["branches"][number]) => void;
};

function Dot({ state }: { state: WorkflowDetailStep["state"] }) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${
        state === "done"
          ? "bg-emerald-500 text-white"
          : state === "warn"
            ? "bg-amber-500 text-white"
            : "bg-slate-200"
      }`}
    >
      {state === "done" && <i className="fa-solid fa-check" />}
      {state === "warn" && <i className="fa-solid fa-triangle-exclamation" />}
    </div>
  );
}

export default function WorkflowStepsPanel({
  loading = false,
  steps,
  emptyMessage = "Chua co du lieu buoc quy trinh tu backend.",
  onCurrentStepAction,
  canShowCurrentStepAction,
  currentStepActionLabel = "Cập nhật",
  onBranchStepClick,
  onBranchCurrentStepAction,
  onBranchSkip,
}: Props) {
  return (
    <div className="space-y-3 mb-5">
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          <i className="fa-solid fa-circle-notch fa-spin mr-1" />
          Dang tai cac buoc quy trinh...
        </div>
      ) : steps.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        steps.map((step) => (
          <div key={step.backendId ?? step.ten} className="space-y-2">
            <details className="group">
              <summary className="flex items-start gap-2.5 rounded-xl cursor-pointer list-none
                [&::-webkit-details-marker]:hidden
                [&::marker]:hidden
                transition-colors
                p-1.5 -mx-1.5 hover:bg-slate-50
              ">
                <Dot state={step.state} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {step.current && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                            BƯỚC HIỆN TẠI
                          </span>
                        )}
                        <div className="text-xs font-medium text-slate-800">
                          {step.ten}
                        </div>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        Đơn vị/Vai trò xử lý:{" "}
                        <span className="font-medium text-slate-500">{step.donVi}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {step.current && onCurrentStepAction && (!canShowCurrentStepAction || canShowCurrentStepAction(step)) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCurrentStepAction(step);
                          }}
                          className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          {currentStepActionLabel}
                        </button>
                      )}
                      <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform group-open:rotate-180" />
                    </div>
                  </div>
                </div>
              </summary>
              <div className="ml-[34px] mt-1.5 space-y-0.5 text-[11px] bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                <div className="text-slate-600 grid gap-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Người xử lý</span>
                    <span className="font-semibold text-slate-700 text-right">{step.nguoiXuLy || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Ngày xử lý</span>
                    <span className="font-semibold text-slate-700 text-right">{step.ngayXuLy || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Người ký duyệt</span>
                    <span className="font-semibold text-slate-700 text-right">{step.nguoiKy || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Ngày ký duyệt</span>
                    <span className="font-semibold text-slate-700 text-right">{step.ngayKy || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Kết quả</span>
                    <span className={`font-semibold text-right ${
                      step.ketQua === "Duyệt" || step.ketQua === "Đồng ý"
                        ? "text-emerald-600"
                        : step.ketQua === "Không duyệt" || step.ketQua === "Từ chối"
                          ? "text-red-600"
                          : "text-slate-700"
                    }`}>
                      {step.ketQua || "—"}
                    </span>
                  </div>
                  {step.lyDoKhongDuyet && (
                    <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-600 text-[11px]">
                      <span className="font-semibold">Lý do không duyệt:</span> {step.lyDoKhongDuyet}
                    </div>
                  )}
                  {step.ghiChu && (
                    <div className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-700 text-[11px]">
                      <span className="font-semibold">Ghi chú / lý do thực tế:</span> {step.ghiChu}
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Tình trạng tiến độ</span>
                    <span className={`font-semibold text-right ${
                      step.slaText?.includes("Quá hạn")
                        ? "text-red-600"
                        : step.slaText?.includes("Sắp")
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}>
                      {step.slaText || "Đang theo dõi"}
                    </span>
                  </div>
                </div>
              </div>
            </details>
            {step.parallelInfo && (
              <ParallelGroupCard
                parallelInfo={step.parallelInfo}
                onBranchStepClick={onBranchStepClick}
                onBranchCurrentStepAction={onBranchCurrentStepAction}
                onBranchSkip={onBranchSkip}
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}
