import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { taoGoiThauSchema } from "@/util/validate";
import type { InferType } from "yup";
import { useFileAttachment } from "@/hooks/useFileAttachment";
import {
  formatBytes,
  fileIcon,
  openFile,
  downloadFile,
} from "@/util/fileAttachment";
import {
  addGoiThau,
  generateGoiThauId,
  formatVND,
  getGoiThauById,
  updateGoiThau,
} from "@/pages/DanhSachGoiThau/goiThauService";
import type { GoiThau, HinhThuc, LoaiGoiThau } from "@/pages/DanhSachGoiThau/goiThauService";
import { getQuyTrinhList, type QuyTrinh } from "@/pages/DanhSachQuyTrinh/quyTrinhService";

/* ─ RBAC ─ */
const MOCK_CURRENT_ROLE = "Admin";
const CAN_CREATE = MOCK_CURRENT_ROLE === "Admin" || MOCK_CURRENT_ROLE === "Quản lý" || MOCK_CURRENT_ROLE === "Nhân viên";
const MOCK_CURRENT_USER = {
  hoTen: "Nguyễn Mạnh Tuấn",
  donVi: "P.HCQT",
};

const HT_BADGE: Partial<Record<HinhThuc, string>> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định LCNT": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};

const LOAI_GOI_THAU_OPTIONS: LoaiGoiThau[] = [
  "Hàng hóa",
  "Dịch vụ tư vấn",
  "Dịch vụ phi tư vấn",
  "Xây lắp",
];

const QUY_TRINH_BY_LOAI: Record<LoaiGoiThau, HinhThuc[]> = {
  "Hàng hóa": [
    "Chỉ định thầu tự quyết định LCNT",
    "Chỉ định thầu rút gọn",
    "Chỉ định thầu thông thường",
    "Chào hàng cạnh tranh",
    "Đấu thầu rộng rãi",
    "Mua sắm trực tiếp",
    "Chào giá trực tuyến thông thường",
    "Chào giá trực tuyến rút gọn",
    "Mua sắm trực tuyến",
    "Đặt hàng",
  ],
  "Dịch vụ tư vấn": [
    "Chỉ định thầu tự quyết định LCNT",
    "Chỉ định thầu rút gọn",
    "Chỉ định thầu thông thường",
    "Đấu thầu rộng rãi",
    "Mua sắm trực tiếp",
    "Đặt hàng",
  ],
  "Dịch vụ phi tư vấn": [
    "Chỉ định thầu tự quyết định LCNT",
    "Chỉ định thầu rút gọn",
    "Chỉ định thầu thông thường",
    "Chào hàng cạnh tranh",
    "Đấu thầu rộng rãi",
    "Mua sắm trực tiếp",
    "Chào giá trực tuyến thông thường",
    "Chào giá trực tuyến rút gọn",
    "Đặt hàng",
  ],
  "Xây lắp": [
    "Chỉ định thầu tự quyết định LCNT",
    "Chỉ định thầu rút gọn",
    "Chỉ định thầu thông thường",
    "Chào hàng cạnh tranh",
    "Đấu thầu rộng rãi",
    "Mua sắm trực tiếp",
    "Chào giá trực tuyến rút gọn",
    "Đặt hàng",
  ],
};

const NGUON_VON = [
  "Ngân sách Nhà nước",
  "Ngân sách BV",
  "Tự chủ tài chính",
  "Nguồn khác",
];

const THEO_DOI_GROUPS = [
  {
    label: "Nhóm Khoa/Phòng",
    options: [
      "Khoa/Phòng mua sắm",
      "Khoa/Phòng sử dụng",
      "Phòng HCQT",
      "Phòng CNTT",
      "Phòng CTXH",
      "Phòng KHTH",
      "Phòng QLCL",
      "Phòng TCCB",
      "Khoa/Phòng khác",
    ],
  },
  {
    label: "Nhóm Vai trò quản lý",
    options: [
      "BCN",
      "BGĐ",
      "Giám đốc",
      "PGĐ được ủy quyền",
      "Kế toán trưởng",
      "Tổ pháp chế",
      "BCN Phòng HCQT",
    ],
  },
  {
    label: "Nhóm Tổ/Nhóm nghiệp vụ",
    options: [
      "Tổ kiểm tra giá",
      "Tổ chuyên gia",
      "Tổ thẩm định",
      "Tư vấn LCNT",
      "Tư vấn thẩm định",
      "Chủ đầu tư",
    ],
  },
  {
    label: "Nhóm đối tượng ngoài BV",
    options: ["Nhà thầu", "Nhà thầu tư vấn LCNT", "Nhà cung cấp"],
  },
];

function inferLoaiGoiThau(hinhThuc?: HinhThuc): LoaiGoiThau {
  if (hinhThuc && QUY_TRINH_BY_LOAI["Hàng hóa"].includes(hinhThuc)) {
    return "Hàng hóa";
  }
  return "Hàng hóa";
}

function normalizeTheoDoi(value: string) {
  return value
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/phòng/g, "p")
    .replace(/\s+/g, "")
    .trim();
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

type FormData = InferType<typeof taoGoiThauSchema>;
type QuyTrinhBuoc = QuyTrinh["buocList"][number];

type LocationState = {
  goiThau?: GoiThau;
};

const EDITABLE_STATUSES = ["Nháp", "Chờ duyệt"];

function toDateInputValue(value: string) {
  if (!value || value === "—") return "";
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return value;
}

function makeWorkflowStep(
  id: string,
  ten: string,
  index: number,
  total: number,
  slaNgay = 2,
): QuyTrinhBuoc {
  return {
    id,
    ten,
    loai: index === 0 ? "Bắt đầu" : index === total - 1 ? "Kết thúc" : "Thường",
    donViPhuTrach: index >= total - 3 ? "Giám đốc BV" : "K/p mua sắm",
    vaiTroXuLy: index >= total - 3 ? "Quản lý" : "Nhân viên",
    slaNgay,
    trangThaiMacDinh: index === 0 ? "Đang xử lý" : "Chờ duyệt",
    dieuKienChuyen: ["Duyệt"],
    buocTiepTheoId: index < total - 1 ? `${id.split("-B")[0]}-B${index + 2}` : "",
    moTa: "",
  };
}

function makeDefaultWorkflow(id: string, hinhThuc: HinhThuc, steps: string[]): QuyTrinh {
  return {
    id,
    ten: `Quy trình ${hinhThuc}`,
    hinhThuc,
    trangThai: "Đang hoạt động",
    ngayTao: new Date().toISOString(),
    buocList: steps.map((ten, index) =>
      makeWorkflowStep(`${id}-B${index + 1}`, ten, index, steps.length),
    ),
  };
}

const DEFAULT_WORKFLOWS: Record<HinhThuc, QuyTrinh> = {
  "Chỉ định thầu tự quyết định LCNT": makeDefaultWorkflow("QT-MACDINH-CDT-TQD-LCNT", "Chỉ định thầu tự quyết định LCNT", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Lập hồ sơ mời thầu",
    "Phê duyệt hồ sơ mời thầu",
    "Quyết định chỉ định nhà thầu",
  ]),
  "Chỉ định thầu rút gọn": makeDefaultWorkflow("QT-MACDINH-CDT-RG", "Chỉ định thầu rút gọn", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Đăng tải yêu cầu báo giá",
    "Biên bản kiểm tra báo giá",
    "Tờ trình phê duyệt dự toán",
    "Quyết định phê duyệt dự toán",
    "Quyết định chỉ định nhà thầu",
  ]),
  "Chỉ định thầu thông thường": makeDefaultWorkflow("QT-MACDINH-CDT-TT", "Chỉ định thầu thông thường", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Lập hồ sơ yêu cầu",
    "Thẩm định hồ sơ yêu cầu",
    "Phê duyệt hồ sơ yêu cầu",
    "Đánh giá hồ sơ đề xuất",
    "Phê duyệt kết quả lựa chọn nhà thầu",
  ]),
  "Chào hàng cạnh tranh": makeDefaultWorkflow("QT-MACDINH-CHCT", "Chào hàng cạnh tranh", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Đăng tải yêu cầu báo giá",
    "Biên bản kiểm tra báo giá",
    "Tờ trình phê duyệt dự toán",
    "Quyết định phê duyệt dự toán",
    "Tờ trình kế hoạch LCNT",
    "Quyết định kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Phát hành hồ sơ mời thầu",
    "Nộp hồ sơ dự thầu",
    "Mở thầu và đánh giá HSDT",
    "Trình kết quả lựa chọn nhà thầu",
    "Quyết định phê duyệt kết quả đấu thầu",
  ]),
  "Đấu thầu rộng rãi": makeDefaultWorkflow("QT-MACDINH-DTRR", "Đấu thầu rộng rãi", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Tờ trình phê duyệt dự toán",
    "Quyết định phê duyệt dự toán",
    "Tờ trình kế hoạch LCNT",
    "Quyết định kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Lập hồ sơ mời thầu",
    "Phê duyệt HSMT",
    "Đăng tải mời thầu",
    "Nộp HSDT",
    "Mở thầu",
    "Đánh giá HSDT",
    "Trình kết quả lựa chọn nhà thầu",
    "Quyết định phê duyệt kết quả",
    "Đăng tải kết quả LCNT",
    "Ký kết hợp đồng",
  ]),
  "Mua sắm trực tiếp": makeDefaultWorkflow("QT-MACDINH-MSTT", "Mua sắm trực tiếp", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Phê duyệt dự toán",
    "Thương thảo nhà cung cấp",
    "Phê duyệt kết quả mua sắm trực tiếp",
    "Ký kết hợp đồng",
  ]),
  "Chào giá trực tuyến thông thường": makeDefaultWorkflow("QT-MACDINH-CGTT-TT", "Chào giá trực tuyến thông thường", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Đăng tải chào giá trực tuyến",
    "Tiếp nhận báo giá",
    "Đánh giá báo giá",
    "Phê duyệt kết quả chào giá",
    "Ký kết hợp đồng",
  ]),
  "Chào giá trực tuyến rút gọn": makeDefaultWorkflow("QT-MACDINH-CGTT-RG", "Chào giá trực tuyến rút gọn", [
    "Đề xuất mua sắm",
    "Đăng tải chào giá trực tuyến",
    "Tiếp nhận báo giá",
    "Phê duyệt kết quả chào giá",
    "Ký kết hợp đồng",
  ]),
  "Mua sắm trực tuyến": makeDefaultWorkflow("QT-MACDINH-MST", "Mua sắm trực tuyến", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Chọn hàng hóa trên hệ thống",
    "Phê duyệt đơn hàng",
    "Hoàn tất mua sắm",
  ]),
  "Đặt hàng": makeDefaultWorkflow("QT-MACDINH-DH", "Đặt hàng", [
    "Đề xuất mua sắm",
    "Tờ trình chủ trương",
    "Lập phiếu đặt hàng",
    "Phê duyệt đặt hàng",
    "Theo dõi thực hiện",
  ]),
};

export default function TaoGoiThau() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id") ?? "";
  const isEditMode = searchParams.get("mode") === "edit" && !!editId;
  const locationState = location.state as LocationState | null;
  const editingGoiThau = useMemo(
    () => (isEditMode ? (locationState?.goiThau ?? getGoiThauById(editId)) : undefined),
    [editId, isEditMode, locationState?.goiThau],
  );
  const canEditCurrent =
    !!editingGoiThau && EDITABLE_STATUSES.includes(editingGoiThau.trangThai);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [quyTrinhList, setQuyTrinhList] = useState<QuyTrinh[]>([]);
  const [theoDoiOpen, setTheoDoiOpen] = useState(false);
  const [theoDoiList, setTheoDoiList] = useState<string[]>([]);
  const { attachments, getRootProps, getInputProps, isDragActive, removeFile } =
    useFileAttachment();

  useEffect(() => {
    setQuyTrinhList(getQuyTrinhList().filter((qt) => qt.trangThai === "Đang hoạt động"));
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(taoGoiThauSchema),
    defaultValues: { donVi: MOCK_CURRENT_USER.donVi, ghiChu: "", loaiGoiThau: "", hinhThuc: "" },
  });

  const watched = watch();
  const selectedLoaiGoiThau = watched.loaiGoiThau as LoaiGoiThau | "";
  const filteredQuyTrinhOptions = selectedLoaiGoiThau
    ? QUY_TRINH_BY_LOAI[selectedLoaiGoiThau]
    : [];
  const hasPreview = !!(watched.ten?.trim() || watched.loaiGoiThau || watched.hinhThuc);
  const ghiChuLen = watched.ghiChu?.length ?? 0;
  const normalizedDonViDeXuat = normalizeTheoDoi(watched.donVi || "");

  const selectedQT = watched.hinhThuc
    ? (quyTrinhList.find((qt) => qt.hinhThuc === watched.hinhThuc) ??
      DEFAULT_WORKFLOWS[watched.hinhThuc as HinhThuc])
    : null;

  useEffect(() => {
    if (!selectedLoaiGoiThau || !watched.hinhThuc) return;
    if (!QUY_TRINH_BY_LOAI[selectedLoaiGoiThau].includes(watched.hinhThuc as HinhThuc)) {
      setValue("hinhThuc", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [selectedLoaiGoiThau, setValue, watched.hinhThuc]);
  useEffect(() => {
    setTheoDoiList((prev) =>
      prev.filter((item) => normalizeTheoDoi(item) !== normalizedDonViDeXuat),
    );
  }, [normalizedDonViDeXuat]);
  const quyTrinhStats = useMemo(() => {
    if (!selectedQT) return null;
    const tongSoBuoc = selectedQT.buocList.length;
    const slaDuKien = selectedQT.buocList.reduce(
      (sum, buoc) => sum + (Number(buoc.slaNgay) || 0),
      0,
    );
    const soBuocCanDuyet = selectedQT.buocList.filter(
      (buoc) =>
        buoc.trangThaiMacDinh === "Chờ duyệt" ||
        buoc.dieuKienChuyen.includes("Duyệt"),
    ).length;

    return {
      tenQuyTrinh: selectedQT.ten,
      tongSoBuoc,
      slaDuKien,
      soBuocCanDuyet,
    };
  }, [selectedQT]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<FormData | null>(null);

  function isSameAsDonViDeXuat(option: string) {
    return normalizeTheoDoi(option) === normalizedDonViDeXuat;
  }

  function toggleTheoDoi(option: string) {
    if (isSameAsDonViDeXuat(option)) {
      toast.error("Không được chọn trùng với Đơn vị đề xuất");
      return;
    }
    setTheoDoiList((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option],
    );
  }

  function removeTheoDoi(option: string) {
    setTheoDoiList((prev) => prev.filter((item) => item !== option));
  }

  useEffect(() => {
    if (!isEditMode) return;
    if (!editingGoiThau) {
      toast.error("Không tìm thấy gói thầu cần chỉnh sửa");
      navigate("/danh-sach-goi-thau", { replace: true });
      return;
    }
    if (!canEditCurrent) {
      toast.error("Chỉ được chỉnh sửa gói thầu ở trạng thái Nháp hoặc Chờ duyệt");
      navigate("/danh-sach-goi-thau", { replace: true });
      return;
    }
    reset({
      ten: editingGoiThau.ten,
      loaiGoiThau: editingGoiThau.loaiGoiThau ?? inferLoaiGoiThau(editingGoiThau.hinhThuc),
      hinhThuc: editingGoiThau.hinhThuc,
      nguonVon: editingGoiThau.detail.nguonVon,
      giaTriStr: editingGoiThau.giaTriStr,
      donVi: editingGoiThau.donVi || MOCK_CURRENT_USER.donVi,
      ngayTao: toDateInputValue(editingGoiThau.detail.ngayTao),
      ghiChu: "",
    });
    setTheoDoiList(editingGoiThau.theoDoi ?? []);
  }, [canEditCurrent, editingGoiThau, isEditMode, navigate, reset]);

  function buildGoiThauFromForm(data: FormData, trangThai: GoiThau["trangThai"]) {
    const num = parseInt(data.giaTriStr.replace(/[^\d]/g, ""), 10) || 0;
    return {
      id: editingGoiThau?.id ?? generateGoiThauId(),
      ten: data.ten.trim(),
      loaiGoiThau: data.loaiGoiThau as LoaiGoiThau,
      hinhThuc: data.hinhThuc as HinhThuc,
      theoDoi: theoDoiList,
      giaTriStr: formatVND(data.giaTriStr),
      giaTriNum: num,
      donVi: data.donVi,
      trangThai,
      detail: {
        nguonVon: data.nguonVon,
        ngayTao: data.ngayTao,
        hanHT: editingGoiThau?.detail.hanHT ?? "—",
        pct: editingGoiThau?.detail.pct ?? "0%",
        buoc: editingGoiThau?.detail.buoc ?? (selectedQT ? `0/${selectedQT.buocList.length}` : "1/14"),
      },
    };
  }

  /* ─ Gửi đề xuất ─ */
  function onSubmit(data: FormData) {
    setPendingSubmitData(data);
    setConfirmOpen(true);
  }

  function doSubmit() {
    if (!pendingSubmitData) return;
    const data = pendingSubmitData;
    const item = buildGoiThauFromForm(data, "Chờ duyệt");
    if (isEditMode) {
      updateGoiThau(item);
      toast.success("Gói thầu đã được cập nhật và gửi đề xuất");
    } else {
      addGoiThau(item);
      toast.success("Gói thầu đã được gửi đề xuất và đang chờ duyệt");
    }
    setConfirmOpen(false);
    navigate("/danh-sach-goi-thau");
  }

  function saveChanges(values: FormData) {
    if (!editingGoiThau) return;
    setSavingChanges(true);
    updateGoiThau(buildGoiThauFromForm(values, editingGoiThau.trangThai));
    toast.success("Đã lưu thay đổi gói thầu");
    navigate("/danh-sach-goi-thau");
  }

  /* ─ Lưu nháp ─ */
  function saveDraft() {
    const values = watch();
    if (!values.ten?.trim()) {
      toast.error("Vui lòng nhập tên gói thầu trước khi lưu nháp");
      return;
    }
    setSavingDraft(true);
    const num =
      parseInt((values.giaTriStr ?? "").replace(/[^\d]/g, ""), 10) || 0;
    addGoiThau({
      id: generateGoiThauId(),
      ten: values.ten.trim(),
      loaiGoiThau: (values.loaiGoiThau || "Hàng hóa") as LoaiGoiThau,
      hinhThuc: (values.hinhThuc || "Chỉ định thầu rút gọn") as HinhThuc,
      theoDoi: theoDoiList,
      giaTriStr: values.giaTriStr ? formatVND(values.giaTriStr) : "0",
      giaTriNum: num,
      donVi: values.donVi || "—",
      trangThai: "Nháp",
      detail: {
        nguonVon: values.nguonVon || "—",
        ngayTao: values.ngayTao || "—",
        hanHT: "—",
        pct: "0%",
        buoc: "0/14",
      },
    });
    toast.success("Gói thầu đã được lưu nháp thành công");
    navigate("/danh-sach-goi-thau");
  }

  const cls = (field: keyof FormData) =>
    errors[field] ? inputErrCls : inputCls;

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">
            {isEditMode ? "Chỉnh sửa gói thầu" : "Tạo gói thầu"}
          </h1>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {/* FORM CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <i className="fa-solid fa-plus text-sm" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Thông tin gói thầu
                </p>
                <p className="text-xs text-slate-400">
                  {isEditMode
                    ? "Cập nhật thông tin gói thầu đang chọn"
                    : "Vui lòng điền đầy đủ các thông tin bắt buộc"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Tên gói thầu */}
              <div>
                <label className={labelCls}>
                  Tên gói thầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Mua sắm thiết bị y tế khoa Nội"
                  {...register("ten")}
                  className={cls("ten")}
                />
                {errors.ten && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.ten.message}
                  </p>
                )}
              </div>

              {/* Loại gói thầu */}
              <div>
                <label className={labelCls}>
                  Loại gói thầu <span className="text-red-500">*</span>
                </label>
                <select {...register("loaiGoiThau")} className={cls("loaiGoiThau")}>
                  <option value="">-- Chọn loại gói thầu --</option>
                  {LOAI_GOI_THAU_OPTIONS.map((loai) => (
                    <option key={loai} value={loai}>
                      {loai}
                    </option>
                  ))}
                </select>
                {errors.loaiGoiThau && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.loaiGoiThau.message}
                  </p>
                )}
              </div>

              {/* Quy trình đấu thầu + Nguồn vốn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Quy trình đấu thầu <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("hinhThuc")}
                    disabled={!selectedLoaiGoiThau}
                    className={`${cls("hinhThuc")} ${
                      !selectedLoaiGoiThau ? "cursor-not-allowed opacity-70" : ""
                    }`}
                  >
                    <option value="">
                      {selectedLoaiGoiThau
                        ? "-- Chọn quy trình đấu thầu --"
                        : "Vui lòng chọn loại gói thầu trước"}
                    </option>
                    {filteredQuyTrinhOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.hinhThuc && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.hinhThuc.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Nguồn vốn <span className="text-red-500">*</span>
                  </label>
                  <select {...register("nguonVon")} className={cls("nguonVon")}>
                    <option value="">-- Chọn nguồn vốn --</option>
                    {NGUON_VON.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  {errors.nguonVon && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.nguonVon.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Quy trình áp dụng */}
              <div>
                <label className={labelCls}>Quy trình áp dụng</label>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  {selectedQT ? (
                    <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          {selectedQT.ten}
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">
                          Quy trình đấu thầu đã chọn
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        {selectedQT.buocList.length} bước
                      </span>
                    </div>
                    {quyTrinhStats && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          ["Tổng số bước", `${quyTrinhStats.tongSoBuoc} bước`],
                          ["Thời hạn xử lý dự kiến", `${quyTrinhStats.slaDuKien} ngày`],
                          ["Số bước cần duyệt", `${quyTrinhStats.soBuocCanDuyet} bước`],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                            <p className="text-[11px] font-semibold text-blue-400">{label}</p>
                            <p className="text-sm font-bold text-blue-800">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedQT.buocList.map((b, i) => (
                        <div
                          key={b.id}
                          className="flex items-start gap-2 rounded-lg bg-white border border-blue-100 px-3 py-2"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800">
                              {b.ten}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {b.donViPhuTrach} · Thời hạn {b.slaNgay} ngày
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        Quy trình áp dụng
                      </p>
                      <p className="text-xs text-blue-500 mt-1">
                        Vui lòng chọn quy trình đấu thầu để xem chi tiết.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Giá trị + Đơn vị */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Giá trị gói thầu (VNĐ){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VD: 320,000,000"
                      {...register("giaTriStr")}
                      className={cls("giaTriStr")}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      đ
                    </span>
                  </div>
                  {errors.giaTriStr && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.giaTriStr.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Đơn vị đề xuất <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    {...register("donVi")}
                    className={`${cls("donVi")} cursor-not-allowed text-slate-700`}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tự động lấy từ tài khoản đăng nhập: {MOCK_CURRENT_USER.hoTen}
                  </p>
                  {errors.donVi && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.donVi.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Đơn vị/Vai trò theo dõi */}
              <div>
                <label className={labelCls}>Đơn vị/Vai trò theo dõi</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTheoDoiOpen((open) => !open)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between gap-3 text-left"
                  >
                    <span className="text-slate-500">
                      {theoDoiList.length > 0
                        ? `${theoDoiList.length} đơn vị/vai trò đã chọn`
                        : "Chọn đơn vị hoặc vai trò"}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${
                        theoDoiOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {theoDoiOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <p className="text-xs font-bold text-slate-700">
                          Đơn vị/Vai trò theo dõi
                        </p>
                        <button
                          type="button"
                          onClick={() => setTheoDoiOpen(false)}
                          className="h-7 px-2 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                        >
                          Xong
                        </button>
                      </div>
                      <div className="space-y-3">
                        {THEO_DOI_GROUPS.map((group) => (
                          <div key={group.label}>
                            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              {group.label}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {group.options.map((option) => {
                                const disabled = isSameAsDonViDeXuat(option);
                                const checked = theoDoiList.includes(option);
                                return (
                                  <label
                                    key={option}
                                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                                      disabled
                                        ? "cursor-not-allowed text-slate-300"
                                        : "cursor-pointer text-slate-600 hover:bg-blue-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={() => toggleTheoDoi(option)}
                                      className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                                    />
                                    <span>{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {theoDoiList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {theoDoiList.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeTheoDoi(item)}
                          className="text-blue-400 hover:text-blue-700"
                          title={`Xóa ${item}`}
                        >
                          <i className="fa-solid fa-xmark text-[10px]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Có thể chọn nhiều đơn vị hoặc vai trò. Không bắt buộc nhập.
                </p>
              </div>

              {/* Ngày tạo */}
              <div>
                <label className={labelCls}>
                  Ngày tạo <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("ngayTao")}
                  className={cls("ngayTao")}
                />
                {errors.ngayTao && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.ngayTao.message}
                  </p>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <label className={labelCls}>Ghi chú / Lý do mua sắm</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả nhu cầu mua sắm, lý do cần thiết..."
                  {...register("ghiChu")}
                  className={`${
                    errors.ghiChu ? inputErrCls : inputCls
                  } resize-none`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.ghiChu ? (
                    <p className="text-xs text-red-500">
                      {errors.ghiChu.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`text-[11px] ml-auto ${
                      ghiChuLen > 1000
                        ? "text-red-500 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {ghiChuLen}/1000
                  </span>
                </div>
              </div>

              {/* TÀI LIỆU ĐÍNH KÈM */}
              <div>
                <label className={labelCls}>
                  Tài liệu đính kèm{" "}
                  <span className="text-slate-400 font-normal">
                    (PDF, DOCX, XLSX, hình ảnh — tối đa 20 MB/file)
                  </span>
                </label>

                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
                >
                  <input {...getInputProps()} />
                  <i
                    className={`fa-solid fa-cloud-arrow-up text-2xl mb-2 block ${
                      isDragActive ? "text-blue-400" : "text-slate-300"
                    }`}
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    {isDragActive
                      ? "Thả file vào đây..."
                      : "Kéo thả hoặc nhấn để chọn file"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PDF · DOCX · XLSX · PNG · JPG — tối đa 20 MB/file
                  </p>
                </div>

                {/* Danh sách file */}
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {attachments.map((file, idx) => {
                      const { icon, color } = fileIcon(file.name);
                      return (
                        <li
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
                        >
                          <i
                            className={`fa-solid ${icon} ${color} text-lg shrink-0`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Xem file"
                              onClick={() => openFile(file)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <i className="fa-solid fa-eye text-xs" />
                            </button>
                            <button
                              type="button"
                              title="Tải xuống"
                              onClick={() => downloadFile(file)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <i className="fa-solid fa-download text-xs" />
                            </button>
                            <button
                              type="button"
                              title="Xóa file"
                              onClick={() => removeFile(idx)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <i className="fa-solid fa-xmark text-xs" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {attachments.length > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5 text-right">
                    {attachments.length} file ·{" "}
                    {formatBytes(attachments.reduce((s, f) => s + f.size, 0))}{" "}
                    tổng
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/danh-sach-goi-thau")}
                  className="px-5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={handleSubmit(saveChanges)}
                    disabled={isSubmitting || savingChanges}
                    className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    {savingChanges ? (
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    ) : (
                      <i className="fa-regular fa-floppy-disk text-xs" />
                    )}{" "}
                    Lưu thay đổi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={isSubmitting || savingDraft}
                    className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    {savingDraft ? (
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    ) : (
                      <i className="fa-regular fa-floppy-disk text-xs" />
                    )}{" "}
                    Lưu nháp
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || savingDraft || savingChanges}
                  className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                  ) : (
                    <i className="fa-solid fa-paper-plane text-xs" />
                  )}{" "}
                  Gửi đề xuất
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* PREVIEW PANEL */}
        <aside className="w-[270px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
            XEM TRƯỚC
          </p>

          {hasPreview ? (
            <>
              <div className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                {watched.ten || (
                  <span className="text-slate-300">Chưa có tên</span>
                )}
              </div>
              <div className="space-y-2 mt-3">
                {[
                  ["Loại gói thầu", watched.loaiGoiThau || "—"],
                  ["Quy trình đấu thầu", watched.hinhThuc || "—"],
                  [
                    "Tổng số bước",
                    quyTrinhStats ? `${quyTrinhStats.tongSoBuoc} bước` : "—",
                  ],
                  [
                    "Thời hạn xử lý dự kiến",
                    quyTrinhStats ? `${quyTrinhStats.slaDuKien} ngày` : "—",
                  ],
                  [
                    "Giá trị",
                    watched.giaTriStr ? `${formatVND(watched.giaTriStr)} đ` : "—",
                  ],
                  ["Nguồn vốn", watched.nguonVon || "—"],
                  ["Đơn vị", watched.donVi || "—"],
                  [
                    "Theo dõi",
                    theoDoiList.length > 0 ? `${theoDoiList.length} mục` : "—",
                  ],
                  ["Ngày tạo", watched.ngayTao || "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-400">{lbl}</span>
                    <span className="text-slate-800 font-medium text-right">{val}</span>
                  </div>
                ))}
              </div>
              {theoDoiList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {theoDoiList.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
              {watched.hinhThuc && (
                <span
                  className={`mt-3 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${HT_BADGE[watched.hinhThuc as HinhThuc] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {watched.hinhThuc}
                </span>
              )}
              {watched.ghiChu && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">
                    GHI CHÚ
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {watched.ghiChu}
                  </p>
                </div>
              )}
              {selectedQT && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 tracking-wide mb-1.5">
                    QUY TRÌNH ÁP DỤNG
                  </p>
                  <div className="space-y-2 mb-3">
                    {(
                      [
                        ["Tên quy trình", quyTrinhStats?.tenQuyTrinh ?? "—"],
                        [
                          "Tổng số bước",
                          quyTrinhStats
                            ? `${quyTrinhStats.tongSoBuoc} bước`
                            : "—",
                        ],
                        [
                          "Thời hạn xử lý dự kiến",
                          quyTrinhStats
                            ? `${quyTrinhStats.slaDuKien} ngày`
                            : "—",
                        ],
                        [
                          "Số bước cần duyệt",
                          quyTrinhStats
                            ? `${quyTrinhStats.soBuocCanDuyet} bước`
                            : "—",
                        ],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3 text-xs">
                        <span className="text-blue-400">{label}</span>
                        <span className="text-right font-semibold text-blue-800">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedQT.buocList.map((b, i) => (
                      <span
                        key={b.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white text-blue-600 border border-blue-200"
                      >
                        {i + 1}. {b.ten.length > 12 ? b.ten.slice(0, 12) + "…" : b.ten}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <i className="fa-regular fa-file-lines text-slate-300 text-xl" />
              </div>
              <p className="text-xs text-slate-400">
                Bắt đầu nhập thông tin để xem trước gói thầu
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* CONFIRM SUBMIT MODAL */}
      {confirmOpen && pendingSubmitData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-paper-plane text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Xác nhận gửi đề xuất</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gói thầu <strong>"{pendingSubmitData.ten}"</strong> sẽ được
                  gửi và chuyển sang trạng thái <strong>Chờ duyệt</strong>.
                  Bạn không thể chỉnh sửa sau khi gửi.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Quay lại
              </button>
              <button
                onClick={doSubmit}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2"
              >
                <i className="fa-solid fa-paper-plane text-xs" /> Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RBAC guard */}
      {!CAN_CREATE && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center space-y-4">
            <i className="fa-solid fa-lock text-4xl text-slate-300" />
            <h3 className="font-bold text-slate-800">Không có quyền truy cập</h3>
            <p className="text-sm text-slate-500">Bạn không có quyền tạo gói thầu.</p>
            <button
              onClick={() => navigate(-1)}
              className="h-9 px-5 bg-blue-600 text-white text-sm font-semibold rounded-xl"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}
    </>
  );
}
