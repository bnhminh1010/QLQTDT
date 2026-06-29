import { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { taoGoiThauSchema } from "@/util/validate";
import { getRutGonThreshold, isRutGonHinhThuc, validateRutGonGoiThau } from "@/util/goiThauRutGonValidation";
import type { InferType } from "yup";
import { useFileAttachment } from "@/hooks/useFileAttachment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  updateGoiThau,
} from "@/pages/DanhSachGoiThau/goiThauService";
import type { GoiThau, HinhThuc, LoaiGoiThau } from "@/pages/DanhSachGoiThau/goiThauService";
import { getWorkflowTemplates, getWorkflows, getParallelGroups } from "@/services/workflowApi";
import type { WorkflowTemplateSummary, WorkflowItem, ParallelGroupDto, BuocWorkflowDto } from "@/services/workflowApi";
import { getCurrentUserApi } from "@/services/api";
import type { LoginUserDto } from "@/services/api";
import { getKhoaPhongs } from "@/services/adminApi";
import type { KhoaPhong } from "@/services/adminApi";

/* ─ Auth ─ */
const CAN_CREATE = true;

function formatDisplayNumber(value?: string | number): string {
  if (!value) return "";
  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("vi-VN");
}

const HT_BADGE: Partial<Record<HinhThuc, string>> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
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

function normalizeLoaiHinh(value?: string) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

type FormData = InferType<typeof taoGoiThauSchema>;

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

export default function TaoGoiThau() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id") ?? "";
  const isEditMode = searchParams.get("mode") === "edit" && !!editId;
  const locationState = location.state as LocationState | null;
  const [editingGoiThau] = useState<GoiThau | undefined>(
    isEditMode ? locationState?.goiThau : undefined
  );
  const canEditCurrent =
    !!editingGoiThau && EDITABLE_STATUSES.includes(editingGoiThau.trangThai);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [quyTrinhList, setQuyTrinhList] = useState<WorkflowTemplateSummary[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [selectedQTSteps, setSelectedQTSteps] = useState<BuocWorkflowDto[]>([]);
  const [selectedParallelGroups, setSelectedParallelGroups] = useState<ParallelGroupDto[]>([]);
  const [theoDoiOpen, setTheoDoiOpen] = useState(false);
  const [theoDoiList, setTheoDoiList] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<LoginUserDto | null>(null);
  const [khoaPhongList, setKhoaPhongList] = useState<KhoaPhong[]>([]);
  const { attachments, getRootProps, getInputProps, isDragActive, removeFile } =
    useFileAttachment();

  // Load current user + workflow templates + admin workflows on mount
  useEffect(() => {
    getCurrentUserApi().then(setCurrentUser).catch(() => {});
    getKhoaPhongs().then(setKhoaPhongList).catch(() => {});
    Promise.all([
      getWorkflowTemplates().catch(() => [] as WorkflowTemplateSummary[]),
      getWorkflows().catch(() => [] as WorkflowItem[]),
    ]).then(([templates, workflows]) => {
      const seen = new Set<number>();
      const merged: WorkflowTemplateSummary[] = [];
      for (const t of templates) { if (!seen.has(t.id)) { seen.add(t.id); merged.push(t); } }
      for (const w of workflows) { if (!seen.has(w.id)) { seen.add(w.id); merged.push({ id: w.id, maWorkflow: w.maWorkflow, tenWorkflow: w.tenWorkflow, loaiHinhDauThau: w.loaiHinhDauThau, soBuoc: w.soBuoc }); } }
      setQuyTrinhList(merged);
    });
  }, []);

  const userKhoaPhong =
    currentUser?.roles?.find((r) => r.laChinh && r.tenKhoaPhong)?.tenKhoaPhong ||
    currentUser?.roles?.find((r) => r.tenKhoaPhong)?.tenKhoaPhong ||
    "";
  const donViDeXuat = editingGoiThau?.donVi || userKhoaPhong;
  const canChooseDonViDeXuat = !isEditMode && !userKhoaPhong;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(taoGoiThauSchema),
    defaultValues: { donVi: "", ghiChu: "", canCuApDungRutGon: "", loaiGoiThau: "", hinhThuc: "", ngayTao: new Date().toISOString().slice(0, 10) },
  });

  const watched = watch();

  useEffect(() => {
    if (isEditMode || !donViDeXuat || watched.donVi) return;
    setValue("donVi", donViDeXuat, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [donViDeXuat, isEditMode, setValue, watched.donVi]);

  function normalizeGiaTriField() {
    // Chỉ loại bỏ ký tự không phải số, ko format
    const raw = watch("giaTriStr");
    const digits = String(raw ?? "").replace(/[^\d]/g, "");
    setValue("giaTriStr", digits, {
      shouldDirty: true,
      shouldValidate: Boolean(digits),
    });
  }
  const giaTriNum = Number((watched.giaTriStr ?? "").replace(/[^\d]/g, "")) || 0;
  const isRutGon = isRutGonHinhThuc(watched.hinhThuc);
  const hanMucHienTai = isRutGon ? getRutGonThreshold(watched.loaiGoiThau) : null;
  const overBudget = hanMucHienTai !== null && giaTriNum > hanMucHienTai;

  const selectedLoaiGoiThau = watched.loaiGoiThau as LoaiGoiThau | "";
  const filteredQuyTrinhOptions = selectedLoaiGoiThau
    ? quyTrinhList.filter((qt) => {
        const loaiHinh = normalizeLoaiHinh(qt.loaiHinhDauThau);
        return QUY_TRINH_BY_LOAI[selectedLoaiGoiThau].some(
          (option) => normalizeLoaiHinh(option) === loaiHinh,
        );
      })
    : [];
  const hasPreview = !!(watched.ten?.trim() || watched.loaiGoiThau || watched.hinhThuc);
  const ghiChuLen = watched.ghiChu?.length ?? 0;
  const normalizedDonViDeXuat = normalizeTheoDoi(watched.donVi || "");

  const selectedQT = selectedWorkflowId
    ? quyTrinhList.find((qt) => qt.id === selectedWorkflowId) ?? null
    : watched.hinhThuc
      ? quyTrinhList.find(
          (qt) => normalizeLoaiHinh(qt.loaiHinhDauThau) === normalizeLoaiHinh(watched.hinhThuc),
        ) ?? null
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
    const tongSoBuoc = selectedQT.soBuoc;
    const slaDuKien = selectedQTSteps.reduce((sum, s) => sum + (Number(s.soNgayLapHoSo) || 0), 0);
    const soBuocCanDuyet = 0;
    return {
      tenQuyTrinh: selectedQT.tenWorkflow,
      tongSoBuoc,
      slaDuKien,
      soBuocCanDuyet,
    };
  }, [selectedQT, selectedQTSteps]);

  // Load steps + parallel groups when selectedQT changes
  const loadQTS = useCallback(async (wfId: number) => {
    try {
      const { getWorkflowDesignSteps } = await import('@/services/workflowApi');
      const [steps, groups] = await Promise.all([
        getWorkflowDesignSteps(wfId),
        getParallelGroups(wfId).catch(() => [] as ParallelGroupDto[]),
      ]);
      setSelectedQTSteps(steps);
      setSelectedParallelGroups(groups);
    } catch { setSelectedQTSteps([]); setSelectedParallelGroups([]); }
  }, []);
  useEffect(() => {
    if (selectedQT?.id) loadQTS(selectedQT.id);
    else { setSelectedQTSteps([]); setSelectedParallelGroups([]); }
  }, [selectedQT?.id, loadQTS]);

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
      giaTriStr: formatDisplayNumber(editingGoiThau.giaTriStr || editingGoiThau.giaTriNum),
      donVi: editingGoiThau.donVi || donViDeXuat,
      ngayTao: toDateInputValue(editingGoiThau.detail.ngayTao),
      ghiChu: editingGoiThau.ghiChu ?? "",
      canCuApDungRutGon: editingGoiThau.canCuApDungRutGon ?? "",
    });
    setTheoDoiList(editingGoiThau.theoDoi ?? []);
  }, [canEditCurrent, editingGoiThau, isEditMode, navigate, reset]);

  function buildGoiThauFromForm(data: FormData, trangThai: GoiThau["trangThai"]) {
    const digits = String(data.giaTriStr ?? "").replace(/[^\d]/g, "");
    const num = parseInt(digits, 10) || 0;
    return {
      id: editingGoiThau?.id ?? generateGoiThauId(),
      ten: data.ten.trim(),
      ghiChu: data.ghiChu?.trim() || "",
      canCuApDungRutGon: data.canCuApDungRutGon?.trim() || "",
      loaiGoiThau: data.loaiGoiThau as LoaiGoiThau,
      hinhThuc: data.hinhThuc as HinhThuc,
      theoDoi: theoDoiList,
      workflowId: selectedQT?.id,
      giaTriStr: digits,
      giaTriNum: num,
      donVi: data.donVi,
      trangThai,
      detail: {
        nguonVon: data.nguonVon,
        ngayTao: data.ngayTao,
        hanHT: editingGoiThau?.detail.hanHT ?? "—",
        pct: editingGoiThau?.detail.pct ?? "0%",
        buoc: editingGoiThau?.detail.buoc ?? (selectedQT ? `0/${selectedQT.soBuoc}` : "1/14"),
      },
    };
  }

  function validateRutGonOrToast(data: FormData) {
    const result = validateRutGonGoiThau({
      hinhThuc: data.hinhThuc,
      loaiGoiThau: data.loaiGoiThau,
      giaTriStr: data.giaTriStr,
      canCuApDungRutGon: data.canCuApDungRutGon,
    });
    if (!result.valid) {
      toast.error(result.message);
      return false;
    }
    return true;
  }

  /* ─ Gửi đề xuất ─ */
  function onSubmit(data: FormData) {
    if (!validateRutGonOrToast(data)) return;
    setPendingSubmitData(data);
    setConfirmOpen(true);
  }

  function getApiErrorMessage(error: unknown, fallback: string) {
    const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return err.response?.data?.error || err.response?.data?.message || err.message || fallback;
  }

  async function doSubmit() {
    if (!pendingSubmitData) return;
    const data = pendingSubmitData;
    const item = buildGoiThauFromForm(data, "Chờ duyệt");
    setSavingChanges(true);
    try {
      if (isEditMode) {
        await updateGoiThau(item);
        toast.success("Gói thầu đã được cập nhật và gửi đề xuất");
      } else {
        await addGoiThau(item);
        toast.success("Gói thầu đã được gửi đề xuất và đang chờ duyệt");
      }
      setConfirmOpen(false);
      navigate("/danh-sach-goi-thau");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi đề xuất gói thầu"));
    } finally {
      setSavingChanges(false);
    }
  }

  async function saveChanges(values: FormData) {
    if (!editingGoiThau) return;
    if (!validateRutGonOrToast(values)) return;
    setSavingChanges(true);
    try {
      await updateGoiThau(buildGoiThauFromForm(values, editingGoiThau.trangThai));
      toast.success("Đã lưu thay đổi gói thầu");
      navigate("/danh-sach-goi-thau");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu thay đổi gói thầu"));
    } finally {
      setSavingChanges(false);
    }
  }

  /* ─ Lưu nháp ─ */
  async function saveDraft() {
    const values = watch();
    if (!values.ten?.trim()) {
      toast.error("Vui lòng nhập tên gói thầu trước khi lưu nháp");
      return;
    }
    if (!values.loaiGoiThau) {
      toast.error("Vui lòng chọn loại gói thầu trước khi lưu nháp");
      return;
    }
    if (!values.hinhThuc) {
      toast.error("Vui lòng chọn quy trình đấu thầu trước khi lưu nháp");
      return;
    }
    if (!validateRutGonOrToast(values)) return;

    setSavingDraft(true);
    try {
      const item = buildGoiThauFromForm(values, "Nháp");
      await addGoiThau(item);
      toast.success("Gói thầu đã được lưu nháp thành công");
      navigate("/danh-sach-goi-thau");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể lưu nháp gói thầu"));
    } finally {
      setSavingDraft(false);
    }
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
                <Select
                  value={watched.loaiGoiThau || ""}
                  onValueChange={(value) =>
                    setValue("loaiGoiThau", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    className={
                      errors.loaiGoiThau
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                        : ""
                    }
                  >
                    <SelectValue placeholder="-- Chọn loại gói thầu --" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAI_GOI_THAU_OPTIONS.map((loai) => (
                      <SelectItem key={loai} value={loai}>
                        {loai}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <Select
                    value={selectedWorkflowId ? String(selectedWorkflowId) : ""}
                    disabled={!selectedLoaiGoiThau}
                    onValueChange={(value) => {
                      const workflowId = Number(value);
                      const workflow = quyTrinhList.find((qt) => qt.id === workflowId);
                      setSelectedWorkflowId(Number.isFinite(workflowId) ? workflowId : null);
                      setValue("hinhThuc", (workflow?.loaiHinhDauThau || "") as HinhThuc, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger
                      className={`${
                        errors.hinhThuc
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      } ${!selectedLoaiGoiThau ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <SelectValue
                        placeholder={
                          selectedLoaiGoiThau
                            ? "-- Chọn quy trình đấu thầu --"
                            : "Vui lòng chọn loại gói thầu trước"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredQuyTrinhOptions.map((option) => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          <span className="font-medium">{option.tenWorkflow}</span>
                          {option.loaiHinhDauThau && (
                            <span className="ml-2 text-xs text-slate-400">{option.loaiHinhDauThau}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={watched.nguonVon || ""}
                    onValueChange={(value) =>
                      setValue("nguonVon", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger
                      className={
                        errors.nguonVon
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          : ""
                      }
                    >
                      <SelectValue placeholder="-- Chọn nguồn vốn --" />
                    </SelectTrigger>
                    <SelectContent>
                      {NGUON_VON.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          {selectedQT.tenWorkflow}
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">
                          Quy trình đấu thầu đã chọn
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                        {selectedQT.soBuoc} bước
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
                    <div className="mt-3 space-y-2">
                      {(() => {
                        const _splitIds = new Set(selectedParallelGroups.map(g => g.buocTachNhanhId));
                        const _mergeIds = new Set(selectedParallelGroups.map(g => g.buocSauHopNhatId));
                        const _els: React.ReactNode[] = [];
                        let _cnt = 0;
                        const _mainSteps = selectedQTSteps.filter((s) => !s.nhanhWorkflowId);
                        for (const _step of _mainSteps) {
                          const _isSplit = _splitIds.has(_step.id);
                          const _isMerge = _mergeIds.has(_step.id);
                          const _grp = _isSplit ? selectedParallelGroups.find(g => g.buocTachNhanhId === _step.id) : null;
                          const _border = _isMerge ? "border-purple-200" : "border-blue-100";
                          const _bg = _isMerge ? "bg-purple-50" : "bg-white";
                          const _numBg = _isMerge ? "bg-purple-200 text-purple-800" : "bg-blue-100 text-blue-700";
                          _els.push(
                            <div key={_step.id} className={`flex items-start gap-2 rounded-lg ${_bg} border ${_border} px-3 py-2`}>
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${_numBg}`}>{++_cnt}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-800">{_step.tenBuoc}</p>
                                <p className="text-[11px] text-slate-400">Thời hạn {_step.soNgayLapHoSo} ngày</p>
                              </div>
                            </div>
                          );
                          if (_isSplit && _grp && _grp.branches.length > 0) {
                            const _mergeStepName = selectedQTSteps.find(s => s.id === _grp.buocSauHopNhatId)?.tenBuoc ?? _grp.dieuKienHopNhat;
                            _els.push(
                              <div key={`branch-${_grp.id}`} className="ml-5 border-l-2 border-amber-300 pl-3 space-y-1">
                                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-1"><i className="fa-solid fa-code-branch text-[10px]" />Nhánh song song</p>
                                {_grp.branches.map((_b, _bi) => {
                                  const _branchSteps = selectedQTSteps
                                    .filter(s => s.nhanhWorkflowId === _b.id)
                                    .sort((a, b) => a.thuTu - b.thuTu);
                                  const _stepNames = _branchSteps.map(s => s.tenBuoc).join(' → ');
                                  return (
                                    <p key={_b.id} className="text-[10px] text-slate-600 font-mono leading-relaxed">
                                      {_bi === 0 ? '┌ ' : _bi === _grp.branches.length - 1 ? '└ ' : '├ '}
                                      <span className="font-semibold text-slate-700">{_b.tenNhanh}:</span>{' '}
                                      <span className="text-slate-500">{_stepNames || '—'}</span>
                                    </p>
                                  );
                                })}
                                <p className="text-[10px] text-purple-600 font-medium">⟶ Hợp nhất: {_mergeStepName}</p>
                              </div>
                            );
                          }
                        }
                        return _els;
                      })()}
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
                      placeholder="VD: 320.000.000"
                      {...register("giaTriStr")}
                      onBlur={normalizeGiaTriField}
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
                  {overBudget && hanMucHienTai && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <i className="fa-solid fa-triangle-exclamation text-[10px]" />
                      Giá trị vượt quá hạn mức {hanMucHienTai.toLocaleString("vi-VN")} VND cho phép của hình thức đấu thầu này
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Đơn vị đề xuất <span className="text-red-500">*</span>
                  </label>
                  {canChooseDonViDeXuat ? (
                    <Select
                      value={watched.donVi || ""}
                      onValueChange={(value) =>
                        setValue("donVi", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.donVi
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            : ""
                        }
                      >
                        <SelectValue placeholder="-- Chọn khoa/phòng đề xuất --" />
                      </SelectTrigger>
                      <SelectContent>
                        {khoaPhongList.map((khoaPhong) => (
                          <SelectItem key={khoaPhong.id} value={khoaPhong.tenKhoaPhong}>
                            {khoaPhong.tenKhoaPhong}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      {...register("donVi")}
                      className={`${cls("donVi")} cursor-not-allowed text-slate-700`}
                    />
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    {canChooseDonViDeXuat
                      ? "Tài khoản chưa gắn khoa/phòng, vui lòng chọn đơn vị đề xuất."
                      : "Tự động lấy từ tài khoản đăng nhập"}
                  </p>
                  {errors.donVi && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.donVi.message}
                    </p>
                  )}
                </div>
              </div>

              {isRutGon && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <label className={labelCls}>
                    Căn cứ áp dụng rút gọn <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: Gói thầu thuộc hạn mức áp dụng quy trình rút gọn theo SRS/quy định nội bộ..."
                    {...register("canCuApDungRutGon")}
                    className={`${errors.canCuApDungRutGon ? inputErrCls : inputCls} resize-none bg-white`}
                  />
                  {errors.canCuApDungRutGon ? (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.canCuApDungRutGon.message}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700 mt-1">
                      {hanMucHienTai
                        ? `Ngưỡng tối đa theo loại gói thầu: ${hanMucHienTai.toLocaleString("vi-VN")} VND.`
                        : "Vui lòng chọn loại gói thầu để xác định hạn mức rút gọn."}
                    </p>
                  )}
                </div>
              )}

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
                  ...(isRutGon
                    ? [["Căn cứ rút gọn", watched.canCuApDungRutGon || "—"] as [string, string]]
                    : []),
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
                  <div className="space-y-2">
                    {(() => {
                      const _splitIds = new Set(selectedParallelGroups.map(g => g.buocTachNhanhId));
                      const _tags: React.ReactNode[] = [];
                      let _cnt = 0;
                      const _mainSteps = selectedQTSteps.filter((s) => !s.nhanhWorkflowId);
                      for (const _step of _mainSteps) {
                        const _isSplit = _splitIds.has(_step.id);
                        const _grp = _isSplit ? selectedParallelGroups.find(g => g.buocTachNhanhId === _step.id) : null;
                        _tags.push(
                          <span key={_step.id} className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-white text-blue-600 border border-blue-200 mr-1">
                            {++_cnt}. {_step.tenBuoc.length > 12 ? _step.tenBuoc.slice(0, 12) + "…" : _step.tenBuoc}
                          </span>
                        );
                        if (_isSplit && _grp && _grp.branches.length > 0) {
                          const _mergeName = selectedQTSteps.find(s => s.id === _grp.buocSauHopNhatId)?.tenBuoc ?? _grp.dieuKienHopNhat;
                          _tags.push(
                            <div key={`branch-${_grp.id}`} className="ml-3 border-l-2 border-amber-200 pl-2 my-1">
                              <p className="text-[10px] font-bold text-amber-600 mb-0.5"><i className="fa-solid fa-code-branch text-[10px] mr-0.5" />Nhánh song song</p>
                              {_grp.branches.map((_b, _bi) => {
                                const _branchSteps = selectedQTSteps
                                  .filter(s => s.nhanhWorkflowId === _b.id)
                                  .sort((a, b) => a.thuTu - b.thuTu);
                                const _stepNames = _branchSteps.map(s => s.tenBuoc).join(' → ');
                                return (
                                  <p key={_b.id} className="text-[9px] text-slate-500 font-mono leading-relaxed">
                                    {_bi === 0 ? '┌ ' : _bi === _grp.branches.length - 1 ? '└ ' : '├ '}
                                    <span className="font-semibold text-slate-600">{_b.tenNhanh}:</span>{' '}
                                    <span className="text-slate-400">{_stepNames || '—'}</span>
                                  </p>
                                );
                              })}
                              <p className="text-[9px] text-purple-600">⟶ Hợp nhất: {_mergeName}</p>
                            </div>
                          );
                        }
                      }
                      return _tags;
                    })()}
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
