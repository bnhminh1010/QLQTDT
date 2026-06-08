import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  type Buoc,
  type LoaiBuoc,
  type TrangThaiBuoc,
  type DieuKienChuyen,
  type HinhThucQT,
  HINH_THUC_OPTIONS,
  addQuyTrinh,
  updateQuyTrinh,
  getQuyTrinhById,
  generateQuyTrinhId,
} from "@/pages/DanhSachQuyTrinh/quyTrinhService";

/* ─── Constants ──────────────────────────────────────────────── */
const DON_VI_OPTIONS = [
  "K/p mua sắm",
  "Tổ kiểm tra giá",
  "Giám đốc BV",
  "Phòng Kế hoạch",
  "Phòng Tài chính",
  "Phòng HCQT",
  "Hội đồng thầu",
  "Đơn vị khác",
];

const VAI_TRO_OPTIONS = [
  "Admin",
  "Quản lý",
  "Nhân viên",
  "Tổ kiểm tra giá",
  "Hội đồng thầu",
  "Giám đốc BV",
];

const LOAI_BUOC_OPTIONS: LoaiBuoc[] = ["Bắt đầu", "Thường", "Kết thúc"];
const TRANG_THAI_BUOC_OPTIONS: TrangThaiBuoc[] = [
  "Đang xử lý",
  "Chờ duyệt",
  "Hoàn tất",
];
const DIEU_KIEN_OPTIONS: DieuKienChuyen[] = [
  "Duyệt",
  "Từ chối",
  "Yêu cầu kiểm tra",
  "Trả về",
];

const HT_BADGE: Record<HinhThucQT, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};

const LOAI_BADGE: Record<LoaiBuoc, string> = {
  "Bắt đầu": "bg-emerald-100 text-emerald-700",
  "Thường": "bg-blue-100 text-blue-700",
  "Kết thúc": "bg-red-100 text-red-600",
};

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

/* ─── Empty step ─────────────────────────────────────────────── */
function emptyStep(): Omit<Buoc, "id"> {
  return {
    ten: "",
    loai: "Thường",
    donViPhuTrach: DON_VI_OPTIONS[0],
    vaiTroXuLy: VAI_TRO_OPTIONS[0],
    slaNgay: 1,
    trangThaiMacDinh: "Đang xử lý",
    dieuKienChuyen: ["Duyệt"],
    buocTiepTheoId: "",
    moTa: "",
  };
}

/* ─── Component ──────────────────────────────────────────────── */
export default function LapQuyTrinh() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = !!editId;

  /* ── Form state ── */
  const [tenQuyTrinh, setTenQuyTrinh] = useState("");
  const [tenErr, setTenErr] = useState("");
  const [hinhThuc, setHinhThuc] = useState<HinhThucQT | "">("");
  const [hinhThucErr, setHinhThucErr] = useState("");
  const [buocList, setBuocList] = useState<Buoc[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  /* ── Dirty tracking ── */
  const [isDirty, setIsDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  /* ── Step modal ── */
  type StepMode = "add" | "edit";
  const [stepModal, setStepModal] = useState<{
    mode: StepMode;
    targetId?: string;
  } | null>(null);
  const [stepForm, setStepForm] = useState<Omit<Buoc, "id">>(emptyStep());
  const [stepErrs, setStepErrs] = useState<
    Partial<Record<keyof Omit<Buoc, "id">, string>>
  >({});

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState<Buoc | null>(null);

  /* ── Load existing if editing ── */
  useEffect(() => {
    if (editId) {
      const qt = getQuyTrinhById(editId);
      if (qt) {
        setTenQuyTrinh(qt.ten);
        setHinhThuc(qt.hinhThuc);
        setBuocList(qt.buocList);
      } else {
        toast.error("Không tìm thấy quy trình");
        navigate("/danh-sach-quy-trinh");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  /* ── beforeunload ── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  /* ── Navigate with dirty check ── */
  function navWithCheck(path: string) {
    if (isDirty) {
      setPendingNavPath(path);
      setLeaveOpen(true);
    } else {
      navigate(path);
    }
  }

  function confirmLeave() {
    setIsDirty(false);
    setLeaveOpen(false);
    if (pendingNavPath) navigate(pendingNavPath);
  }

  /* ── Validate tên quy trình ── */
  function validateTen(val: string): string {
    const trimmed = val.trim();
    if (!trimmed) return "Vui lòng nhập tên quy trình";
    if (trimmed.length < 3) return "Tên quy trình tối thiểu 3 ký tự";
    if (trimmed.length > 255) return "Tên quy trình không được vượt quá 255 ký tự";
    return "";
  }

  /* ── Step modal helpers ── */
  function openAdd() {
    setStepForm(emptyStep());
    setStepErrs({});
    setStepModal({ mode: "add" });
  }

  function openEdit(b: Buoc) {
    setStepForm({
      ten: b.ten,
      loai: b.loai,
      donViPhuTrach: b.donViPhuTrach,
      vaiTroXuLy: b.vaiTroXuLy,
      slaNgay: b.slaNgay,
      trangThaiMacDinh: b.trangThaiMacDinh,
      dieuKienChuyen: [...b.dieuKienChuyen],
      buocTiepTheoId: b.buocTiepTheoId,
      moTa: b.moTa,
    });
    setStepErrs({});
    setStepModal({ mode: "edit", targetId: b.id });
  }

  function validateStep(): boolean {
    const errs: typeof stepErrs = {};
    if (!stepForm.ten.trim()) errs.ten = "Vui lòng nhập tên bước";
    if (!stepForm.loai) errs.loai = "Vui lòng chọn loại bước";
    if (!stepForm.donViPhuTrach) errs.donViPhuTrach = "Vui lòng chọn đơn vị";
    if (!stepForm.slaNgay || stepForm.slaNgay <= 0)
      errs.slaNgay = "SLA phải lớn hơn 0";
    else if (!Number.isInteger(Number(stepForm.slaNgay)))
      errs.slaNgay = "SLA phải là số nguyên";
    setStepErrs(errs);
    return Object.keys(errs).length === 0;
  }

  function saveStep() {
    if (!validateStep()) return;
    if (stepModal?.mode === "add") {
      const newB: Buoc = { ...stepForm, id: Date.now().toString() };
      setBuocList((prev) => [...prev, newB]);
      toast.success("Đã thêm bước");
    } else {
      setBuocList((prev) =>
        prev.map((b) =>
          b.id === stepModal?.targetId ? { ...b, ...stepForm } : b,
        ),
      );
      toast.success("Đã cập nhật bước");
    }
    markDirty();
    setStepModal(null);
  }

  function doDelete() {
    if (!deleteTarget) return;
    setBuocList((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
    markDirty();
    toast.success("Đã xóa bước");
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setBuocList((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    markDirty();
  }

  function moveDown(idx: number) {
    if (idx === buocList.length - 1) return;
    setBuocList((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    markDirty();
  }

  function toggleDieuKien(dk: DieuKienChuyen) {
    setStepForm((f) => ({
      ...f,
      dieuKienChuyen: f.dieuKienChuyen.includes(dk)
        ? f.dieuKienChuyen.filter((x) => x !== dk)
        : [...f.dieuKienChuyen, dk],
    }));
  }

  /* ── Lưu quy trình ── */
  function handleSave() {
    const tenErrMsg = validateTen(tenQuyTrinh);
    setTenErr(tenErrMsg);
    if (tenErrMsg) return;

    if (!hinhThuc) {
      setHinhThucErr("Vui lòng chọn hình thức đấu thầu");
      return;
    }
    setHinhThucErr("");

    if (buocList.length === 0) {
      setSaveErr("Vui lòng thêm ít nhất 1 bước");
      return;
    }

    const hasStart = buocList.some((b) => b.loai === "Bắt đầu");
    const hasEnd = buocList.some((b) => b.loai === "Kết thúc");
    if (!hasStart) {
      setSaveErr(
        "Quy trình phải có ít nhất 1 bước Bắt đầu. Chỉnh sửa loại bước hoặc thêm bước mới.",
      );
      return;
    }
    if (!hasEnd) {
      setSaveErr(
        "Quy trình phải có ít nhất 1 bước Kết thúc. Chỉnh sửa loại bước hoặc thêm bước mới.",
      );
      return;
    }
    if (startCount > 1) {
      setSaveErr("Quy trình chỉ được có đúng 1 bước Bắt đầu.");
      return;
    }
    if (endCount > 1) {
      setSaveErr("Quy trình chỉ được có đúng 1 bước Kết thúc.");
      return;
    }

    setSaveErr("");
    setSaving(true);

    setTimeout(() => {
      if (isEdit && editId) {
        updateQuyTrinh({
          id: editId,
          ten: tenQuyTrinh.trim(),
          hinhThuc: hinhThuc as HinhThucQT,
          buocList,
          trangThai: "Đang hoạt động",
          ngayTao: new Date().toISOString(),
        });
        toast.success("Đã cập nhật quy trình thành công");
      } else {
        addQuyTrinh({
          id: generateQuyTrinhId(),
          ten: tenQuyTrinh.trim(),
          hinhThuc: hinhThuc as HinhThucQT,
          buocList,
          trangThai: "Đang hoạt động",
          ngayTao: new Date().toISOString(),
        });
        toast.success("Quy trình đã được lưu thành công");
      }
      setIsDirty(false);
      setSaving(false);
      navigate("/danh-sach-quy-trinh");
    }, 600);
  }

  /* ── Computed ── */
  const startCount = buocList.filter((b) => b.loai === "Bắt đầu").length;
  const endCount = buocList.filter((b) => b.loai === "Kết thúc").length;
  const tenLen = tenQuyTrinh.trim().length;

  // Orphan: not "Bắt đầu" and not pointed to by any step
  const pointedToIds = new Set(
    buocList.map((b) => b.buocTiepTheoId).filter(Boolean),
  );
  const orphanIds = new Set(
    buocList
      .filter((b) => b.loai !== "Bắt đầu" && !pointedToIds.has(b.id))
      .map((b) => b.id),
  );

  /* ── Render ── */
  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navWithCheck("/danh-sach-quy-trinh")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <i className="fa-solid fa-diagram-project text-slate-400" />
            <span className="text-slate-800 font-semibold">
              {isEdit ? "Chỉnh sửa quy trình" : "Lập quy trình mới"}
            </span>
            {isDirty && (
              <span className="text-[11px] text-amber-500 font-medium">
                (Chưa lưu)
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <i className="fa-solid fa-circle-notch fa-spin text-xs" />
          ) : (
            <i className="fa-solid fa-floppy-disk text-xs" />
          )}
          {saving ? "Đang lưu..." : "Lưu quy trình"}
        </button>
      </header>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Error banner */}
        {saveErr && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <i className="fa-solid fa-circle-xmark shrink-0" />
            {saveErr}
          </div>
        )}

        {/* THÔNG TIN CHUNG */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-blue-500" />
            Thông tin quy trình
          </h2>

          {/* Tên */}
          <div>
            <label className={labelCls}>
              Tên quy trình <span className="text-red-500">*</span>
            </label>
            <input
              className={tenErr ? inputErrCls : inputCls}
              placeholder="Ví dụ: Quy trình mua sắm vật tư y tế 2025"
              value={tenQuyTrinh}
              maxLength={260}
              onChange={(e) => {
                setTenQuyTrinh(e.target.value);
                setTenErr(validateTen(e.target.value));
                markDirty();
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

          {/* Hình thức */}
          <div>
            <label className={labelCls}>
              Hình thức đấu thầu áp dụng{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              className={hinhThucErr ? inputErrCls : inputCls}
              value={hinhThuc}
              onChange={(e) => {
                setHinhThuc(e.target.value as HinhThucQT);
                setHinhThucErr("");
                markDirty();
              }}
            >
              <option value="">-- Chọn hình thức --</option>
              {HINH_THUC_OPTIONS.map((ht) => (
                <option key={ht} value={ht}>
                  {ht}
                </option>
              ))}
            </select>
            {hinhThucErr && (
              <p className="text-xs text-red-500 mt-1">{hinhThucErr}</p>
            )}
          </div>

          {hinhThuc && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${HT_BADGE[hinhThuc]}`}
            >
              {hinhThuc}
            </span>
          )}
        </section>

        {/* DANH SÁCH BƯỚC */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-list-ol text-blue-500" />
              Các bước thực hiện
              {buocList.length > 0 && (
                <span className="ml-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {buocList.length} bước
                </span>
              )}
            </h2>
            <button
              onClick={openAdd}
              className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-plus" />
              Thêm bước
            </button>
          </div>

          {/* Start/End indicator */}
          {buocList.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              <span
                className={`text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${startCount >= 1 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
              >
                <i
                  className={`fa-solid ${startCount >= 1 ? "fa-check" : "fa-xmark"} text-[10px]`}
                />
                Bắt đầu: {startCount}
              </span>
              <span
                className={`text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${endCount >= 1 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}
              >
                <i
                  className={`fa-solid ${endCount >= 1 ? "fa-check" : "fa-xmark"} text-[10px]`}
                />
                Kết thúc: {endCount}
              </span>
            </div>
          )}

          {buocList.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <i className="fa-regular fa-rectangle-list text-3xl mb-3 block" />
              <p className="text-sm">
                Chưa có bước nào. Nhấn <strong>Thêm bước</strong> để bắt đầu.
              </p>
              <p className="text-xs mt-1 text-slate-400">
                Quy trình cần ít nhất 1 bước Bắt đầu và 1 bước Kết thúc
              </p>
            </div>
          ) : (
            <ol className="space-y-2.5">
              {buocList.map((b, idx) => {
                const nextStep = b.buocTiepTheoId
                  ? buocList.find((x) => x.id === b.buocTiepTheoId)
                  : null;
                return (
                  <li
                    key={b.id}
                    className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${orphanIds.has(b.id) ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
                  >
                    {/* Badge số thứ tự với màu theo loại */}
                    <span
                      className={`w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${b.loai === "Bắt đầu" ? "bg-emerald-500" : b.loai === "Kết thúc" ? "bg-red-500" : "bg-blue-600"}`}
                    >
                      {idx + 1}
                    </span>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {b.ten}
                        </p>
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${LOAI_BADGE[b.loai]}`}
                        >
                          {b.loai}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <i className="fa-solid fa-building text-slate-400" />
                          {b.donViPhuTrach}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <i className="fa-regular fa-clock text-slate-400" />
                          SLA: {b.slaNgay} ngày
                        </span>
                        {b.vaiTroXuLy && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <i className="fa-solid fa-user text-slate-400" />
                            {b.vaiTroXuLy}
                          </span>
                        )}
                        {b.dieuKienChuyen.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            → {b.dieuKienChuyen.join(", ")}
                          </span>
                        )}
                        {nextStep && (
                          <span className="text-[11px] text-blue-500 flex items-center gap-1">
                            <i className="fa-solid fa-arrow-right text-[10px]" />
                            {nextStep.ten}
                          </span>
                        )}
                        {orphanIds.has(b.id) && (
                          <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                            <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                            Bước mồ côi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Di chuyển lên"
                        disabled={idx === 0}
                        onClick={() => moveUp(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <i className="fa-solid fa-chevron-up text-xs" />
                      </button>
                      <button
                        type="button"
                        title="Di chuyển xuống"
                        disabled={idx === buocList.length - 1}
                        onClick={() => moveDown(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <i className="fa-solid fa-chevron-down text-xs" />
                      </button>
                      <button
                        type="button"
                        title="Chỉnh sửa"
                        onClick={() => openEdit(b)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <i className="fa-solid fa-pen text-xs" />
                      </button>
                      <button
                        type="button"
                        title="Xóa"
                        onClick={() => setDeleteTarget(b)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <i className="fa-solid fa-trash text-xs" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* FLOW PREVIEW */}
        {buocList.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-diagram-project text-blue-500" />
              Xem trước luồng quy trình
            </h2>
            {orphanIds.size > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                <i className="fa-solid fa-triangle-exclamation" />
                Có {orphanIds.size} bước mồ côi (không được trỏ đến từ bước nào).
                Kiểm tra lại điều kiện chuyển tiếp.
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {buocList.map((b, idx) => (
                <div key={b.id} className="flex items-center gap-1.5">
                  <div
                    className={`flex flex-col items-center px-3 py-2 rounded-xl border text-center min-w-[80px] ${
                      b.loai === "Bắt đầu"
                        ? "bg-emerald-50 border-emerald-300"
                        : b.loai === "Kết thúc"
                          ? "bg-red-50 border-red-300"
                          : orphanIds.has(b.id)
                            ? "bg-amber-50 border-amber-300"
                            : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold mb-0.5 ${
                        b.loai === "Bắt đầu"
                          ? "text-emerald-600"
                          : b.loai === "Kết thúc"
                            ? "text-red-600"
                            : orphanIds.has(b.id)
                              ? "text-amber-600"
                              : "text-blue-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-medium text-slate-700 break-words max-w-[80px] leading-tight">
                      {b.ten}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{b.slaNgay}N</span>
                  </div>
                  {idx < buocList.length - 1 && (
                    <i className="fa-solid fa-arrow-right text-slate-300 text-xs" />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── STEP MODAL (Add + Edit) ───────────────────────────── */}
      {stepModal && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 my-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {stepModal.mode === "add" ? "Thêm bước mới" : "Chỉnh sửa bước"}
              </h3>
              <button
                onClick={() => setStepModal(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Tên bước */}
              <div>
                <label className={labelCls}>
                  Tên bước <span className="text-red-500">*</span>
                </label>
                <input
                  className={stepErrs.ten ? inputErrCls : inputCls}
                  placeholder="Ví dụ: Đề xuất mua sắm"
                  value={stepForm.ten}
                  onChange={(e) => {
                    setStepForm((f) => ({ ...f, ten: e.target.value }));
                    setStepErrs((e2) => ({ ...e2, ten: "" }));
                  }}
                />
                {stepErrs.ten && (
                  <p className="text-xs text-red-500 mt-1">{stepErrs.ten}</p>
                )}
              </div>

              {/* Loại bước */}
              <div>
                <label className={labelCls}>
                  Loại bước <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {LOAI_BUOC_OPTIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setStepForm((f) => ({ ...f, loai: l }));
                        setStepErrs((e2) => ({ ...e2, loai: "" }));
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        stepForm.loai === l
                          ? l === "Bắt đầu"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : l === "Kết thúc"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-blue-600 text-white border-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {stepErrs.loai && (
                  <p className="text-xs text-red-500 mt-1">{stepErrs.loai}</p>
                )}
              </div>

              {/* Đơn vị + Vai trò */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Đơn vị phụ trách <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={stepErrs.donViPhuTrach ? inputErrCls : inputCls}
                    value={stepForm.donViPhuTrach}
                    onChange={(e) => {
                      setStepForm((f) => ({
                        ...f,
                        donViPhuTrach: e.target.value,
                      }));
                      setStepErrs((e2) => ({ ...e2, donViPhuTrach: "" }));
                    }}
                  >
                    {DON_VI_OPTIONS.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  {stepErrs.donViPhuTrach && (
                    <p className="text-xs text-red-500 mt-1">
                      {stepErrs.donViPhuTrach}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Vai trò xử lý</label>
                  <select
                    className={inputCls}
                    value={stepForm.vaiTroXuLy}
                    onChange={(e) =>
                      setStepForm((f) => ({ ...f, vaiTroXuLy: e.target.value }))
                    }
                  >
                    {VAI_TRO_OPTIONS.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SLA + Trạng thái mặc định */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    SLA (số ngày) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className={stepErrs.slaNgay ? inputErrCls : inputCls}
                    value={stepForm.slaNgay}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setStepForm((f) => ({
                        ...f,
                        slaNgay: isNaN(v) ? 1 : v,
                      }));
                      setStepErrs((e2) => ({ ...e2, slaNgay: "" }));
                    }}
                  />
                  {stepErrs.slaNgay && (
                    <p className="text-xs text-red-500 mt-1">
                      {stepErrs.slaNgay}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Trạng thái mặc định</label>
                  <select
                    className={inputCls}
                    value={stepForm.trangThaiMacDinh}
                    onChange={(e) =>
                      setStepForm((f) => ({
                        ...f,
                        trangThaiMacDinh: e.target.value as TrangThaiBuoc,
                      }))
                    }
                  >
                    {TRANG_THAI_BUOC_OPTIONS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Điều kiện chuyển tiếp */}
              <div>
                <label className={labelCls}>Điều kiện chuyển tiếp</label>
                <div className="flex flex-wrap gap-2">
                  {DIEU_KIEN_OPTIONS.map((dk) => (
                    <button
                      key={dk}
                      type="button"
                      onClick={() => toggleDieuKien(dk)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        stepForm.dieuKienChuyen.includes(dk)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {dk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bước tiếp theo */}
              <div>
                <label className={labelCls}>Bước tiếp theo</label>
                <select
                  className={inputCls}
                  value={stepForm.buocTiepTheoId}
                  onChange={(e) =>
                    setStepForm((f) => ({
                      ...f,
                      buocTiepTheoId: e.target.value,
                    }))
                  }
                >
                  <option value="">-- Không xác định --</option>
                  {buocList
                    .filter((b) => b.id !== stepModal?.targetId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.ten}
                      </option>
                    ))}
                </select>
              </div>

              {/* Mô tả */}
              <div>
                <label className={labelCls}>Mô tả (tuỳ chọn)</label>
                <textarea
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Ghi chú thêm về bước này..."
                  value={stepForm.moTa}
                  onChange={(e) =>
                    setStepForm((f) => ({ ...f, moTa: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setStepModal(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={saveStep}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {stepModal.mode === "add" ? "Thêm bước" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-1">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Xóa bước này?</h3>
              <p className="text-xs text-slate-500">
                Bước <strong>"{deleteTarget.ten}"</strong> sẽ bị xóa khỏi quy
                trình.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={doDelete}
                className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Xóa bước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVE CONFIRM ─────────────────────────────────────── */}
      {leaveOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Bạn có dữ liệu chưa lưu
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Nếu rời trang bây giờ, các thay đổi chưa lưu sẽ bị mất.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLeaveOpen(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Ở lại
              </button>
              <button
                onClick={confirmLeave}
                className="h-9 px-5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl"
              >
                Rời trang
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
