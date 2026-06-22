import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  formatVND,
  getGoiThauById,
  updateGoiThau,
} from "@/pages/DanhSachGoiThau/goiThauService";
import type { GoiThau } from "@/pages/DanhSachGoiThau/goiThauService";
import {
  completeXuLyBuoc,
  getCurrentStepName,
  getXuLyBuoc,
  getXuLyBuocByStep,
  type KetQuaXuLy,
  type XuLyBuocRecord,
} from "@/pages/DanhSachGoiThau/xuLyBuocService";
import { useFileAttachment } from "@/hooks/useFileAttachment";
import { fileIcon, formatBytes, openFile, downloadFile } from "@/util/fileAttachment";

const MOCK_CURRENT_USER = "Trần Văn B";

const FALLBACK_GOI_THAU: Record<string, GoiThau> = {
  "GT2025-001": {
    id: "GT2025-001",
    ten: "Mua sắm thiết bị y tế khoa Nội",
    hinhThuc: "Chỉ định thầu rút gọn",
    giaTriStr: "320,000,000",
    giaTriNum: 320000000,
    donVi: "Khoa Nội",
    trangThai: "Đang xử lý",
    detail: {
      nguonVon: "Ngân sách BV",
      ngayTao: "10/01/2025",
      hanHT: "30/04/2025",
      pct: "35.7%",
      buoc: "5/14",
    },
  },
  "GT2025-003": {
    id: "GT2025-003",
    ten: "Dịch vụ vệ sinh bệnh viện quý 3",
    hinhThuc: "Chào hàng cạnh tranh",
    giaTriStr: "850,000,000",
    giaTriNum: 850000000,
    donVi: "P.HCQT",
    trangThai: "Trễ hạn",
    detail: {
      nguonVon: "Tự chủ tài chính",
      ngayTao: "05/03/2025",
      hanHT: "29/03/2025",
      pct: "21.4%",
      buoc: "3/14",
    },
  },
  "GT2025-004": {
    id: "GT2025-004",
    ten: "Mua sắm thuốc điều trị ung thư",
    hinhThuc: "Đấu thầu rộng rãi",
    giaTriStr: "12,500,000,000",
    giaTriNum: 12500000000,
    donVi: "Khoa Dược",
    trangThai: "Chờ duyệt",
    detail: {
      nguonVon: "Ngân sách Nhà nước",
      ngayTao: "20/03/2025",
      hanHT: "30/06/2025",
      pct: "7.7%",
      buoc: "2/26",
    },
  },
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime() {
  return new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getCurrentStep(goiThauId: string) {
  if (goiThauId === "GT2025-003") return "Biên bản kiểm tra báo giá";
  if (goiThauId === "GT2025-004") return "Tờ trình chủ trương";
  return "Tờ trình phê duyệt dự toán";
}

const WORKFLOW_STEPS = [
  "Đề xuất mua sắm",
  "Tờ trình chủ trương",
  "Đăng tải yêu cầu báo giá",
  "Biên bản kiểm tra báo giá",
  "Tờ trình phê duyệt dự toán",
  "QĐ phê duyệt dự toán",
  "Tờ trình kế hoạch LCNT",
  "QĐ kế hoạch LCNT",
  "Đăng tải kế hoạch LCNT",
];

function getNextStep(currentStepName: string) {
  const idx = WORKFLOW_STEPS.indexOf(currentStepName);
  if (idx < 0) return "Bước tiếp theo";
  return WORKFLOW_STEPS[Math.min(idx + 1, WORKFLOW_STEPS.length - 1)];
}

function getPreviousStep(currentStepName: string) {
  const idx = WORKFLOW_STEPS.indexOf(currentStepName);
  if (idx <= 0) return WORKFLOW_STEPS[0];
  return WORKFLOW_STEPS[idx - 1];
}

function isStepBefore(stepName: string, currentStepName: string) {
  const stepIdx = WORKFLOW_STEPS.indexOf(stepName);
  const currentIdx = WORKFLOW_STEPS.indexOf(currentStepName);
  return stepIdx >= 0 && currentIdx >= 0 && stepIdx < currentIdx;
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400";
const readonlyCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

export default function XuLyBuocGoiThau() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const readonlyMode = searchParams.get("mode") === "view";
  const viewingStep = searchParams.get("step") || "";
  const goiThau = useMemo(
    () => getGoiThauById(id) ?? FALLBACK_GOI_THAU[id],
    [id],
  );
  const activeStepName = readonlyMode
    ? viewingStep
    : viewingStep || getCurrentStepName(id, getCurrentStep(id));
  const currentWorkflowStepName = getCurrentStepName(id, getCurrentStep(id));
  const existing = id
    ? readonlyMode
      ? getXuLyBuocByStep(id, activeStepName)
      : getXuLyBuoc(id)
    : null;
  const isHistoricalStep =
    readonlyMode && !existing && isStepBefore(activeStepName, currentWorkflowStepName);
  const initialLocked = readonlyMode || (!!existing && existing.ketQua !== "Chờ xử lý");
  const { attachments, getRootProps, getInputProps, isDragActive, removeFile } =
    useFileAttachment();

  const [form, setForm] = useState<XuLyBuocRecord>(() => ({
    goiThauId: id,
    tenGoiThau: goiThau?.ten ?? "",
    buocWorkflow: existing?.buocWorkflow ?? activeStepName,
    nguoiXuLy: existing?.nguoiXuLy ?? (readonlyMode ? "K/p mua sắm" : id === "GT2025-003" ? "Nguyễn Văn A" : ""),
    ngayXuLy: existing?.ngayXuLy ?? (readonlyMode ? "2025-03-12" : todayInputValue()),
    nguoiKyDuyet: existing?.nguoiKyDuyet ?? (readonlyMode ? "Trần Văn B" : ""),
    ngayKyDuyet: existing?.ngayKyDuyet ?? (readonlyMode ? "2025-03-12" : ""),
    ketQua:
      existing?.ketQua ??
      (readonlyMode && activeStepName !== currentWorkflowStepName ? "Duyệt" : "Chờ xử lý"),
    ghiChu:
      existing?.ghiChu ??
      (readonlyMode && activeStepName !== currentWorkflowStepName
        ? "Bước đã hoàn thành theo cấu hình workflow."
        : ""),
    lyDoKhongDuyet: existing?.lyDoKhongDuyet ?? "",
    taiLieuDinhKem: existing?.taiLieuDinhKem ?? [],
    thoiGianXuLy: existing?.thoiGianXuLy,
    thaoTacHeThong: existing?.thaoTacHeThong,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<"" | KetQuaXuLy>(
    existing && existing.ketQua !== "Chờ xử lý" ? existing.ketQua : "",
  );
  const [rejectReason, setRejectReason] = useState(existing?.lyDoKhongDuyet ?? "");
  const [locked, setLocked] = useState(initialLocked);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  if (
    readonlyMode &&
    !existing &&
    !isHistoricalStep &&
    (form.nguoiXuLy || form.ngayXuLy || form.nguoiKyDuyet || form.ngayKyDuyet || form.ghiChu)
  ) {
    setForm((prev) => ({
      ...prev,
      nguoiXuLy: "",
      ngayXuLy: "",
      nguoiKyDuyet: "",
      ngayKyDuyet: "",
      ketQua: "Chờ xử lý",
      ghiChu: "",
      lyDoKhongDuyet: "",
      taiLieuDinhKem: [],
    }));
  }

  if (!goiThau) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
          Không tìm thấy gói thầu cần xử lý.
        </div>
      </div>
    );
  }

  function updateField<K extends keyof XuLyBuocRecord>(field: K, value: XuLyBuocRecord[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateBase(extra: "approve" | "reject") {
    const next: Record<string, string> = {};
    if (!form.nguoiXuLy.trim()) next.nguoiXuLy = "Vui lòng nhập người xử lý";
    if (!form.ngayXuLy) next.ngayXuLy = "Vui lòng chọn ngày xử lý";
    if (!form.nguoiKyDuyet.trim()) next.nguoiKyDuyet = "Vui lòng nhập người ký duyệt";
    if (!form.ngayKyDuyet) next.ngayKyDuyet = "Vui lòng chọn ngày ký duyệt";
    if (
      form.ngayXuLy &&
      form.ngayKyDuyet &&
      form.ngayKyDuyet < form.ngayXuLy
    ) {
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

  function saveResult(ketQua: KetQuaXuLy, lyDoKhongDuyet = "") {
    const nextWorkflowStep =
      ketQua === "Duyệt"
        ? getNextStep(form.buocWorkflow)
        : getPreviousStep(form.buocWorkflow);
    const nextStep =
      ketQua === "Duyệt"
        ? `Chuyển sang bước "${nextWorkflowStep}"`
        : `Trả về bước "${nextWorkflowStep}" theo cấu hình workflow`;
    const record: XuLyBuocRecord = {
      ...form,
      ketQua,
      nguoiKyDuyet: form.nguoiKyDuyet || MOCK_CURRENT_USER,
      lyDoKhongDuyet,
      taiLieuDinhKem: [
        ...form.taiLieuDinhKem,
        ...attachments.map((file) => file.name),
      ],
      thoiGianXuLy: formatDateTime(),
      thaoTacHeThong: nextStep,
    };

    if (ketQua === "Duyệt") {
      completeXuLyBuoc(record, nextWorkflowStep);
      setForm(record);
      setLocked(true);
      const total = Number(goiThau.detail.buoc.split("/")[1]) || 14;
      const current = Number(goiThau.detail.buoc.split("/")[0]) || 0;
      const next = Math.min(current + 1, total);
      updateGoiThau({
        ...goiThau,
        trangThai: "Đang xử lý",
        detail: {
          ...goiThau.detail,
          buoc: `${next}/${total}`,
          pct: `${Math.round((next / total) * 100)}%`,
        },
      });
      toast.success(`Duyệt thành công. Đã chuyển sang bước: ${nextWorkflowStep}`);
    } else {
      const total = Number(goiThau.detail.buoc.split("/")[1]) || 14;
      const current = Number(goiThau.detail.buoc.split("/")[0]) || 1;
      const previous = Math.max(current - 1, 1);
      completeXuLyBuoc(record, nextWorkflowStep);
      setForm(record);
      setLocked(true);
      updateGoiThau({
        ...goiThau,
        trangThai: "Đang xử lý",
        detail: {
          ...goiThau.detail,
          buoc: `${previous}/${total}`,
          pct: `${Math.round((previous / total) * 100)}%`,
        },
      });
      toast.success("Cập nhật kết quả không duyệt thành công.");
    }
  }

  function saveUpdate() {
    if (!decision) {
      setErrors((prev) => ({
        ...prev,
        ketQua: "Vui lòng chọn kết quả duyệt",
      }));
      return;
    }
    const mode = decision === "Không duyệt" ? "reject" : "approve";
    if (!validateBase(mode)) return;
    saveResult(decision, decision === "Không duyệt" ? rejectReason.trim() : "");
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
            {[...form.taiLieuDinhKem, ...attachments.map((file) => file.name)].length > 0 && (
              <ul className="mt-3 space-y-2">
                {form.taiLieuDinhKem.map((name) => (
                  <li key={name} className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
                    <i className="fa-solid fa-paperclip mr-2 text-slate-400" />
                    {name}
                  </li>
                ))}
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
                className="h-10 px-5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Lưu cập nhật
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
