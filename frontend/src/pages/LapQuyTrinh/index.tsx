import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  type Buoc,
  type LoaiBuoc,
  type TrangThaiBuoc,
  type LoaiThoiHan,
  type HanhDongChuyen,
  type DieuKienChuyenTiep,
  type NhanhSongSong,
  type HinhThucQT,
  HINH_THUC_OPTIONS,
  QUY_TRINH_TEMPLATE_INFO,
  addQuyTrinh,
  updateQuyTrinh,
  getQuyTrinhById,
  generateQuyTrinhId,
} from "@/pages/DanhSachQuyTrinh/quyTrinhService";

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

const STEP_MODAL_LOAI_BUOC: LoaiBuoc[] = [
  "Bắt đầu",
  "Thường",
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
  "Duyệt",
  "Không duyệt",
];

const KET_QUA_OPTIONS = ["Đạt", "Không đạt", "Cần bổ sung"];

const BUOC_LIBRARY = [
  "Đề xuất mua sắm/sửa chữa",
  "Tờ trình chủ trương",
  "Đăng tải yêu cầu báo giá",
  "Biên bản kiểm tra báo giá",
  "Lập hồ sơ mời thầu",
  "Phát hành hồ sơ mời thầu",
  "Mở thầu Online",
  "Báo cáo đánh giá HSDT",
  "Hợp đồng",
] as const;

type BuocLibraryItem = (typeof BUOC_LIBRARY)[number];

const HT_BADGE: Partial<Record<HinhThucQT, string>> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
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
    dieuKienChuyenTiep: {
      khiDuyet: {
        buocTiepTheoId: "",
      },
      khiKhongDuyet: {
        xuLy: "Trả về bước trước",
      },
      yeuCauBatBuoc: {
        ghiChu: false,
        uploadTaiLieu: false,
        kyDuyet: false,
        hoanThanhTruocSLA: false,
      },
    },
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

  const [selectedBranchStep, setSelectedBranchStep] = useState<{
    branchId:string;
     stepId:string;
  } | null>(null);

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
    parentType?: "parallel-branch";
    branchId?: string;
  } | null>(null);
  const [stepForm, setStepForm] = useState<Omit<Buoc, "id">>(emptyStep());
  const [stepErrs, setStepErrs] = useState<
    Partial<Record<keyof Omit<Buoc, "id">, string>>
  >({});

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState<Buoc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState("");

  const selectedTemplate = hinhThuc ? QUY_TRINH_TEMPLATE_INFO[hinhThuc] : undefined;

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

  /* ── Auto-update nhomGiaiDoan when step name changes ── */
  useEffect(() => {
    if (stepModal && stepForm.ten.trim()) {
      const autoNhom = getAutoNhomGiaiDoan(stepForm.ten);
      if (autoNhom && autoNhom !== stepForm.nhomGiaiDoan) {
        setStepForm((f) => ({ ...f, nhomGiaiDoan: autoNhom }));
      }
    }
  }, [stepForm.ten, stepModal]);

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
function openAdd(
  config?: {
    parentType?: "parallel-branch";
    branchId?: string;
  }
) {
  if(config?.parentType === "parallel-branch") {
    setStepForm(f => ({
      ...f
    }));
  } else {
    setStepForm(emptyStep());
  }
  setStepErrs({});

  setStepModal({
    mode:"add",
    ...config
  });
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
    dieuKienChuyenTiep: {
      khiDuyet: {
        ...b.dieuKienChuyenTiep.khiDuyet,
      },
      khiKhongDuyet: {
        ...b.dieuKienChuyenTiep.khiKhongDuyet,
      },
      yeuCauBatBuoc: {
        ...b.dieuKienChuyenTiep.yeuCauBatBuoc,
      },
    },
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
    setStepErrs(errs);
    return Object.keys(errs).length === 0;
  }

  function saveStep() {
    if (!validateStep()) return;
    const newB: Buoc = { ...stepForm, id: Date.now().toString() };
    // Thêm bước vào nhánh song song
 if (
    stepModal?.mode === "add" &&
    stepModal.parentType === "parallel-branch"
  ) {
    setBuocList((prev) =>
      prev.map((b) => {
        // không phải bước chứa nhánh
        if (!b.nhanhList) return b;
        return {
          ...b,
          nhanhList: b.nhanhList.map((nhanh) => {
            // đúng nhánh cần thêm bước
            if (
              nhanh.id === stepModal.branchId
            ) {
              return {
                ...nhanh,
                buocList: [
                  ...nhanh.buocList,
                  newB,
                ],
              };
            }
            return nhanh;
          }),
          };
        }),
      );
      toast.success("Đã thêm bước vào nhánh");
    }
    // Thêm bước
    else if (stepModal?.mode === "add") {
      setBuocList((prev) => [...prev, newB]);
      toast.success("Đã thêm bước");
    } 
    // Chỉnh sửa bước
    else {
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

  /* ── Auto-assign Nhóm giai đoạn based on step name ── */
  function getAutoNhomGiaiDoan(ten: string): string {
    const lowerName = ten.toLowerCase();
    if (/pháp lý|chủ trương|hồ sơ yêu cầu/i.test(lowerName))
      return "Pháp lý gói thầu";
    if (/tư vấn LCNT|dự toán|kế hoạch LCNT/i.test(lowerName))
      return "Tư vấn LCNT";
    if (/thẩm định|kiểm tra|tổ chuyên gia|đánh giá/i.test(lowerName))
      return "Tư vấn thẩm định";
    if (/lựa chọn|báo giá|yêu cầu báo giá|hồ sơ đề xuất/i.test(lowerName))
      return "Lựa chọn nhà thầu";
    if (/hợp đồng/i.test(lowerName)) return "Hợp đồng";
    if (/nghiệm thu|thanh lý|quyết toán|quản lý/i.test(lowerName))
      return "Nghiệm thu/Thanh lý/Quyết toán";
    return "";
  }

  function makeLibraryBuoc(id: string, ten: string): Buoc {
    const requiresKyDuyet = /quyết định|phê duyệt|ký kết|phê duyệt kết quả|đăng tải kết quả|phê duyệt kế hoạch|phê duyệt dự toán/i.test(
      ten.toLowerCase(),
    );

    return {
      id,
      ten,
      loai: "Thường",
      nhomGiaiDoan: getAutoNhomGiaiDoan(ten),
      donViPhuTrach: "K/P mua sắm",
      vaiTroXuLy: "Nhân viên K/P mua sắm",
      slaNgay: 1,
      loaiThoiHan: "Chỉ cảnh báo quá hạn",
      trangThaiMacDinh: "Chưa bắt đầu",
      coKyDuyet: requiresKyDuyet,
      donViKyHoSo: requiresKyDuyet ? "Giám đốc BV" : "",
      vaiTroKyDuyet: requiresKyDuyet ? "Giám đốc BV" : "",
      soNgayKyDuyet: requiresKyDuyet ? 1 : undefined,
      batBuocKyTruocChuyenBuoc: true,
      dieuKienChuyenTiep: {
      khiDuyet: {
        buocTiepTheoId: "",
      },
      khiKhongDuyet: {
        xuLy: "Trả về bước trước",
      },
      yeuCauBatBuoc: {
        ghiChu: false,
        uploadTaiLieu: false,
        kyDuyet: requiresKyDuyet,
        hoanThanhTruocSLA: false,
      },
    },      coNhanhSongSong: false,
      nhanhList: [],
      dieuKienHopNhat: "all",
      soNhanhHopNhatToiThieu: 2,
      buocSauHopNhatId: "",
      moTa: "",
      dieuKienChuyen: ["Duyệt"],
      buocTiepTheoId: "",
    };
  }

  function makeTemplateBuoc(
    id: string,
    ten: string,
    index: number,
    total: number,
  ): Buoc {
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const requiresKyDuyet = /quyết định|phê duyệt|ký kết|phê duyệt kết quả|đăng tải kết quả|phê duyệt kế hoạch|phê duyệt dự toán/i.test(
      ten.toLowerCase(),
    );

    return {
      id,
      ten,
      loai: isFirst ? "Bắt đầu" : isLast ? "Kết thúc" : "Thường",
      nhomGiaiDoan: getAutoNhomGiaiDoan(ten),
      donViPhuTrach: "K/P mua sắm",
      vaiTroXuLy: "Nhân viên K/P mua sắm",
      slaNgay: 1,
      loaiThoiHan: "Chỉ cảnh báo quá hạn",
      trangThaiMacDinh: "Chưa bắt đầu",
      coKyDuyet: requiresKyDuyet,
      donViKyHoSo: requiresKyDuyet ? "Giám đốc BV" : "",
      vaiTroKyDuyet: requiresKyDuyet ? "Giám đốc BV" : "",
      soNgayKyDuyet: requiresKyDuyet ? 1 : undefined,
      batBuocKyTruocChuyenBuoc: true,
      dieuKienChuyenTiep: {
        khiDuyet: {
          buocTiepTheoId: isLast? undefined : `${id.split("-B")[0]}-B${index + 2}`,
        },
        khiKhongDuyet: {
          xuLy: isFirst ? "Dừng quy trình" : "Trả về bước trước",
        },
        yeuCauBatBuoc: {
          ghiChu: false,
          uploadTaiLieu: false,
          kyDuyet: requiresKyDuyet,
          hoanThanhTruocSLA: false,
        },
      },
      coNhanhSongSong: false,
      nhanhList: [],
      dieuKienHopNhat: "all",
      soNhanhHopNhatToiThieu: 2,
      buocSauHopNhatId: "",
      moTa: "",
      dieuKienChuyen: isLast ? [] : ["Duyệt"],
      buocTiepTheoId: isLast ? "" : `${id.split("-B")[0]}-B${index + 2}`,
    };
  }

  function makeTemplateBuocList(hinhThuc: HinhThucQT) {
    const template = QUY_TRINH_TEMPLATE_INFO[hinhThuc];
    if (!template) return [];
    const prefix = `QT-TEMPLATE-${Date.now()}`;
    return template.steps.map((ten, index) =>
      makeTemplateBuoc(`${prefix}-B${index + 1}`, ten, index, template.steps.length),
    );
  }

  function handleGenerateTemplate() {
    if (!hinhThuc) {
      setHinhThucErr("Vui lòng chọn loại hình đấu thầu");
      return;
    }
      const template = QUY_TRINH_TEMPLATE_INFO[hinhThuc];
      if (!template || template.steps.length === 0) {
        toast.error("Chưa có quy trình chuẩn cho loại hình đấu thầu này.");
        return;
    }
    if (buocList.length > 0) {
      if (
        !window.confirm(
          "Danh sách bước hiện tại sẽ bị thay thế bằng quy trình mẫu. Tiếp tục?",
        )
      ) {
        return;
      }
    }

    const next = makeTemplateBuocList(hinhThuc);
    if (next.length === 0) {
      toast.error(
        "Không tìm thấy template quy trình cho loại hình đấu thầu này.",
      );
      return;
    }
    setBuocList(next);
    markDirty();
    toast.success("Đã tạo quy trình mẫu từ loại hình đấu thầu đã chọn.");
  }

  function addLibraryStep(ten: string) {
    const newStep = makeLibraryBuoc(Date.now().toString(), ten);
    setBuocList((prev) => [...prev, newStep]);
    setShowLibrary(false);
    setLibraryFilter("");
    markDirty();
    toast.success("Đã thêm bước từ thư viện");
  }

function doDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.loai === "Bắt đầu" || deleteTarget.loai === "Kết thúc") {
      toast.error("Không thể xóa bước Bắt đầu hoặc Kết thúc.");
      setDeleteTarget(null);
      return;
    }
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
      setHinhThucErr("Vui lòng chọn loại hình đấu thầu");
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

  const templatePreviewSteps = selectedTemplate?.steps ?? [];
  const previewListSteps = buocList.length > 0 ? buocList.map((b) => b.ten) : templatePreviewSteps;

  // Orphan: not "Bắt đầu" and not pointed to by any step
  const pointedToIds = new Set(
    buocList.flatMap((b) => {
      const ids: string[] = [];
      if (b.buocTiepTheoId) ids.push(b.buocTiepTheoId);
      const nextId = b.dieuKienChuyenTiep?.khiDuyet?.buocTiepTheoId;
      if (nextId) { ids.push(nextId); }
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
                Loại hình đấu thầu{" "}
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
                <option value="">-- Chọn loại hình đấu thầu --</option>
                {HINH_THUC_OPTIONS.map((ht) => (
                  <option key={ht} value={ht}>
                    {ht}
                  </option>
                ))}
              </select>
              {hinhThucErr && (
                <p className="text-xs text-red-500 mt-1">{hinhThucErr}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!hinhThuc}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                >
                  Xem trước quy trình
                </button>
                <button
                  type="button"
                  onClick={handleGenerateTemplate}
                  disabled={!hinhThuc}
                  className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                >
                  Tạo quy trình
                </button>
              </div>
            </div>
          </div>

          {selectedTemplate && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4">
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Quy trình chuẩn
                    </p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">
                      {hinhThuc}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Số bước
                    </p>
                    <p className="text-sm text-slate-800 mt-1">
                      {selectedTemplate.soBuoc}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Áp dụng
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedTemplate.apDung.map((item) => (
                        <span
                          key={item}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedTemplate.khongApDung ? (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Không áp dụng
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selectedTemplate.khongApDung.map((item) => (
                          <span
                            key={item}
                            className="text-[11px] px-2 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-500"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Mô tả
                  </p>
                  <p className="text-sm text-slate-700 mt-1 leading-6">
                    {selectedTemplate.moTa}
                  </p>
                </div>
                {selectedTemplate.ghiChu ? (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Ghi chú
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                      {selectedTemplate.ghiChu}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setAddMenuOpen((prev) => !prev)}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <i className="fa-solid fa-plus" />
                Thêm bước
                <i className="fa-solid fa-chevron-down text-[10px]" />
              </button>
              {addMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLibrary(true);
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700"
                  >
                    Từ thư viện bước
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAdd();
                      setAddMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700"
                  >
                    Tạo bước mới
                  </button>
                </div>
              )}
            </div>
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
                  b.dieuKienChuyenTiep?.khiDuyet?.buocTiepTheoId;                const nextStep = primaryId
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
                      title={b.loai === "Bắt đầu" || b.loai === "Kết thúc" ? "Không thể xóa bước này" : "Xóa"}
                          disabled={b.loai === "Bắt đầu" || b.loai === "Kết thúc"}
                              onClick={() => setDeleteTarget(b)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${b.loai === "Bắt đầu" || b.loai === "Kết thúc" ? "text-slate-300 cursor-not-allowed" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
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

        {showLibrary && (
          <div className="fixed inset-0 z-[190] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 my-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Từ thư viện bước
                  </p>
                  <h3 className="text-lg font-semibold text-slate-800 mt-1">
                    Chọn bước nghiệp vụ có sẵn
                  </h3>
                </div>
                <button
                  onClick={() => setShowLibrary(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Tìm bước...</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={libraryFilter}
                    onChange={(e) => setLibraryFilter(e.target.value)}
                    placeholder="Ví dụ: Đề xuất mua sắm, Lập HSMT, Mở thầu..."
                  />
                </div>

                <div className="grid gap-2">
                  {BUOC_LIBRARY.filter((ten) =>
                    ten.toLowerCase().includes(libraryFilter.toLowerCase().trim()),
                  ).map((ten) => (
                    <button
                      key={ten}
                      type="button"
                      onClick={() => addLibraryStep(ten)}
                      className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-800">{ten}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Thêm bước có sẵn với dữ liệu mặc định.
                      </p>
                    </button>
                  ))}
                  {BUOC_LIBRARY.filter((ten) =>
                    ten.toLowerCase().includes(libraryFilter.toLowerCase().trim()),
                  ).length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      Không tìm thấy bước phù hợp.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
<div className="space-y-3 max-w-2xl mx-auto">
  {buocList.map((b, idx) => (
    <div key={b.id} className="flex flex-col items-center">
      {/* Bước thường */}
      <div
        className={`
          w-full max-w-xs px-4 py-3 rounded-2xl border-2 text-center transition-all
          ${
            b.coNhanhSongSong
              ? 'border-blue-300 bg-blue-50/70 shadow-sm shadow-blue-100/50'
              : 'border-slate-200 bg-white hover:shadow-md'
          }
        `}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-[11px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">
            {idx + 1}
          </span>
          <span className="text-sm font-medium text-slate-700 truncate">
            {b.ten}
          </span>
          {b.coNhanhSongSong && (
            <span className="text-[10px] bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="fa-solid fa-code-branch" />
              {b.nhanhList?.length || 0} nhánh
            </span>
          )}
        </div>
      </div>

      {/* Mũi tên nối (trừ bước cuối) */}
      {!b.coNhanhSongSong && idx < buocList.length - 1 && (
        <div className="text-slate-300 text-xl leading-none py-1">↓</div>
      )}

      {/* Khối nhánh song song */}
      {b.coNhanhSongSong && b.nhanhList?.length > 0 && (
        <div className="w-full mt-2 relative">
          {/* Đường dọc nối từ bước vào khối nhánh */}
          <div className="flex justify-center text-slate-300 text-xl leading-none">↓</div>

          <div className="relative border-l-4 border-blue-300 pl-6 ml-4 py-2">
            {/* Tiêu đề khối */}
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-code-branch text-blue-500 text-sm" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                Nhánh song song
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {b.nhanhList.length} nhánh
              </span>
            </div>

            {/* Danh sách nhánh - dùng grid để căn đều */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {b.nhanhList.map((nhanh, nIndex) => (
                <div
                  key={nhanh.id}
                  className="border border-blue-200 bg-white/80 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Header nhánh */}
                  <div className="bg-blue-50/80 px-3 py-2 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <i className="fa-regular fa-circle-check text-blue-400" />
                      Nhánh {nIndex + 1}
                      {nhanh.tenNhanh && (
                        <span className="font-normal text-slate-500">
                          : {nhanh.tenNhanh}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {nhanh.buocList.length} bước
                    </span>
                  </div>

                  {/* Danh sách bước trong nhánh */}
                  <div className="p-3 space-y-1.5">
                    {nhanh.buocList.length > 0 ? (
                      nhanh.buocList.map((nb, i) => (
                        <div
                          key={nb.id}
                          className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100"
                        >
                          <span className="text-[10px] font-mono text-slate-400 w-4 text-right">
                            {i + 1}.
                          </span>
                          <span className="truncate">{nb.ten}</span>
                          {nb.donViPhuTrach && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                              {nb.donViPhuTrach}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-[11px] text-slate-400 py-2 italic">
                        Chưa có bước nào
                      </div>
                    )}
                    {/* Mũi tên nhỏ cuối nhánh */}
                    {nhanh.buocList.length > 0 && (
                      <div className="flex justify-center text-slate-300 text-xs py-0.5">↓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Vùng hợp nhất */}
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 bg-purple-50/70 px-4 py-1.5 rounded-full border border-purple-200">
                <i className="fa-solid fa-code-merge" />
                Điều kiện hợp nhất: {b.dieuKienHopNhat === 'all' && 'Đợi tất cả nhánh hoàn thành'}
                {b.dieuKienHopNhat === 'any' && 'Chỉ cần một nhánh hoàn thành'}
                {b.dieuKienHopNhat === 'count' && `Tối thiểu ${b.soNhanhHopNhatToiThieu} nhánh`}
              </div>

              {/* Mũi tên dẫn đến bước sau hợp nhất */}
              <div className="text-slate-300 text-xl leading-none py-1">↓</div>

              {b.buocSauHopNhatId && (
                <div className="w-full max-w-xs px-4 py-2 rounded-xl border-2 border-purple-200 bg-purple-50/50 text-center text-sm font-medium text-slate-700">
                  {buocList.find(x => x.id === b.buocSauHopNhatId)?.ten || 'Bước đã chọn'}
                </div>
              )}
            </div>
          </div>

          {/* Mũi tên thoát khỏi khối (xuống bước tiếp theo) */}
          <div className="flex justify-center text-slate-300 text-xl leading-none mt-2">↓</div>
        </div>
      )}
    </div>
  ))}
</div>
          </section>
        )}
      </div>

      {/* ── STEP MODAL (Add + Edit) ───────────────────────────── */}
      {previewOpen && (
        <div className="fixed inset-0 z-[190] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Xem trước quy trình
                </p>
                <h3 className="text-lg font-semibold text-slate-800">
                  {hinhThuc || "Quy trình mẫu"}
                </h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="space-y-3">
              {(previewListSteps.length > 0 ? previewListSteps : ["Không có bước để hiển thị."]).map(
                (ten, idx) => (
                  <div key={`${ten}-${idx}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm text-slate-800">{ten}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
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
                  {STEP_MODAL_LOAI_BUOC.map((l) => (
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
                <input
                  className={inputCls}
                  value={stepForm.nhomGiaiDoan || "-- Tự động theo tên bước --"}
                  disabled
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
                    <option value="">-- Chọn đơn vị --</option>
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
                  <label className={labelCls}>
                    Vai trò xử lý <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={stepErrs.vaiTroXuLy ? inputErrCls : inputCls}
                    value={stepForm.vaiTroXuLy}
                    onChange={(e) => {
                      setStepForm((f) => ({
                        ...f,
                        vaiTroXuLy: e.target.value,
                      }));
                      setStepErrs((e2) => ({ ...e2, vaiTroXuLy: "" }));
                    }}
                  >
                    <option value="">-- Chọn vai trò --</option>
                    {VAI_TRO_OPTIONS.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  {stepErrs.vaiTroXuLy && (
                    <p className="text-xs text-red-500 mt-1">
                      {stepErrs.vaiTroXuLy}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Trạng thái mặc định</label>
                <input
                  className={inputCls}
                  value="Chưa bắt đầu"
                  disabled
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
                      <select
                        className={
                          stepErrs.donViKyHoSo ? inputErrCls : inputCls
                        }
                        value={stepForm.donViKyHoSo ?? ""}
                        onChange={(e) => {
                          setStepForm((f) => ({
                            ...f,
                            donViKyHoSo: e.target.value,
                          }));
                          setStepErrs((e2) => ({ ...e2, donViKyHoSo: "" }));
                        }}
                      >
                        <option value="">-- Chọn đơn vị --</option>
                        {DON_VI_KY_OPTIONS.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
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
                      <select
                        className={
                          stepErrs.vaiTroKyDuyet ? inputErrCls : inputCls
                        }
                        value={stepForm.vaiTroKyDuyet ?? ""}
                        onChange={(e) => {
                          setStepForm((f) => ({
                            ...f,
                            vaiTroKyDuyet: e.target.value,
                          }));
                          setStepErrs((e2) => ({ ...e2, vaiTroKyDuyet: "" }));
                        }}
                      >
                        <option value="">-- Chọn vai trò --</option>
                        {VAI_TRO_KY_OPTIONS.map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
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
  </div>

  {/* ─ Bước tiếp theo (xác định tự động) ─ */}
  {(() => {
    const currentIdx = buocList.findIndex(
      (b) => b.id === stepModal?.targetId
    );
    const nextStep = currentIdx >= 0 ? buocList[currentIdx + 1] : undefined;
    const nextStepName = nextStep?.ten ?? "Không có bước tiếp theo";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* ── Card KHI DUYỆT ── */}
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <i className="fa-solid fa-circle-check text-lg" />
            <span className="font-bold text-sm">KHI DUYỆT</span>
          </div>

          {/* Bước tiếp theo*/}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Bước tiếp theo
            </label>
            <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700">
              {nextStepName}
            </div>
          </div>

        </div>

        {/* ─ Card KHI KHÔNG DUYỆT ─ */}
        <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/30 space-y-3">
          <div className="flex items-center gap-2 text-rose-700">
            <i className="fa-solid fa-circle-xmark text-lg" />
            <span className="font-bold text-sm">KHI KHÔNG DUYỆT</span>
          </div>

          {/* Hướng xử lý */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Hướng xử lý <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stepForm.dieuKienChuyenTiep?.khiKhongDuyet?.xuLy ?? ""}
              onChange={(e) => {
                const value = e.target.value as "Trả về bước trước" | "Dừng quy trình";
                setStepForm((f) => ({
                  ...f, dieuKienChuyenTiep: {
                    ...f.dieuKienChuyenTiep, khiKhongDuyet: {
                      ...f.dieuKienChuyenTiep?.khiKhongDuyet, xuLy: value,
                    },
                  },
                }));
                }}
            >
              <option value="">-- Chọn hướng xử lý --</option>
              <option value="Trả về bước trước">Trả về bước trước</option>
              <option value="Dừng quy trình">Dừng quy trình</option>
            </select>
          </div>
        </div>

        {/* YÊU CẦU BẮT BUỘC */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">
            YÊU CẦU BẮT BUỘC
          </p>
          <div className="space-y-2">
            {[
              {
                key: "ghiChu",
                label: "Bắt buộc ghi chú",
                checked: stepForm.dieuKienChuyenTiep?.yeuCauBatBuoc?.ghiChu ?? false,
              },
              {
                key: "uploadTaiLieu",
                label: "Bắt buộc upload tài liệu",
                checked: stepForm.dieuKienChuyenTiep?.yeuCauBatBuoc?.uploadTaiLieu ?? false,
              },
              {
                key: "kyDuyet",
                label: "Bắt buộc ký duyệt",
                checked: stepForm.dieuKienChuyenTiep?.yeuCauBatBuoc?.kyDuyet ?? false,
              },
              {
                key: "hoanThanhTruocSLA",
                label: "Bắt buộc hoàn thành trước SLA",
                checked: stepForm.dieuKienChuyenTiep?.yeuCauBatBuoc?.hoanThanhTruocSLA ?? false,
              },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) =>
                    setStepForm((f) => ({
                      ...f,
                      dieuKienChuyenTiep: {
                        ...f.dieuKienChuyenTiep,
                        yeuCauBatBuoc: {
                          ...f.dieuKienChuyenTiep.yeuCauBatBuoc,
                          [item.key]: e.target.checked,
                        },
                      },
                    }))
                  }
                />
                <span className="text-xs text-slate-600">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  })()}

  {/* Lỗi validate chung cho điều kiện chuyển tiếp */}
  {stepErrs.dieuKienChuyenTiep && (
    <p className="text-xs text-red-500 mt-1">{stepErrs.dieuKienChuyenTiep}</p>
  )}
</div>
            {/* ── 6. Nhánh song song ── */}
            {(stepModal.mode === "edit" ||
            stepModal.parentType === "parallel-branch") && (
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
                        tenNhanh: `Nhánh ${stepForm.nhanhList.length + 1}`,
                        buocList: [],
                        // donVi: DON_VI_OPTIONS[0],
                        // vaiTro: VAI_TRO_OPTIONS[0],
                        // thoiHanNgay: 1,
                        // loaiThoiHan: "Chỉ cảnh báo quá hạn",
                        // buocDauTienId: "",
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
                            onClick={()=>{
                              if(confirm("Xóa nhánh này?")){
                                setStepForm(f=>({
                                  ...f,
                                 nhanhList:f.nhanhList.filter(
                                  n=>n.id!==nhanh.id
                                 )
                                }))
                              }
                            }}
                          // onClick={() =>
                          //   setStepForm((f) => ({
                          //     ...f,
                          //     nhanhList: f.nhanhList.filter(
                          //       (_, i) => i !== idx,
                          //     ),
                          //   }))
                          // }
                          className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-50"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                          {/* <i className="fa-solid fa-xmark text-xs" /> */}
                        </button>
                      </div>
                      <div className="space-y-3">

  {/* danh sách bước trong nhánh */}
  {nhanh.buocList.length === 0 ? (
<div className="flex gap-2">

<select
 className={inputCls}
 value={
   selectedBranchStep?.branchId === nhanh.id
   ? selectedBranchStep.stepId
   : ""
 }
 onChange={(e)=>{

   setSelectedBranchStep({
     branchId: nhanh.id,
     stepId:e.target.value
   });

 }}
>

<option value="">
 -- Chọn bước --
</option>


{buocList
.filter(b =>
  !nhanh.buocList.some(
    nb=>nb.id===b.id
  )
)
.map(b=>(
<option
 key={b.id}
 value={b.id}
>
 {b.ten}
</option>
))}

</select>


<button
 type="button"
 className="px-3 bg-blue-50 text-blue-600 rounded-lg text-xs"
 onClick={()=>{
 const step =
   buocList.find(
    b=>b.id===selectedBranchStep?.stepId
   );
 if(!step) return;
 setStepForm(f=>({
   ...f,
   nhanhList:f.nhanhList.map(n=>
    n.id===nhanh.id
    ?
    {
      ...n,

      buocList:[
        ...n.buocList,

        {
          ...step,
          id:Date.now().toString()
        }
      ]
    }
    :
    n
   )
 }));
 setSelectedBranchStep(null);
 }}
>
 Thêm
</button>


</div>
  ) : (
    <div className="space-y-2">

      {nhanh.buocList.map((b, stepIndex)=>(
        <div key={b.id}>

          <div className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">

            <div className="flex items-center gap-2">

              <i className="fa-solid fa-grip-lines text-slate-400"/>

              <span className="text-xs font-medium">
                {b.ten}
              </span>

            </div>


            <div className="flex gap-2">

              <button
                onClick={()=>openEdit(b)}
              >
                <i className="fa-solid fa-pen text-xs"/>
              </button>


              <button
                onClick={()=>{
                  // delete step
                }}
              >
                <i className="fa-solid fa-ellipsis text-xs"/>
              </button>

            </div>

          </div>


          {stepIndex !== nhanh.buocList.length-1 && (
            <div className="text-center text-slate-400">
              ↓
            </div>
          )}

        </div>
      ))}


<div className="flex gap-2">

<select
 className={inputCls}
 value={
   selectedBranchStep?.branchId === nhanh.id
   ? selectedBranchStep.stepId
   : ""
 }
 onChange={(e)=>{

   setSelectedBranchStep({
     branchId: nhanh.id,
     stepId:e.target.value
   });

 }}
>

<option value="">
 -- Chọn bước --
</option>


{buocList
.filter(b =>
  !nhanh.buocList.some(
    nb=>nb.id===b.id
  )
)
.map(b=>(
<option
 key={b.id}
 value={b.id}
>
 {b.ten}
</option>
))}

</select>


<button
 type="button"
 className="px-3 bg-blue-50 text-blue-600 rounded-lg text-xs"
 onClick={()=>{
 const step =
   buocList.find(
    b=>b.id===selectedBranchStep?.stepId
   );
 if(!step) return;
 setStepForm(f=>({
   ...f,
   nhanhList:f.nhanhList.map(n=>
    n.id===nhanh.id
    ?
    {
      ...n,
      buocList:[
        ...n.buocList,
        {
          ...step,
          id:Date.now().toString()
        }
      ]
    }
    :
    n
   )
 }));
 setSelectedBranchStep(null);
 }}
>
 Thêm
</button>


</div>

    </div>
  )}

</div>
                      {/* <div className="grid grid-cols-2 gap-2">
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
                          <select
                            className={inputCls}
                            value={nhanh.buocDauTienId}
                            onChange={(e) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? { ...n, buocDauTienId: e.target.value }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                          >
                            <option value="">-- Chọn bước --</option>
                            {buocList
                              .filter((b) => b.id !== stepModal?.targetId)
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.ten}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Đơn vị</label>
                          <select
                            className={inputCls}
                            value={nhanh.donVi}
                            onChange={(e) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx ? { ...n, donVi: e.target.value } : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                          >
                            {DON_VI_OPTIONS.map((d) => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Vai trò</label>
                          <select
                            className={inputCls}
                            value={nhanh.vaiTro}
                            onChange={(e) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? { ...n, vaiTro: e.target.value }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                          >
                            {VAI_TRO_OPTIONS.map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
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
                          <select
                            className={inputCls}
                            value={nhanh.loaiThoiHan}
                            onChange={(e) => {
                              const updated = stepForm.nhanhList.map((n, i) =>
                                i === idx
                                  ? {
                                      ...n,
                                      loaiThoiHan: e.target
                                        .value as LoaiThoiHan,
                                    }
                                  : n,
                              );
                              setStepForm((f) => ({
                                ...f,
                                nhanhList: updated,
                              }));
                            }}
                          >
                            <option value="Chỉ cảnh báo quá hạn">
                              Chỉ cảnh báo quá hạn
                            </option>
                            <option value="Bắt buộc hoàn thành trước hạn">
                              Bắt buộc hoàn thành trước hạn
                            </option>
                          </select>
                        </div>
                      </div> */}
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
  <label className="flex gap-2 items-center">
    <input
      type="radio"
      name="dieuKienHopNhat"
      checked={stepForm.dieuKienHopNhat === "all"}
      onChange={() =>
        setStepForm((f) => ({
          ...f,
          dieuKienHopNhat: "all",
          soNhanhHopNhatToiThieu: f.nhanhList.length,
        }))
      }
    />
    <span className="text-xs text-slate-700">
      Đợi tất cả nhánh hoàn thành
    </span>
  </label>
label</div>
                            {/* // <label
                            //   key={v}
                            //   className="flex items-center gap-2 cursor-pointer"
                            // >
                            //   <input
                            //     type="radio"
                            //     name="dieuKienHopNhat"
                            //     value={v}
                            //     checked={stepForm.dieuKienHopNhat === v}
                            //     onChange={() =>
                            //       setStepForm((f) => ({
                            //         ...f,
                            //         dieuKienHopNhat: v,
                            //       }))
                            //     }
                            //   />
                            //   <span className="text-xs text-slate-700">
                            //     {v === "all"
                            //       ? "Đợi tất cả nhánh hoàn thành"
                            //       : v === "any"
                            //         ? "Chỉ cần một nhánh hoàn thành"
                            //         : "Theo số lượng hoàn thành"}
                            //   </span>
                            // </label> */}

                        {stepForm.dieuKienHopNhat === "all" && (
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
                        <select
                          className={inputCls}
                          value={stepForm.buocSauHopNhatId ?? ""}
                          onChange={(e) =>
                            setStepForm((f) => ({
                              ...f,
                              buocSauHopNhatId: e.target.value,
                            }))
                          }
                        >
                          <option value="">-- Chọn bước --</option>
                          {buocList
                            .filter((b) => b.id !== stepModal?.targetId)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.ten}
                              </option>
                            ))}
                        </select>
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
            )}

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
