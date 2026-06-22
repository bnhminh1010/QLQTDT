import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import {
  type Buoc, type LoaiBuoc, type TrangThaiBuoc,
  type LoaiThoiHan, type HanhDongChuyen, type DieuKienKichHoat,
  type DieuKienChuyenTiep, type NhanhSongSong, type HinhThucQT,
  HINH_THUC_OPTIONS,
} from "@/pages/DanhSachQuyTrinh/quyTrinhService";
import http from "@/util/http";
import type { ApiResponse } from "@/services/types";

/* ─── Constants ──────────────────────────────────────────────── */
const DON_VI_OPTIONS = [
  "K/P mua sắm",
  "K/P sử dụng",
  "Tổ kiểm tra giá",
  "Tổ chuyên gia",
  "Tổ thẩm định",
  "Tư vấn LCNT",
  "Tư vấn thẩm định",
  "Chủ đầu tư",
  "CĐT + Nhà thầu",
  "Nhà thầu",
  "Nhà thầu tư vấn LCNT",
  "K/P mua sắm hoặc tư vấn LCNT",
];

const VAI_TRO_OPTIONS = [
  "Nhân viên K/P mua sắm",
  "Nhân viên K/P sử dụng",
  "Tổ kiểm tra giá",
  "Tổ chuyên gia",
  "Tổ thẩm định",
  "Tư vấn LCNT",
  "Tư vấn thẩm định",
  "Chủ đầu tư",
  "Nhà thầu",
  "CĐT + Nhà thầu",
];

const LOAI_BUOC_OPTIONS: LoaiBuoc[] = [
  "Bắt đầu",
  "Thường",
  "Ký duyệt",
  "Đăng tải",
  "Đánh giá/kiểm tra",
  "Hợp đồng",
  "Kết thúc",
];

const TRANG_THAI_BUOC_OPTIONS: TrangThaiBuoc[] = [
  "Chưa bắt đầu",
  "Đang xử lý",
  "Chờ ký duyệt",
  "Hoàn thành",
];

const NHOM_GIAI_DOAN_OPTIONS = [
  "Pháp lý gói thầu",
  "Tư vấn LCNT",
  "Tư vấn thẩm định",
  "Lựa chọn nhà thầu",
  "Hợp đồng",
  "Nghiệm thu/Thanh lý/Quyết toán",
];

const DON_VI_KY_OPTIONS = [
  "K/P mua sắm",
  "K/P mua sắm và Giám đốc BV",
  "Giám đốc BV",
  "PGĐ được ủy quyền",
  "Giám đốc BV hoặc PGĐ được ủy quyền",
  "Kế toán trưởng",
  "Tổ kiểm tra giá",
  "Tổ chuyên gia",
  "Tổ thẩm định",
  "Tư vấn LCNT",
  "Tư vấn thẩm định",
  "Chủ đầu tư",
  "CĐT + Nhà thầu",
  "Nhà thầu tư vấn LCNT",
  "K/P mua sắm hoặc tư vấn LCNT",
];

const VAI_TRO_KY_OPTIONS = [
  "Trưởng K/P",
  "Giám đốc BV",
  "PGĐ được ủy quyền",
  "Kế toán trưởng",
  "Ban Giám đốc",
  "Tổ kiểm tra giá",
  "Tổ chuyên gia",
  "Tổ thẩm định",
  "Chủ đầu tư",
  "Nhà thầu",
  "CĐT + Nhà thầu",
];

const HANH_DONG_OPTIONS: HanhDongChuyen[] = [
  "Hoàn thành / Duyệt",
  "Không duyệt",
  "Trả về",
  "Yêu cầu bổ sung",
  "Bỏ qua bước",
];

const DIEU_KIEN_KICH_HOAT_OPTIONS: DieuKienKichHoat[] = [
  "Luôn",
  "Theo vai trò",
  "Theo kết quả xử lý",
];

const KET_QUA_OPTIONS = ["Đạt", "Không đạt", "Cần bổ sung"];

const HT_BADGE: Partial<Record<HinhThucQT, string>> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu tự quyết định LCNT": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
  "Mua sắm trực tiếp": "bg-cyan-100 text-cyan-700",
  "Chào giá trực tuyến thông thường": "bg-indigo-100 text-indigo-700",
  "Chào giá trực tuyến rút gọn": "bg-indigo-100 text-indigo-700",
  "Mua sắm trực tuyến": "bg-teal-100 text-teal-700",
  "Đặt hàng": "bg-orange-100 text-orange-700",
};

const LOAI_BADGE: Record<LoaiBuoc, string> = {
  "Bắt đầu": "bg-emerald-100 text-emerald-700",
  Thường: "bg-blue-100 text-blue-700",
  "Ký duyệt": "bg-purple-100 text-purple-700",
  "Đăng tải": "bg-cyan-100 text-cyan-700",
  "Đánh giá/kiểm tra": "bg-amber-100 text-amber-700",
  "Hợp đồng": "bg-indigo-100 text-indigo-700",
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
    nhomGiaiDoan: "",
    donViPhuTrach: "",
    vaiTroXuLy: "",
    slaNgay: 1,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
    trangThaiMacDinh: "Chưa bắt đầu",
    coKyDuyet: false,
    donViKyHoSo: "",
    vaiTroKyDuyet: "",
    soNgayKyDuyet: undefined,
    batBuocKyTruocChuyenBuoc: true,
    dieuKienChuyenTiep: [],
    coNhanhSongSong: false,
    nhanhList: [],
    dieuKienHopNhat: "all",
    soNhanhHopNhatToiThieu: 2,
    buocSauHopNhatId: "",
    moTa: "",
    dieuKienChuyen: ["Duyệt"],
    buocTiepTheoId: "",
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
      const wfId = parseInt(editId);
      if (!isNaN(wfId)) {
        http.get<ApiResponse<any>>(`/workflows/${wfId}`)
          .then((res) => {
            const wf = res.data;
            setTenQuyTrinh(wf.tenWorkflow);
            setHinhThuc(wf.loaiHinhDauThau || '');
            setBuocList([]);
          })
          .catch(() => {
            toast.error("Không tìm thấy quy trình");
            navigate("/danh-sach-quy-trinh");
          });
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
    if (trimmed.length > 255)
      return "Tên quy trình không được vượt quá 255 ký tự";
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
      nhomGiaiDoan: b.nhomGiaiDoan ?? "",
      donViPhuTrach: b.donViPhuTrach,
      vaiTroXuLy: b.vaiTroXuLy,
      slaNgay: b.slaNgay,
      loaiThoiHan: b.loaiThoiHan ?? "Chỉ cảnh báo quá hạn",
      trangThaiMacDinh: b.trangThaiMacDinh,
      coKyDuyet: b.coKyDuyet ?? false,
      donViKyHoSo: b.donViKyHoSo ?? "",
      vaiTroKyDuyet: b.vaiTroKyDuyet ?? "",
      soNgayKyDuyet: b.soNgayKyDuyet,
      batBuocKyTruocChuyenBuoc: b.batBuocKyTruocChuyenBuoc ?? true,
      dieuKienChuyenTiep: b.dieuKienChuyenTiep ? [...b.dieuKienChuyenTiep] : [],
      coNhanhSongSong: b.coNhanhSongSong ?? false,
      nhanhList: b.nhanhList ? [...b.nhanhList] : [],
      dieuKienHopNhat: b.dieuKienHopNhat ?? "all",
      soNhanhHopNhatToiThieu: b.soNhanhHopNhatToiThieu ?? 2,
      buocSauHopNhatId: b.buocSauHopNhatId ?? "",
      moTa: b.moTa,
      dieuKienChuyen: [...(b.dieuKienChuyen ?? ["Duyệt"])],
      buocTiepTheoId: b.buocTiepTheoId ?? "",
    });
    setStepErrs({});
    setStepModal({ mode: "edit", targetId: b.id });
  }

  function validateStep(): boolean {
    const errs: typeof stepErrs = {};
    if (!stepForm.ten.trim()) errs.ten = "Vui lòng nhập tên bước";
    if (!stepForm.loai) errs.loai = "Vui lòng chọn loại bước";
    if (!stepForm.donViPhuTrach)
      errs.donViPhuTrach = "Vui lòng chọn đơn vị phụ trách";
    if (!stepForm.vaiTroXuLy) errs.vaiTroXuLy = "Vui lòng chọn vai trò xử lý";
    if (
      stepForm.slaNgay === undefined ||
      stepForm.slaNgay === null ||
      Number(stepForm.slaNgay) < 0
    )
      errs.slaNgay = "Thời hạn xử lý phải >= 0";
    if (!stepForm.loaiThoiHan) errs.loaiThoiHan = "Vui lòng chọn loại thời hạn";
    if (stepForm.coKyDuyet) {
      if (!stepForm.donViKyHoSo)
        errs.donViKyHoSo = "Vui lòng chọn đơn vị kiểm tra/ký";
      if (!stepForm.vaiTroKyDuyet)
        errs.vaiTroKyDuyet = "Vui lòng chọn vai trò ký duyệt";
    }
    if (stepForm.coNhanhSongSong && stepForm.nhanhList.length < 2)
      errs.coNhanhSongSong = "Nhánh song song phải có ít nhất 2 nhánh";
    if (
      stepForm.coNhanhSongSong &&
      stepForm.nhanhList.length >= 2 &&
      !stepForm.buocSauHopNhatId
    )
      errs.buocSauHopNhatId = "Vui lòng chọn bước sau khi hợp nhất";
    const hasInvalidDk = stepForm.dieuKienChuyenTiep.some(
      (r) =>
        (r.dieuKienKichHoat === "Theo kết quả xử lý" && !r.ketQuaApDung) ||
        (r.dieuKienKichHoat === "Theo vai trò" && !r.vaiTroApDung),
    );
    if (hasInvalidDk)
      errs.dieuKienChuyenTiep =
        "Vui lòng chọn đầy đủ giá trị điều kiện kích hoạt cho từng điều kiện chuyển tiếp";
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
      const payload = {
        tenWorkflow: tenQuyTrinh.trim(),
      };
      const request = isEdit && editId
        ? http.put(`/workflows/${editId}`, payload)
        : http.post("/workflows", payload);
      request.then(() => {
        toast.success(isEdit ? "Đã cập nhật quy trình thành công" : "Quy trình đã được lưu thành công");
        setIsDirty(false);
        setSaving(false);
        navigate("/danh-sach-quy-trinh");
      }).catch(() => {
        toast.error("Lưu quy trình thất bại");
        setSaving(false);
      });
    }, 600);
  }

  /* ── Computed ── */
  const startCount = buocList.filter((b) => b.loai === "Bắt đầu").length;
  const endCount = buocList.filter((b) => b.loai === "Kết thúc").length;
  const tenLen = tenQuyTrinh.trim().length;

  // Orphan: not "Bắt đầu" and not pointed to by any step
  const pointedToIds = new Set(
    buocList.flatMap((b) => {
      const ids: string[] = [];
      if (b.buocTiepTheoId) ids.push(b.buocTiepTheoId);
      (b.dieuKienChuyenTiep ?? []).forEach((d) => {
        if (d.buocChuyenDenId) ids.push(d.buocChuyenDenId);
      });
      return ids;
    }),
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

      <div className="w-full p-4 lg:p-6 space-y-6">
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

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-4">
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
              <SelectField
                value={hinhThuc || "__empty"}
                onValueChange={(value) => {
                  setHinhThuc(value === "__empty" ? "" : (value as HinhThucQT));
                  setHinhThucErr("");
                  markDirty();
                }}
                options={[
                  { value: "__empty", label: "-- Chọn hình thức --" },
                  ...HINH_THUC_OPTIONS.map((ht) => ({ value: ht, label: ht })),
                ]}
                triggerClassName={hinhThucErr ? inputErrCls : inputCls}
              />
              {hinhThucErr && (
                <p className="text-xs text-red-500 mt-1">{hinhThucErr}</p>
              )}
            </div>
          </div>

          {hinhThuc && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${HT_BADGE[hinhThuc] ?? "bg-slate-100 text-slate-600"}`}
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
                const primaryId =
                  b.buocTiepTheoId ||
                  b.dieuKienChuyenTiep?.[0]?.buocChuyenDenId;
                const nextStep = primaryId
                  ? buocList.find((x) => x.id === primaryId)
                  : null;
                return (
                  <li
                    key={b.id}
                    className={`flex items-start gap-3 border rounded-xl px-4 py-3 ${orphanIds.has(b.id) ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200"}`}
                  >
                    {/* Badge số thứ tự với màu theo loại */}
                    <span
                      className={`w-6 h-6 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        b.loai === "Bắt đầu"
                          ? "bg-emerald-500"
                          : b.loai === "Kết thúc"
                            ? "bg-red-500"
                            : b.loai === "Ký duyệt"
                              ? "bg-purple-600"
                              : b.loai === "Đăng tải"
                                ? "bg-cyan-600"
                                : b.loai === "Đánh giá/kiểm tra"
                                  ? "bg-amber-500"
                                  : b.loai === "Hợp đồng"
                                    ? "bg-indigo-600"
                                    : "bg-blue-600"
                      }`}
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
                        {b.nhomGiaiDoan && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {b.nhomGiaiDoan}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <i className="fa-solid fa-building text-slate-400" />
                          {b.donViPhuTrach}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <i className="fa-regular fa-clock text-slate-400" />
                          {b.slaNgay} ngày
                        </span>
                        {b.vaiTroXuLy && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <i className="fa-solid fa-user text-slate-400" />
                            {b.vaiTroXuLy}
                          </span>
                        )}
                        {b.loaiThoiHan && (
                          <span
                            className={`text-[11px] flex items-center gap-1 ${
                              b.loaiThoiHan === "Bắt buộc hoàn thành trước hạn"
                                ? "text-red-500"
                                : "text-slate-400"
                            }`}
                          >
                            <i
                              className={`fa-solid ${
                                b.loaiThoiHan ===
                                "Bắt buộc hoàn thành trước hạn"
                                  ? "fa-lock"
                                  : "fa-bell"
                              } text-[10px]`}
                            />
                            {b.loaiThoiHan === "Bắt buộc hoàn thành trước hạn"
                              ? "Bắt buộc HT"
                              : "Cảnh báo"}
                          </span>
                        )}
                        {b.coKyDuyet && (
                          <span className="text-[11px] text-purple-600 flex items-center gap-1">
                            <i className="fa-solid fa-signature text-[10px]" />
                            Ký duyệt
                          </span>
                        )}
                        {b.dieuKienChuyenTiep &&
                          b.dieuKienChuyenTiep.length > 0 && (
                            <span className="text-[11px] text-slate-400">
                              →{" "}
                              {b.dieuKienChuyenTiep
                                .map((d) => d.hanhDong)
                                .join(", ")}
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
                Có {orphanIds.size} bước mồ côi (không được trỏ đến từ bước
                nào). Kiểm tra lại điều kiện chuyển tiếp.
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
                          : b.loai === "Ký duyệt"
                            ? "bg-purple-50 border-purple-300"
                            : b.loai === "Đăng tải"
                              ? "bg-cyan-50 border-cyan-300"
                              : b.loai === "Đánh giá/kiểm tra"
                                ? "bg-amber-50 border-amber-300"
                                : b.loai === "Hợp đồng"
                                  ? "bg-indigo-50 border-indigo-300"
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
                            : b.loai === "Ký duyệt"
                              ? "text-purple-600"
                              : b.loai === "Đăng tải"
                                ? "text-cyan-600"
                                : b.loai === "Đánh giá/kiểm tra"
                                  ? "text-amber-600"
                                  : b.loai === "Hợp đồng"
                                    ? "text-indigo-600"
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
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {b.slaNgay}N
                    </span>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 my-6">
            {/* Header */}
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

            {/* ── 1. Thông tin bước ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-circle-info text-blue-400" />
                1. Thông tin bước
              </p>

              {/* Tên bước */}
              <div>
                <label className={labelCls}>
                  Tên bước <span className="text-red-500">*</span>
                </label>
                <input
                  className={stepErrs.ten ? inputErrCls : inputCls}
                  placeholder="Ví dụ: Đề xuất mua sắm/sửa chữa"
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
                <div className="flex flex-wrap gap-2">
                  {LOAI_BUOC_OPTIONS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setStepForm((f) => ({ ...f, loai: l }));
                        setStepErrs((e2) => ({ ...e2, loai: "" }));
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        stepForm.loai === l
                          ? l === "Bắt đầu"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : l === "Kết thúc"
                              ? "bg-red-500 text-white border-red-500"
                              : l === "Ký duyệt"
                                ? "bg-purple-600 text-white border-purple-600"
                                : l === "Đăng tải"
                                  ? "bg-cyan-600 text-white border-cyan-600"
                                  : l === "Đánh giá/kiểm tra"
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : l === "Hợp đồng"
                                      ? "bg-indigo-600 text-white border-indigo-600"
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

              {/* Nhóm giai đoạn */}
              <div>
                <label className={labelCls}>Nhóm giai đoạn</label>
                <SelectField
                  value={stepForm.nhomGiaiDoan || "__none"}
                  onValueChange={(value) =>
                    setStepForm((f) => ({
                      ...f,
                      nhomGiaiDoan: value === "__none" ? "" : value,
                    }))
                  }
                  options={[
                    { value: "__none", label: "-- Không xác định --" },
                    ...NHOM_GIAI_DOAN_OPTIONS.map((n) => ({ value: n, label: n })),
                  ]}
                  triggerClassName={inputCls}
                />
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

            {/* ── 2. Đơn vị xử lý ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-building text-blue-400" />
                2. Đơn vị xử lý
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    Đơn vị phụ trách / Soạn hồ sơ{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <SelectField
                    value={stepForm.donViPhuTrach || "__empty"}
                    onValueChange={(value) => {
                      setStepForm((f) => ({
                        ...f,
                        donViPhuTrach: value === "__empty" ? "" : value,
                      }));
                      setStepErrs((e2) => ({ ...e2, donViPhuTrach: "" }));
                    }}
                    options={[
                      { value: "__empty", label: "-- Chọn đơn vị --" },
                      ...DON_VI_OPTIONS.map((d) => ({ value: d, label: d })),
                    ]}
                    triggerClassName={stepErrs.donViPhuTrach ? inputErrCls : inputCls}
                  />
                  {stepErrs.donViPhuTrach && (
                    <p className="text-xs text-red-500 mt-1">
                      {stepErrs.donViPhuTrach}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Vai trò xử lý <span className="text-red-500">*</span>
                  </label>
                  <SelectField
                    value={stepForm.vaiTroXuLy || "__empty"}
                    onValueChange={(value) => {
                      setStepForm((f) => ({
                        ...f,
                        vaiTroXuLy: value === "__empty" ? "" : value,
                      }));
                      setStepErrs((e2) => ({ ...e2, vaiTroXuLy: "" }));
                    }}
                    options={[
                      { value: "__empty", label: "-- Chọn vai trò --" },
                      ...VAI_TRO_OPTIONS.map((v) => ({ value: v, label: v })),
                    ]}
                    triggerClassName={stepErrs.vaiTroXuLy ? inputErrCls : inputCls}
                  />
                  {stepErrs.vaiTroXuLy && (
                    <p className="text-xs text-red-500 mt-1">
                      {stepErrs.vaiTroXuLy}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Trạng thái mặc định <span className="text-red-500">*</span>
                </label>
                <SelectField
                  value={stepForm.trangThaiMacDinh}
                  onValueChange={(value) =>
                    setStepForm((f) => ({
                      ...f,
                      trangThaiMacDinh: value as TrangThaiBuoc,
                    }))
                  }
                  options={TRANG_THAI_BUOC_OPTIONS.map((t) => ({ value: t, label: t }))}
                  triggerClassName={inputCls}
                />
              </div>
            </div>

            {/* ── 3. Thời hạn ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-regular fa-clock text-blue-400" />
                3. Thời hạn
              </p>
              <div>
                <label className={labelCls}>
                  Thời hạn xử lý (ngày) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  className={stepErrs.slaNgay ? inputErrCls : inputCls}
                  placeholder="Ví dụ: 0.5, 1, 3, 5, 18..."
                  value={stepForm.slaNgay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setStepForm((f) => ({ ...f, slaNgay: isNaN(v) ? 0 : v }));
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
                <label className={labelCls}>
                  Loại thời hạn <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {(
                    [
                      "Chỉ cảnh báo quá hạn",
                      "Bắt buộc hoàn thành trước hạn",
                    ] as LoaiThoiHan[]
                  ).map((opt) => (
                    <label
                      key={opt}
                      className="flex items-start gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="loaiThoiHan"
                        value={opt}
                        checked={stepForm.loaiThoiHan === opt}
                        onChange={() => {
                          setStepForm((f) => ({ ...f, loaiThoiHan: opt }));
                          setStepErrs((e2) => ({ ...e2, loaiThoiHan: "" }));
                        }}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
                {stepErrs.loaiThoiHan && (
                  <p className="text-xs text-red-500 mt-1">
                    {stepErrs.loaiThoiHan}
                  </p>
                )}
              </div>
            </div>

            {/* ── 4. Ký duyệt ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-signature text-blue-400" />
                4. Ký duyệt
              </p>
              <div>
                <label className={labelCls}>
                  Có yêu cầu ký duyệt không?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-5">
                  {[false, true].map((v) => (
                    <label
                      key={String(v)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="coKyDuyet"
                        checked={stepForm.coKyDuyet === v}
                        onChange={() =>
                          setStepForm((f) => ({ ...f, coKyDuyet: v }))
                        }
                      />
                      <span className="text-xs text-slate-700">
                        {v ? "Có" : "Không"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {stepForm.coKyDuyet && (
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>
                        Đơn vị kiểm tra/ký hồ sơ{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <SelectField
                        value={stepForm.donViKyHoSo || "__empty"}
                        onValueChange={(value) => {
                          setStepForm((f) => ({
                            ...f,
                            donViKyHoSo: value === "__empty" ? "" : value,
                          }));
                          setStepErrs((e2) => ({ ...e2, donViKyHoSo: "" }));
                        }}
                        options={[
                          { value: "__empty", label: "-- Chọn đơn vị --" },
                          ...DON_VI_KY_OPTIONS.map((d) => ({ value: d, label: d })),
                        ]}
                        triggerClassName={stepErrs.donViKyHoSo ? inputErrCls : inputCls}
                      />
                      {stepErrs.donViKyHoSo && (
                        <p className="text-xs text-red-500 mt-1">
                          {stepErrs.donViKyHoSo}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>
                        Vai trò ký duyệt <span className="text-red-500">*</span>
                      </label>
                      <SelectField
                        value={stepForm.vaiTroKyDuyet || "__empty"}
                        onValueChange={(value) => {
                          setStepForm((f) => ({
                            ...f,
                            vaiTroKyDuyet: value === "__empty" ? "" : value,
                          }));
                          setStepErrs((e2) => ({ ...e2, vaiTroKyDuyet: "" }));
                        }}
                        options={[
                          { value: "__empty", label: "-- Chọn vai trò --" },
                          ...VAI_TRO_KY_OPTIONS.map((v) => ({ value: v, label: v })),
                        ]}
                        triggerClassName={stepErrs.vaiTroKyDuyet ? inputErrCls : inputCls}
                      />
                      {stepErrs.vaiTroKyDuyet && (
                        <p className="text-xs text-red-500 mt-1">
                          {stepErrs.vaiTroKyDuyet}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Số ngày ký duyệt</label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      className={inputCls}
                      placeholder="Ví dụ: 1"
                      value={stepForm.soNgayKyDuyet ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setStepForm((f) => ({
                          ...f,
                          soNgayKyDuyet: isNaN(v) ? undefined : v,
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Có bắt buộc ký trước khi chuyển bước?{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-5">
                      {[true, false].map((v) => (
                        <label
                          key={String(v)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="batBuocKyTruocChuyenBuoc"
                            checked={stepForm.batBuocKyTruocChuyenBuoc === v}
                            onChange={() =>
                              setStepForm((f) => ({
                                ...f,
                                batBuocKyTruocChuyenBuoc: v,
                              }))
                            }
                          />
                          <span className="text-xs text-slate-700">
                            {v ? "Có" : "Không"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── 5. Điều kiện chuyển tiếp ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-arrow-right-arrow-left text-blue-400" />
                  5. Điều kiện chuyển tiếp
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newRow: DieuKienChuyenTiep = {
                      id: Date.now().toString(),
                      hanhDong: "Hoàn thành / Duyệt",
                      buocChuyenDenId: "",
                      dieuKienKichHoat: "Luôn",
                      ketQuaApDung: "",
                      vaiTroApDung: "",
                      batBuocGhiChu: false,
                      batBuocUpload: false,
                    };
                    setStepForm((f) => ({
                      ...f,
                      dieuKienChuyenTiep: [...f.dieuKienChuyenTiep, newRow],
                    }));
                  }}
                  className="h-7 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                  Thêm điều kiện
                </button>
              </div>
              {stepForm.dieuKienChuyenTiep.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">
                  Chưa có điều kiện nào. Nhấn "Thêm điều kiện" để bắt đầu.
                </p>
              ) : (
                <div className="space-y-2">
                  {stepForm.dieuKienChuyenTiep.map((row, idx) => (
                    <div
                      key={row.id}
                      className="border border-slate-100 rounded-lg p-3 bg-slate-50 space-y-2"
                    >
                      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                        <div>
                          <label className={labelCls}>Hành động</label>
                          <SelectField
                            value={row.hanhDong}
                            onValueChange={(value) => {
                              const newHanhDong = value as HanhDongChuyen;
                              const forceGhiChu = [
                                "Không duyệt",
                                "Trả về",
                                "Yêu cầu bổ sung",
                              ].includes(newHanhDong);
                              const updated = stepForm.dieuKienChuyenTiep.map(
                                (r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        hanhDong: newHanhDong,
                                        batBuocGhiChu: forceGhiChu
                                          ? true
                                          : r.batBuocGhiChu,
                                      }
                                    : r,
                              );
                              setStepForm((f) => ({
                                ...f,
                                dieuKienChuyenTiep: updated,
                              }));
                            }}
                            options={HANH_DONG_OPTIONS.map((h) => ({
                              value: h,
                              label: h,
                            }))}
                            triggerClassName={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Bước chuyển đến</label>
                          <SelectField
                            value={row.buocChuyenDenId || "__empty"}
                            onValueChange={(value) => {
                              const updated = stepForm.dieuKienChuyenTiep.map(
                                (r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        buocChuyenDenId:
                                          value === "__empty" ? "" : value,
                                      }
                                    : r,
                              );
                              setStepForm((f) => ({
                                ...f,
                                dieuKienChuyenTiep: updated,
                              }));
                            }}
                            options={[
                              { value: "__empty", label: "-- Chọn bước --" },
                              ...buocList
                                .filter((b) => b.id !== stepModal?.targetId)
                                .map((b) => ({ value: b.id, label: b.ten })),
                            ]}
                            triggerClassName={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>
                            Điều kiện kích hoạt
                          </label>
                          <SelectField
                            value={row.dieuKienKichHoat}
                            onValueChange={(value) => {
                              const updated = stepForm.dieuKienChuyenTiep.map(
                                (r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        dieuKienKichHoat:
                                          value as DieuKienKichHoat,
                                        ketQuaApDung: "",
                                        vaiTroApDung: "",
                                      }
                                    : r,
                              );
                              setStepForm((f) => ({
                                ...f,
                                dieuKienChuyenTiep: updated,
                              }));
                            }}
                            options={DIEU_KIEN_KICH_HOAT_OPTIONS.map((d) => ({
                              value: d,
                              label: d,
                            }))}
                            triggerClassName={inputCls}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setStepForm((f) => ({
                              ...f,
                              dieuKienChuyenTiep: f.dieuKienChuyenTiep.filter(
                                (_, i) => i !== idx,
                              ),
                            }));
                          }}
                          className="mb-0.5 w-7 h-[38px] flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                        </button>
                      </div>
                      {/* Conditional sub-field based on Điều kiện kích hoạt */}
                      {row.dieuKienKichHoat === "Theo kết quả xử lý" && (
                        <div>
                          <label className={labelCls}>
                            Kết quả áp dụng{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <SelectField
                            value={row.ketQuaApDung || "__empty"}
                            onValueChange={(value) => {
                              const updated = stepForm.dieuKienChuyenTiep.map(
                                (r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        ketQuaApDung:
                                          value === "__empty" ? "" : value,
                                      }
                                    : r,
                              );
                              setStepForm((f) => ({
                                ...f,
                                dieuKienChuyenTiep: updated,
                              }));
                            }}
                            options={[
                              { value: "__empty", label: "-- Chọn kết quả --" },
                              ...KET_QUA_OPTIONS.map((k) => ({
                                value: k,
                                label: k,
                              })),
                            ]}
                            triggerClassName={inputCls}
                          />
                        </div>
                      )}
                      {row.dieuKienKichHoat === "Theo vai trò" && (
                        <div>
                          <label className={labelCls}>
                            Vai trò áp dụng{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <SelectField
                            value={row.vaiTroApDung || "__empty"}
                            onValueChange={(value) => {
                              const updated = stepForm.dieuKienChuyenTiep.map(
                                (r, i) =>
                                  i === idx
                                    ? {
                                        ...r,
                                        vaiTroApDung:
                                          value === "__empty" ? "" : value,
                                      }
                                    : r,
                              );
                              setStepForm((f) => ({
                                ...f,
                                dieuKienChuyenTiep: updated,
                              }));
                            }}
                            options={[
                              { value: "__empty", label: "-- Chọn vai trò --" },
                              ...VAI_TRO_OPTIONS.map((v) => ({
                                value: v,
                                label: v,
                              })),
                            ]}
                            triggerClassName={inputCls}
                          />
                        </div>
                      )}
                      <div className="flex gap-5">
                        {(() => {
                          const forcedGhiChu = [
                            "Không duyệt",
                            "Trả về",
                            "Yêu cầu bổ sung",
                          ].includes(row.hanhDong);
                          return (
                            <label
                              className={`flex items-center gap-1.5 ${forcedGhiChu ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                            >
                              <input
                                type="checkbox"
                                checked={forcedGhiChu || row.batBuocGhiChu}
                                disabled={forcedGhiChu}
                                onChange={(e) => {
                                  if (forcedGhiChu) return;
                                  const updated =
                                    stepForm.dieuKienChuyenTiep.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            batBuocGhiChu: e.target.checked,
                                          }
                                        : r,
                                    );
                                  setStepForm((f) => ({
                                    ...f,
                                    dieuKienChuyenTiep: updated,
                                  }));
                                }}
                              />
                              <span className="text-xs text-slate-600">
                                Bắt buộc ghi chú
                                {forcedGhiChu && (
                                  <span className="ml-1 text-orange-500 text-[10px]">
                                    (tự động)
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })()}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.batBuocUpload}
                            onChange={(e) => {
                              const updated = stepForm.dieuKienChuyenTiep.map(
                                (r, i) =>
                                  i === idx
                                    ? { ...r, batBuocUpload: e.target.checked }
                                    : r,
                              );
                              setStepForm((f) => ({
                                ...f,
                                dieuKienChuyenTiep: updated,
                              }));
                            }}
                          />
                          <span className="text-xs text-slate-600">
                            Bắt buộc upload tài liệu
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {stepErrs.dieuKienChuyenTiep && (
                <p className="text-xs text-red-500 mt-1">
                  {stepErrs.dieuKienChuyenTiep}
                </p>
              )}
            </div>

            {/* ── 6. Nhánh song song ── */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-code-branch text-blue-400" />
                6. Nhánh song song
              </p>
              <div>
                <label className={labelCls}>Có tạo nhánh song song?</label>
                <div className="flex gap-5">
                  {[false, true].map((v) => (
                    <label
                      key={String(v)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="coNhanhSongSong"
                        checked={stepForm.coNhanhSongSong === v}
                        onChange={() =>
                          setStepForm((f) => ({ ...f, coNhanhSongSong: v }))
                        }
                      />
                      <span className="text-xs text-slate-700">
                        {v ? "Có" : "Không"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {stepForm.coNhanhSongSong && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newBranch: NhanhSongSong = {
                        id: Date.now().toString(),
                        tenNhanh: "",
                        donVi: DON_VI_OPTIONS[0],
                        vaiTro: VAI_TRO_OPTIONS[0],
                        thoiHanNgay: 1,
                        loaiThoiHan: "Chỉ cảnh báo quá hạn",
                        buocDauTienId: "",
                      };
                      setStepForm((f) => ({
                        ...f,
                        nhanhList: [...f.nhanhList, newBranch],
                      }));
                    }}
                    className="h-7 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <i className="fa-solid fa-plus text-[10px]" />
                    Thêm nhánh
                  </button>
                  {stepForm.nhanhList.map((nhanh, idx) => (
                    <div
                      key={nhanh.id}
                      className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">
                          Nhánh {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setStepForm((f) => ({
                              ...f,
                              nhanhList: f.nhanhList.filter(
                                (_, i) => i !== idx,
                              ),
                            }))
                          }
                          className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50"
                        >
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>Tên nhánh</label>
                          <input
                            className={inputCls}
                            placeholder="Ví dụ: Lập HSMT"
                            value={nhanh.tenNhanh}
                            onChange={(e) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? { ...n, tenNhanh: e.target.value }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Bước đầu tiên</label>
                          <SelectField
                            value={nhanh.buocDauTienId || "__empty"}
                            onValueChange={(value) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? {
                                      ...n,
                                      buocDauTienId:
                                        value === "__empty" ? "" : value,
                                    }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                            options={[
                              { value: "__empty", label: "-- Chọn bước --" },
                              ...buocList
                                .filter((b) => b.id !== stepModal?.targetId)
                                .map((b) => ({ value: b.id, label: b.ten })),
                            ]}
                            triggerClassName={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Đơn vị</label>
                          <SelectField
                            value={nhanh.donVi}
                            onValueChange={(value) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx ? { ...n, donVi: value } : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                            options={DON_VI_OPTIONS.map((d) => ({ value: d, label: d }))}
                            triggerClassName={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Vai trò</label>
                          <SelectField
                            value={nhanh.vaiTro}
                            onValueChange={(value) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? { ...n, vaiTro: value }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                            options={VAI_TRO_OPTIONS.map((v) => ({ value: v, label: v }))}
                            triggerClassName={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Thời hạn (ngày)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            className={inputCls}
                            value={nhanh.thoiHanNgay}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? { ...n, thoiHanNgay: isNaN(v) ? 0 : v }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Loại thời hạn</label>
                          <SelectField
                            value={nhanh.loaiThoiHan}
                            onValueChange={(value) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? {
                                      ...n,
                                      loaiThoiHan: value as LoaiThoiHan,
                                    }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                            options={[
                              {
                                value: "Chỉ cảnh báo quá hạn",
                                label: "Chỉ cảnh báo quá hạn",
                              },
                              {
                                value: "Bắt buộc hoàn thành trước hạn",
                                label: "Bắt buộc hoàn thành trước hạn",
                              },
                            ]}
                            triggerClassName={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Điều kiện hợp nhất + Bước sau khi hợp nhất */}
                  {stepForm.nhanhList.length >= 2 && (
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className={labelCls}>
                          Điều kiện hợp nhất{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col gap-2">
                          {(["all", "any", "count"] as const).map((v) => (
                            <label
                              key={v}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name="dieuKienHopNhat"
                                value={v}
                                checked={stepForm.dieuKienHopNhat === v}
                                onChange={() =>
                                  setStepForm((f) => ({
                                    ...f,
                                    dieuKienHopNhat: v,
                                  }))
                                }
                              />
                              <span className="text-xs text-slate-700">
                                {v === "all"
                                  ? "Đợi tất cả nhánh hoàn thành"
                                  : v === "any"
                                    ? "Chỉ cần một nhánh hoàn thành"
                                    : "Theo số lượng hoàn thành"}
                              </span>
                            </label>
                          ))}
                        </div>
                        {stepForm.dieuKienHopNhat === "count" && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-600">
                              Tối thiểu
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={stepForm.nhanhList.length}
                              className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-center"
                              value={stepForm.soNhanhHopNhatToiThieu}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                setStepForm((f) => ({
                                  ...f,
                                  soNhanhHopNhatToiThieu: isNaN(v) ? 1 : v,
                                }));
                              }}
                            />
                            <span className="text-xs text-slate-600">
                              trên {stepForm.nhanhList.length} nhánh
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>
                          Bước sau khi hợp nhất{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <SelectField
                          value={stepForm.buocSauHopNhatId || "__empty"}
                          onValueChange={(value) =>
                            setStepForm((f) => ({
                              ...f,
                              buocSauHopNhatId:
                                value === "__empty" ? "" : value,
                            }))
                          }
                          options={[
                            { value: "__empty", label: "-- Chọn bước --" },
                            ...buocList
                              .filter((b) => b.id !== stepModal?.targetId)
                              .map((b) => ({ value: b.id, label: b.ten })),
                          ]}
                          triggerClassName={inputCls}
                        />
                        {stepErrs.buocSauHopNhatId && (
                          <p className="text-xs text-red-500 mt-1">
                            {stepErrs.buocSauHopNhatId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {stepErrs.coNhanhSongSong && (
                    <p className="text-xs text-red-500">
                      {stepErrs.coNhanhSongSong}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
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
              <h3 className="text-sm font-bold text-slate-800">
                Xóa bước này?
              </h3>
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
