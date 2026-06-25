import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { formatVND } from "@/pages/DanhSachGoiThau/goiThauService";
import type { GoiThau } from "@/pages/DanhSachGoiThau/goiThauService";
import type { KetQuaXuLy } from "@/pages/DanhSachGoiThau/xuLyBuocService";
import { getWorkflowState, getWorkflowStepDetail, processStep, type WorkflowStepStateDto } from "@/services/workflowApi";
import { useFileAttachment } from "@/hooks/useFileAttachment";
import { fileIcon, formatBytes, openFile, downloadFile } from "@/util/fileAttachment";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400";
const readonlyCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

type FormData = {
  goiThauId: string;
  buocWorkflow: string;
  nguoiXuLy: string;
  ngayXuLy: string;
  nguoiKyDuyet: string;
  ngayKyDuyet: string;
  ketQua: string;
  ghiChu: string;
  lyDoKhongDuyet: string;
  taiLieuDinhKem: string[];
};

const emptyForm = (goiThauId: string): FormData => ({
  goiThauId,
  buocWorkflow: "",
  nguoiXuLy: "",
  ngayXuLy: todayInputValue(),
  nguoiKyDuyet: "",
  ngayKyDuyet: "",
  ketQua: "Chờ xử lý",
  ghiChu: "",
  lyDoKhongDuyet: "",
  taiLieuDinhKem: [],
});

export default function XuLyBuocGoiThau() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const readonlyMode = searchParams.get("mode") === "view";
  const viewingStep = searchParams.get("step") || "";
  const stepIdParam = Number(searchParams.get("stepId"));
  const stepId = Number.isFinite(stepIdParam) && stepIdParam > 0 ? stepIdParam : undefined;

  const [backendLoading, setBackendLoading] = useState(true);
  const [backendError, setBackendError] = useState("");
  const [step, setStep] = useState<WorkflowStepStateDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [goiThau] = useState<GoiThau>(() => ({
    id, ten: "", tenGoiThau: "", maGoiThau: "",
    hinhThuc: "", giaTriStr: "0", giaTriNum: 0, donVi: "",
    trangThai: "Đang xử lý" as any,
    detail: { nguonVon: "--", ngayTao: "--", hanHT: "--", pct: "0%", buoc: "0/0" },
  }));

  const [form, setForm] = useState<FormData>(emptyForm(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<"" | KetQuaXuLy>("");
  const [rejectReason, setRejectReason] = useState("");
  const [locked, setLocked] = useState(readonlyMode);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const { attachments, getRootProps, getInputProps, isDragActive, removeFile } =
    useFileAttachment();

  useEffect(() => {
    const goiThauId = Number(id.replace(/^GT/i, ""));
    if (!Number.isFinite(goiThauId) || goiThauId <= 0) return;

    let cancelled = false;
    setBackendLoading(true);
    setBackendError("");

    const loadStep = async () => {
      const targetStepId = readonlyMode
        ? stepId
        : (await getWorkflowState(goiThauId)).currentSteps?.[0]?.stepInstanceId;

      if (!targetStepId) {
        if (!readonlyMode) {
          setLocked(true);
          setBackendError("Không còn bước đang xử lý cho gói thầu này.");
        }
        return;
      }

      const backendStep = await getWorkflowStepDetail(goiThauId, targetStepId);
      if (cancelled) return;

      setStep(backendStep);
      const isDone = readonlyMode || Boolean(backendStep.ngayHoanThanh)
        || backendStep.trangThai === "HOAN_TAT" || backendStep.trangThai === "COMPLETED";

      setForm({
        goiThauId: id,
        buocWorkflow: backendStep.tenBuoc || viewingStep,
        nguoiXuLy: backendStep.tenNguoiXuLy || "",
        ngayXuLy: backendStep.ngayXuLy?.slice(0, 10) || todayInputValue(),
        nguoiKyDuyet: backendStep.tenNguoiKyDuyet || "",
        ngayKyDuyet: backendStep.ngayKyDuyet?.slice(0, 10) || "",
        ketQua: backendStep.ketQua || (backendStep.ngayHoanThanh ? "Duyệt" : "Chờ xử lý"),
        ghiChu: backendStep.lyDoKhongDuyet || "",
        lyDoKhongDuyet: backendStep.lyDoKhongDuyet || "",
        taiLieuDinhKem: [],
      });
      const nextKetQua = backendStep.ketQua || (backendStep.ngayHoanThanh ? "Duyệt" : "Chờ xử lý");
      setDecision(nextKetQua === "Không duyệt" || nextKetQua === "Duyệt" ? nextKetQua as KetQuaXuLy : "");
      setRejectReason(backendStep.lyDoKhongDuyet || "");
      setLocked(isDone);
    };

    loadStep()
      .catch(() => {
        if (!cancelled) setBackendError("Không thể tải chi tiết bước từ hệ thống.");
      })
      .finally(() => {
        if (!cancelled) setBackendLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, readonlyMode, stepId, viewingStep]);

  if (!goiThau) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
          Không tìm thấy gói thầu cần xử lý.
        </div>
      </div>
    );
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateBase(extra: "approve" | "reject") {
    const next: Record<string, string> = {};
    if (!form.nguoiXuLy.trim()) next.nguoiXuLy = "Vui lòng nhập người xử lý";
    if (!form.ngayXuLy) next.ngayXuLy = "Vui lòng chọn ngày xử lý";
    if (!form.nguoiKyDuyet.trim()) next.nguoiKyDuyet = "Vui lòng nhập người ký duyệt";
    if (!form.ngayKyDuyet) next.ngayKyDuyet = "Vui lòng chọn ngày ký duyệt";
    if (form.ngayXuLy && form.ngayKyDuyet && form.ngayKyDuyet < form.ngayXuLy) {
      next.ngayKyDuyet = "Ngày ký duyệt không được trước ngày xử lý";
    }
    if (extra === "reject" && !rejectReason.trim()) {
      next.lyDoKhongDuyet = "Vui lòng nhập lý do không duyệt";
    }
    if (!decision) {
      next.ketQua = "Vui lòng chọn kết quả duyệt";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveUpdate() {
    if (!decision) {
      setErrors((prev) => ({ ...prev, ketQua: "Vui lòng chọn kết quả duyệt" }));
      return;
    }
    const mode = decision === "Không duyệt" ? "reject" : "approve";
    if (!validateBase(mode)) return;

    const goiThauId = Number(id.replace(/^GT/i, ""));
    if (!Number.isFinite(goiThauId) || goiThauId <= 0 || !step?.id || !step.rowVersion) {
      toast.error("Không đủ dữ liệu bước từ hệ thống. Vui lòng tải lại trang.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await processStep(goiThauId, {
        hanhDong: decision === "Không duyệt" ? "KHONG_DUYET" : "APPROVE",
        ghiChu: decision === "Không duyệt" ? rejectReason.trim() : form.ghiChu,
        workflowStepInstanceId: step.id,
        rowVersion: step.rowVersion,
        taiLieuDinhKem: attachments.map((file) => file.name).join(", ") || undefined,
        tenNguoiKyDuyet: form.nguoiKyDuyet || undefined,
      });

      toast.success(result.message || "Cập nhật bước thành công.");
      navigate(`/danh-sach-goi-thau?goiThauId=GT${goiThauId}`);
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật bước.");
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = locked;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/danh-sach-goi-thau")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">
            {readonlyMode ? "Chi tiết kết quả xử lý bước" : "Chi tiết xử lý bước"}
          </h1>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {goiThau.id}
        </span>
      </header>

      <main className="p-4 lg:p-6 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold text-blue-700">{goiThau.id}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {goiThau.ten}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {goiThau.donVi} · {goiThau.hinhThuc} · {formatVND(goiThau.giaTriStr)} đ
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
              <span className="text-slate-400">Kết quả xử lý: </span>
              <span
                className={`font-semibold ${
                  form.ketQua === "Duyệt"
                    ? "text-emerald-600"
                    : form.ketQua === "Không duyệt"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {form.ketQua}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
          {backendLoading && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <i className="fa-solid fa-circle-notch fa-spin mr-2" />
              Đang tải chi tiết bước từ hệ thống...
            </div>
          )}
          {backendError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {backendError} Đang hiển thị dữ liệu sẵn có trên giao diện.
            </div>
          )}
          {locked && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Bước này chỉ hiển thị để tra cứu, không cho phép chỉnh sửa kết quả xử lý.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Bước hiện tại</label>
              <input readOnly value={form.buocWorkflow} className={readonlyCls} />
            </div>
            <div>
              <label className={labelCls}>
                Người xử lý hồ sơ <span className="text-red-500">*</span>
              </label>
              <input
                disabled={disabled}
                value={form.nguoiXuLy}
                onChange={(e) => updateField("nguoiXuLy", e.target.value)}
                className={errors.nguoiXuLy ? inputErrCls : disabled ? readonlyCls : inputCls}
              />
              {errors.nguoiXuLy && <p className="mt-1 text-xs text-red-500">{errors.nguoiXuLy}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Ngày xử lý <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                disabled={disabled}
                value={form.ngayXuLy}
                onChange={(e) => updateField("ngayXuLy", e.target.value)}
                className={errors.ngayXuLy ? inputErrCls : disabled ? readonlyCls : inputCls}
              />
              {errors.ngayXuLy && <p className="mt-1 text-xs text-red-500">{errors.ngayXuLy}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Người ký duyệt <span className="text-red-500">*</span>
              </label>
              <input
                disabled={disabled}
                value={form.nguoiKyDuyet}
                onChange={(e) => updateField("nguoiKyDuyet", e.target.value)}
                className={errors.nguoiKyDuyet ? inputErrCls : disabled ? readonlyCls : inputCls}
                placeholder="VD: Trần Văn B"
              />
              {errors.nguoiKyDuyet && <p className="mt-1 text-xs text-red-500">{errors.nguoiKyDuyet}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Ngày ký duyệt <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                disabled={disabled}
                value={form.ngayKyDuyet}
                onChange={(e) => updateField("ngayKyDuyet", e.target.value)}
                className={errors.ngayKyDuyet ? inputErrCls : disabled ? readonlyCls : inputCls}
              />
              {errors.ngayKyDuyet && <p className="mt-1 text-xs text-red-500">{errors.ngayKyDuyet}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Kết quả duyệt <span className="text-red-500">*</span>
              </label>
              {locked ? (
                <input readOnly value={form.ketQua} className={readonlyCls} />
              ) : (
                <div className="min-h-[42px] rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                    {(["Duyệt", "Không duyệt"] as KetQuaXuLy[]).map((value) => (
                      <label key={value} className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="ketQuaDuyet"
                          value={value}
                          checked={decision === value}
                          onChange={() => {
                            setDecision(value);
                            setErrors((prev) => ({ ...prev, ketQua: "", lyDoKhongDuyet: "" }));
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {errors.ketQua && <p className="mt-1 text-xs text-red-500">{errors.ketQua}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Ghi chú</label>
            <textarea
              rows={4}
              disabled={disabled}
              value={form.ghiChu}
              onChange={(e) => updateField("ghiChu", e.target.value)}
              className={`${disabled ? readonlyCls : inputCls} resize-none`}
              placeholder="Nhập ghi chú xử lý..."
            />
          </div>

          {form.lyDoKhongDuyet && (
            <div>
              <label className={labelCls}>Lý do không duyệt</label>
              <textarea readOnly rows={3} value={form.lyDoKhongDuyet} className={`${readonlyCls} resize-none`} />
            </div>
          )}

          {!locked && decision === "Không duyệt" && (
            <div>
              <label className={labelCls}>
                Lý do không duyệt <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setErrors((prev) => ({ ...prev, lyDoKhongDuyet: "" }));
                }}
                className={`${errors.lyDoKhongDuyet ? inputErrCls : inputCls} resize-none`}
                placeholder="Nhập lý do không duyệt..."
              />
              {errors.lyDoKhongDuyet && <p className="mt-1 text-xs text-red-500">{errors.lyDoKhongDuyet}</p>}
            </div>
          )}

          <div>
            <label className={labelCls}>Tài liệu đính kèm</label>
            {!locked && (
              <div
                {...getRootProps()}
                className={`rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                }`}
              >
                <input {...getInputProps()} />
                <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-300 mb-2 block" />
                <p className="text-xs font-medium text-slate-500">
                  Kéo thả hoặc nhấn để chọn file
                </p>
              </div>
            )}
            {attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {!locked &&
                  attachments.map((file, idx) => {
                    const { icon, color } = fileIcon(file.name);
                    return (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
                      >
                        <i className={`fa-solid ${icon} ${color} text-lg shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-800">{file.name}</p>
                          <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
                        </div>
                        <button type="button" onClick={() => openFile(file)} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                          <i className="fa-solid fa-eye text-xs" />
                        </button>
                        <button type="button" onClick={() => downloadFile(file)} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                          <i className="fa-solid fa-download text-xs" />
                        </button>
                        <button type="button" onClick={() => removeFile(idx)} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          {!locked && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(true)}
                className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveUpdate}
                disabled={submitting}
                className="h-10 px-5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Đang lưu..." : "Lưu cập nhật"}
              </button>
            </div>
          )}
        </section>
      </main>

      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Xác nhận hủy cập nhật?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Thông tin chưa lưu sẽ không được cập nhật. Bạn có chắc muốn hủy không?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCancelConfirmOpen(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600">
                Tiếp tục chỉnh sửa
              </button>
              <button
                onClick={() => {
                  setCancelConfirmOpen(false);
                  navigate("/danh-sach-goi-thau");
                }}
                className="h-9 px-5 rounded-xl bg-red-500 text-sm font-semibold text-white"
              >
                Hủy cập nhật
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
