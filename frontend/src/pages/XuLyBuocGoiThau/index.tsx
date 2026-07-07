import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUserApi, type LoginUserDto } from "@/services/api";
import { getRoleCode } from "@/hooks/useAccessLevel";
import type { KetQuaXuLy } from "@/pages/DanhSachGoiThau/xuLyBuocService";
import { getGoiThauChiTiet, type GoiThauDetail } from "@/services/goiThauApi";
import { uploadTaiLieuFiles, type DocumentPhase } from "@/services/fileApi";
import {
  formatWorkflowKetQua,
  getWorkflowState,
  getWorkflowStepDetail,
  processStep,
  type WorkflowStepStateDto,
} from "@/services/workflowApi";
import { useFileAttachment } from "@/hooks/useFileAttachment";
import { fileIcon, formatBytes, openFile, downloadFile } from "@/util/fileAttachment";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function buildWorkflowPanelRefreshState() {
  return {
    workflowDocumentRefreshKey: Date.now(),
  };
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400";
const readonlyCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";
const DISPLAY_DASH = "—";

function normalizeDisplayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : DISPLAY_DASH;
}

function formatMoneyDisplay(value?: number | null) {
  if (value == null) return DISPLAY_DASH;
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

function getHttpStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  return (error as { response?: { status?: number } }).response?.status;
}

function isWaitingForApprovalStep(step?: WorkflowStepStateDto | null) {
  return Boolean(step && (step.trangThai === "CHO_KY_DUYET" || step.phaHienTai === "KY_DUYET"));
}

function buildFormFromStep(
  backendStep: WorkflowStepStateDto,
  params: {
    goiThauId: string;
    viewingStep: string;
    currentUserName?: string | null;
    tenderCreatorName?: string | null;
  },
): FormData {
  const waitingForApproval = isWaitingForApprovalStep(backendStep);
  const ketQua = formatWorkflowKetQua(backendStep.ketQua)
    || (waitingForApproval
      ? "Chờ ký duyệt"
      : backendStep.ngayHoanThanh
        ? "Duyệt"
        : "Chờ xử lý");

  return {
    goiThauId: params.goiThauId,
    buocWorkflow: backendStep.tenBuoc || params.viewingStep,
    nguoiXuLy: backendStep.tenNguoiXuLy || params.currentUserName || params.tenderCreatorName || "",
    ngayXuLy: backendStep.ngayXuLy?.slice(0, 10) || todayInputValue(),
    nguoiKyDuyet: backendStep.tenNguoiKyDuyet || "",
    ngayKyDuyet: backendStep.ngayKyDuyet?.slice(0, 10) || "",
    ketQua,
    ghiChu: backendStep.ghiChu || "",
    lyDoKhongDuyet: backendStep.lyDoKhongDuyet || "",
    taiLieuDinhKem: [],
  };
}

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
  const [workflowState, setWorkflowState] = useState<Awaited<ReturnType<typeof getWorkflowState>> | null>(null);
  const [goiThauDetail, setGoiThauDetail] = useState<GoiThauDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>(emptyForm(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<"" | KetQuaXuLy>("");
  const [rejectReason, setRejectReason] = useState("");
  const [locked, setLocked] = useState(readonlyMode);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoginUserDto | null>(null);
  const { attachments, getRootProps, getInputProps, isDragActive, removeFile } =
    useFileAttachment();
  const isAdminObserver = currentUser ? getRoleCode(currentUser) === "ADMIN" : false;

  useEffect(() => {
    const goiThauId = Number(id.replace(/^GT/i, ""));
    if (!Number.isFinite(goiThauId) || goiThauId <= 0) return;

    let cancelled = false;
    setBackendLoading(true);
    setBackendError("");
    setWorkflowState(null);
    setGoiThauDetail(null);

    const loadStep = async () => {
      const workflowStatePromise = getWorkflowState(goiThauId).catch(() => null);
      const currentUserPromise = getCurrentUserApi().catch(() => null);
      const goiThauDetailPromise = getGoiThauChiTiet(goiThauId).catch(() => null);
      void goiThauDetailPromise.then((detail) => {
        if (!cancelled) setGoiThauDetail(detail);
      });
      const targetStepId = stepId ?? (readonlyMode
        ? undefined
        : (await workflowStatePromise)?.currentSteps?.[0]?.stepInstanceId);

      if (!targetStepId) {
        if (!readonlyMode) {
          setLocked(true);
          setBackendError("Bước đã được xử lý trước đó.");
        }
        return;
      }

      const [backendStep, workflowStateResult, currentUser, goiThauDetailResult] = await Promise.all([
        getWorkflowStepDetail(goiThauId, targetStepId),
        workflowStatePromise,
        currentUserPromise,
        goiThauDetailPromise,
      ]);
      if (cancelled) return;

      setCurrentUser(currentUser);
      setStep(backendStep);
      const isAdmin = currentUser ? getRoleCode(currentUser) === "ADMIN" : false;
      setWorkflowState(workflowStateResult);
      setGoiThauDetail(goiThauDetailResult);
      const isDone = readonlyMode || Boolean(backendStep.ngayHoanThanh)
        || backendStep.trangThai === "HOAN_TAT" || backendStep.trangThai === "COMPLETED";

      setForm(buildFormFromStep(backendStep, {
        goiThauId: id,
        viewingStep,
        currentUserName: currentUser?.hoTen,
        tenderCreatorName: workflowStateResult?.tenNguoiTao,
      }));
      const waitingForApproval = isWaitingForApprovalStep(backendStep);
      const nextKetQua = formatWorkflowKetQua(backendStep.ketQua)
        || (waitingForApproval ? "Chờ ký duyệt" : backendStep.ngayHoanThanh ? "Duyệt" : "Chờ xử lý");
      setDecision(nextKetQua === "Không duyệt" || nextKetQua === "Duyệt" ? nextKetQua as KetQuaXuLy : "");
      setRejectReason(backendStep.lyDoKhongDuyet || "");
      setLocked(isDone || isAdmin);
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

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateProcessingPhase() {
    const next: Record<string, string> = {};
    if (!form.nguoiXuLy.trim()) next.nguoiXuLy = "Vui lòng nhập người xử lý";
    if (!form.ngayXuLy) next.ngayXuLy = "Vui lòng chọn ngày xử lý";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateApprovalPhase() {
    const next: Record<string, string> = {};
    if (!form.nguoiKyDuyet.trim()) next.nguoiKyDuyet = "Vui lòng nhập người ký duyệt";
    if (!form.ngayKyDuyet) next.ngayKyDuyet = "Vui lòng chọn ngày ký duyệt";
    if (!decision) next.ketQua = "Vui lòng chọn kết quả duyệt";
    if (decision === "Không duyệt" && !rejectReason.trim()) {
      next.lyDoKhongDuyet = "Vui lòng nhập lý do không duyệt";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveUpdate() {
    if (isAdminObserver) {
      toast.error("Admin chỉ có quyền quan sát, không được cập nhật bước gói thầu.");
      return;
    }

    const goiThauId = Number(id.replace(/^GT/i, ""));
    if (!Number.isFinite(goiThauId) || goiThauId <= 0 || !step?.id || !step.rowVersion) {
      toast.error("Không đủ dữ liệu bước từ hệ thống. Vui lòng tải lại trang.");
      return;
    }

    const waitingForApproval = isWaitingForApprovalStep(step);
    if (waitingForApproval) {
      if (!validateApprovalPhase()) return;
    } else if (!validateProcessingPhase()) {
      return;
    }

    setSubmitting(true);
    try {
      const documentPhase: DocumentPhase = waitingForApproval ? "Approval" : "Processing";
      let uploadedFileNames = attachments.map((file) => file.name);

      if (attachments.length > 0) {
        try {
          const uploaded = await uploadTaiLieuFiles(
            {
              files: attachments,
              goiThauId,
              workflowStepInstanceId: step.id,
              loaiTaiLieu: "HOSO_DUTHAU",
              documentPhase,
            },
            { skipAuthToast: true },
          );
          uploadedFileNames = uploaded.map((item) => item.fileName);
        } catch (error) {
          if (getHttpStatus(error) === 403) {
            toast.error("Bạn không có quyền upload tài liệu cho bước này.");
            return;
          }
          throw error;
        }
      }

      if (!waitingForApproval) {
        const result = await processStep(goiThauId, {
          hanhDong: "APPROVE",
          ghiChu: form.ghiChu,
          workflowStepInstanceId: step.id,
          rowVersion: step.rowVersion,
          taiLieuDinhKem: uploadedFileNames.join(", ") || undefined,
          ngayXuLy: form.ngayXuLy || undefined,
        });

        toast.success(result.message || "Đã lưu và gửi ký duyệt. Hồ sơ đang chờ kết quả ký duyệt.");
        const focusStepId = result.currentStepId ?? result.newStepId ?? step.id;
        navigate(`/danh-sach-goi-thau?goiThauId=GT${goiThauId}&focusStepId=${focusStepId}`, {
          state: buildWorkflowPanelRefreshState(),
        });
        return;
      }

      const result = await processStep(goiThauId, {
        hanhDong: decision === "Không duyệt" ? "KHONG_DUYET" : "DUYET",
        ghiChu: decision === "Không duyệt" ? rejectReason.trim() : form.ghiChu,
        workflowStepInstanceId: step.id,
        rowVersion: step.rowVersion,
        taiLieuDinhKem: uploadedFileNames.join(", ") || undefined,
        nguoiKyDuyet: form.nguoiKyDuyet || undefined,
        ngayKyDuyet: form.ngayKyDuyet || undefined,
        ketQua: decision === "Không duyệt" ? "KHONG_DUYET" : "DUYET",
      });

      toast.success(result.message || "Cập nhật kết quả ký duyệt thành công.");
      setErrors({});
      const focusStepId = result.currentStepId ?? result.newStepId ?? step.id;
      navigate(`/danh-sach-goi-thau?goiThauId=GT${goiThauId}&focusStepId=${focusStepId}`, {
        state: buildWorkflowPanelRefreshState(),
      });
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật bước.");
    } finally {
      setSubmitting(false);
    }
  }

  const waitingForApproval = isWaitingForApprovalStep(step);
  const processFieldsLocked = locked || waitingForApproval;
  const showApprovalSection = waitingForApproval || Boolean(step?.ngayHoanThanh) || step?.trangThai === "HOAN_TAT" || step?.trangThai === "COMPLETED";
  const approvalFieldsLocked = locked || !waitingForApproval;
  const displayedResult = waitingForApproval && decision ? decision : form.ketQua;
  const primaryButtonLabel = waitingForApproval
    ? decision === "Duyệt"
      ? "Hoàn thành bước"
      : decision === "Không duyệt"
        ? "Cập nhật kết quả"
        : "Cập nhật kết quả ký duyệt"
    : "Lưu và gửi ký duyệt";

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
          {normalizeDisplayValue(goiThauDetail?.maGoiThau || id)}
        </span>
      </header>

      <main className="p-4 lg:p-6 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold text-blue-700">
                {normalizeDisplayValue(goiThauDetail?.maGoiThau || id)}
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {normalizeDisplayValue(goiThauDetail?.tenGoiThau)}
              </h2>
              <div className="mt-2 grid gap-1 text-sm text-slate-500">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-slate-400">Hình thức đấu thầu:</span>
                  <span className="font-medium text-slate-700">
                    {normalizeDisplayValue(goiThauDetail?.tenHinhThuc)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-slate-400">Giá trị gói thầu:</span>
                  <span className="font-medium text-slate-700">
                    {formatMoneyDisplay(goiThauDetail?.nganSach)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-slate-400">Đơn vị/khoa phòng:</span>
                  <span className="font-medium text-slate-700">
                    {normalizeDisplayValue(goiThauDetail?.tenKhoaPhong || workflowState?.tenKhoaPhong)}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm">
              <span className="text-slate-400">Kết quả xử lý: </span>
              <span
                className={`font-semibold ${
                  displayedResult === "Duyệt"
                    ? "text-emerald-600"
                    : displayedResult === "Không duyệt"
                      ? "text-red-600"
                      : "text-amber-600"
                }`}
              >
                {displayedResult}
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
          {waitingForApproval && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Hồ sơ đang chờ kết quả ký duyệt. Phần thông tin xử lý cũ đã được khóa, bạn chỉ có thể cập nhật kết quả ký duyệt bên dưới.
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
                readOnly
                value={form.nguoiXuLy}
                className={errors.nguoiXuLy ? inputErrCls : readonlyCls}
              />
              {errors.nguoiXuLy && <p className="mt-1 text-xs text-red-500">{errors.nguoiXuLy}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Ngày xử lý <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                disabled={processFieldsLocked}
                value={form.ngayXuLy}
                onChange={(e) => updateField("ngayXuLy", e.target.value)}
                className={errors.ngayXuLy ? inputErrCls : processFieldsLocked ? readonlyCls : inputCls}
              />
              {errors.ngayXuLy && <p className="mt-1 text-xs text-red-500">{errors.ngayXuLy}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Ghi chú</label>
            <textarea
              rows={4}
              disabled={processFieldsLocked}
              value={form.ghiChu}
              onChange={(e) => updateField("ghiChu", e.target.value)}
              className={`${processFieldsLocked ? readonlyCls : inputCls} resize-none`}
              placeholder="Ví dụ: chờ báo giá, chờ họp hội đồng, nhà cung cấp xin gia hạn..."
            />
          </div>

          {showApprovalSection && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-4">
              {waitingForApproval && (
                <div className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-amber-700">
                  Hồ sơ đang chờ kết quả ký duyệt. Sau khi có kết quả, vui lòng cập nhật thông tin ký duyệt bên dưới.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Người ký duyệt <span className="text-red-500">*</span>
                  </label>
                  <input
                    disabled={approvalFieldsLocked}
                    value={form.nguoiKyDuyet}
                    onChange={(e) => updateField("nguoiKyDuyet", e.target.value)}
                    className={errors.nguoiKyDuyet ? inputErrCls : approvalFieldsLocked ? readonlyCls : inputCls}
                    placeholder="VD: Giám đốc / Phó giám đốc / Kế toán trưởng..."
                  />
                  {errors.nguoiKyDuyet && <p className="mt-1 text-xs text-red-500">{errors.nguoiKyDuyet}</p>}
                </div>
                <div>
                  <label className={labelCls}>
                    Ngày ký duyệt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={approvalFieldsLocked}
                    value={form.ngayKyDuyet}
                    onChange={(e) => updateField("ngayKyDuyet", e.target.value)}
                    className={errors.ngayKyDuyet ? inputErrCls : approvalFieldsLocked ? readonlyCls : inputCls}
                  />
                  {errors.ngayKyDuyet && <p className="mt-1 text-xs text-red-500">{errors.ngayKyDuyet}</p>}
                </div>
                <div>
                  <label className={labelCls}>
                    Kết quả duyệt <span className="text-red-500">*</span>
                  </label>
                  {approvalFieldsLocked ? (
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

              {waitingForApproval && decision === "Không duyệt" && (
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
            </div>
          )}

          <div>
            <label className={labelCls}>{waitingForApproval ? "Tài liệu đã ký" : "Tài liệu đính kèm"}</label>
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
                {attachments.map((file, idx) => {
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
                      {!locked && (
                        <button type="button" onClick={() => removeFile(idx)} className="w-7 h-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {form.lyDoKhongDuyet && (
            <div>
              <label className={labelCls}>Lý do không duyệt</label>
              <textarea readOnly rows={3} value={form.lyDoKhongDuyet} className={`${readonlyCls} resize-none`} />
            </div>
          )}

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
                {submitting ? "Đang lưu..." : primaryButtonLabel}
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
