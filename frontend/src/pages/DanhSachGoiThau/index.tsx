import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserGoiThauList } from "./goiThauService";
import type { GoiThau, HinhThuc, TrangThai } from "./goiThauService";
import {
  getCurrentStepName,
  getXuLyBuoc,
  getXuLyBuocByStep,
  getXuLyBuocHistory,
  type XuLyBuocRecord,
} from "./xuLyBuocService";

/* ─── Types ───────────────────────────────────────────── */
type DotState = "done" | "warn" | "idle";

type LichSuGoiThau = {
  id: string;
  goiThauId: string;
  thoiGian: string;
  nguoiThucHien: string;
  noiDung: string;
};

type QuyTrinhStepDetail = {
  state: DotState;
  ten: string;
  donVi: string;
  current?: boolean;
  nguoiXuLy?: string;
  slaText?: string;
};

type GoiThauDetailInfo = {
  buocHienTai: string;
  nguoiXuLy: string;
  donViXuLy: string;
  sla: string;
  lyDoTreHan?: string;
  steps: QuyTrinhStepDetail[];
};

/* ─── Badge / color maps ──────────────────────────────── */
const BADGE: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Đã hủy": "bg-slate-100 text-slate-500",
  "Nháp": "bg-purple-100 text-purple-600",
};
const HT_BADGE: Partial<Record<HinhThuc, string>> = {
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
const BAR_COLOR: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-500",
  "Hoàn thành": "bg-emerald-500",
  "Trễ hạn": "bg-red-500",
  "Chờ duyệt": "bg-amber-500",
  "Đã hủy": "bg-slate-400",
  "Nháp": "bg-purple-400",
};
const DOT_CLS: Record<DotState, string> = {
  done: "bg-emerald-500 text-white",
  warn: "bg-amber-500 text-white",
  idle: "bg-slate-200",
};

/* ─── Mock data ───────────────────────────────────────── */
const INITIAL_DATA: GoiThau[] = [
  {
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
  {
    id: "GT2025-002",
    ten: "Sửa chữa hệ thống điện tầng 3",
    hinhThuc: "Chỉ định thầu tự quyết định",
    giaTriStr: "38,000,000",
    giaTriNum: 38000000,
    donVi: "P.HCQT",
    trangThai: "Hoàn thành",
    detail: {
      nguonVon: "Tự chủ tài chính",
      ngayTao: "15/01/2025",
      hanHT: "28/02/2025",
      pct: "100%",
      buoc: "7/7",
    },
  },
  {
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
      pct: "21%",
      buoc: "3/14",
    },
  },
  {
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
  {
    id: "GT2025-005",
    ten: "Mua sắm vật tư tiêu hao khoa Ngoại",
    hinhThuc: "Chỉ định thầu thông thường",
    giaTriStr: "560,000,000",
    giaTriNum: 560000000,
    donVi: "Khoa Ngoại",
    trangThai: "Đang xử lý",
    detail: {
      nguonVon: "Ngân sách BV",
      ngayTao: "01/04/2025",
      hanHT: "31/07/2025",
      pct: "15%",
      buoc: "2/14",
    },
  },
  {
    id: "GT2025-006",
    ten: "Dịch vụ bảo trì thiết bị xét nghiệm",
    hinhThuc: "Chỉ định thầu rút gọn",
    giaTriStr: "75,000,000",
    giaTriNum: 75000000,
    donVi: "Khoa Xét nghiệm",
    trangThai: "Chờ duyệt",
    detail: {
      nguonVon: "Tự chủ tài chính",
      ngayTao: "10/04/2025",
      hanHT: "10/05/2025",
      pct: "0%",
      buoc: "1/9",
    },
  },
];

const HISTORY_LOGS: LichSuGoiThau[] = [
  {
    id: "LS-001-1",
    goiThauId: "GT2025-001",
    thoiGian: "10/01/2025 08:30",
    nguoiThucHien: "Nguyễn Văn A",
    noiDung: "Tạo gói thầu",
  },
  {
    id: "LS-001-2",
    goiThauId: "GT2025-001",
    thoiGian: "12/01/2025 09:15",
    nguoiThucHien: "Trần Văn B",
    noiDung: "Phê duyệt chủ trương",
  },
  {
    id: "LS-001-3",
    goiThauId: "GT2025-001",
    thoiGian: "14/01/2025 16:00",
    nguoiThucHien: "Hệ thống",
    noiDung: 'Chuyển sang bước "Đăng tải yêu cầu báo giá"',
  },
  {
    id: "LS-003-1",
    goiThauId: "GT2025-003",
    thoiGian: "05/03/2025 08:30",
    nguoiThucHien: "Nguyễn Văn A",
    noiDung: "Tạo gói thầu",
  },
  {
    id: "LS-003-2",
    goiThauId: "GT2025-003",
    thoiGian: "07/03/2025 09:15",
    nguoiThucHien: "Trần Văn B",
    noiDung: "Phê duyệt chủ trương",
  },
  {
    id: "LS-003-3",
    goiThauId: "GT2025-003",
    thoiGian: "10/03/2025 16:00",
    nguoiThucHien: "Hệ thống",
    noiDung: 'Chuyển sang bước "Đăng tải yêu cầu báo giá"',
  },
  {
    id: "LS-003-4",
    goiThauId: "GT2025-003",
    thoiGian: "29/03/2025 17:30",
    nguoiThucHien: "Hệ thống",
    noiDung: 'Đánh dấu trễ hạn tại bước "Biên bản kiểm tra báo giá"',
  },
];

const STEPS_TEMPLATE = [
  ["done", "1. Đề xuất mua sắm", "K/p mua sắm"],
  ["done", "2. Tờ trình chủ trương", "K/p mua sắm"],
  ["done", "3. Đăng tải yêu cầu báo giá", "K/p mua sắm"],
  ["warn", "4. Biên bản kiểm tra báo giá", "Tổ kiểm tra giá"],
  ["idle", "5. Tờ trình phê duyệt dự toán", "K/p mua sắm"],
  ["idle", "6. QĐ phê duyệt dự toán", "Giám đốc BV"],
  ["idle", "7. Tờ trình kế hoạch LCNT", "K/p mua sắm"],
  ["idle", "8. QĐ kế hoạch LCNT", "Giám đốc BV"],
  ["idle", "9. Đăng tải kế hoạch LCNT", "K/p mua sắm"],
];

const DEFAULT_DETAIL_INFO: GoiThauDetailInfo = {
  buocHienTai: "Tờ trình phê duyệt dự toán",
  nguoiXuLy: "K/p mua sắm",
  donViXuLy: "K/p mua sắm",
  sla: "Đang theo dõi",
  steps: STEPS_TEMPLATE.map(([state, ten, donVi]) => ({
    state: state as DotState,
    ten: ten.replace(/^\d+\.\s*/, ""),
    donVi,
  })),
};

const DETAIL_INFO_BY_ID: Record<string, GoiThauDetailInfo> = {
  "GT2025-003": {
    buocHienTai: "Biên bản kiểm tra báo giá",
    nguoiXuLy: "Nguyễn Văn A",
    donViXuLy: "Tổ kiểm tra giá",
    sla: "Quá hạn 21 ngày",
    lyDoTreHan: "Tổ kiểm tra giá chưa hoàn tất biên bản đánh giá báo giá",
    steps: [
      { state: "done", ten: "Đề xuất mua sắm", donVi: "K/p mua sắm" },
      { state: "done", ten: "Tờ trình chủ trương", donVi: "K/p mua sắm" },
      { state: "done", ten: "Đăng tải yêu cầu báo giá", donVi: "K/p mua sắm" },
      {
        state: "warn",
        ten: "Biên bản kiểm tra báo giá",
        donVi: "Tổ kiểm tra giá",
        current: true,
        nguoiXuLy: "Nguyễn Văn A",
        slaText: "Quá hạn 21 ngày",
      },
      { state: "idle", ten: "Tờ trình phê duyệt dự toán", donVi: "K/p mua sắm" },
      { state: "idle", ten: "QĐ phê duyệt dự toán", donVi: "Giám đốc BV" },
      { state: "idle", ten: "Tờ trình kế hoạch LCNT", donVi: "K/p mua sắm" },
      { state: "idle", ten: "QĐ kế hoạch LCNT", donVi: "Giám đốc BV" },
      { state: "idle", ten: "Đăng tải kế hoạch LCNT", donVi: "K/p mua sắm" },
    ],
  },
};

function formatCurrencyDisplay(value: string) {
  return value.replace(/,/g, ".") + " đ";
}

const PAGE_SIZE = 8;
type SortCol = "id" | "ten" | "giaTriNum" | "trangThai";

const EDITABLE_STATUSES: TrangThai[] = ["Nháp"];
const STEP_UPDATE_STATUSES: TrangThai[] = ["Đang xử lý", "Chờ duyệt", "Trễ hạn"];
const canEditGoiThau = (item: GoiThau) =>
  EDITABLE_STATUSES.includes(item.trangThai);
const canUpdateCurrentStep = (item: GoiThau) =>
  STEP_UPDATE_STATUSES.includes(item.trangThai);

function getMergedGoiThauList() {
  const userList = getUserGoiThauList();
  const userIds = new Set(userList.map((item) => item.id));
  return [...userList, ...INITIAL_DATA.filter((item) => !userIds.has(item.id))];
}

/* ─── Sub-components ──────────────────────────────────── */
function Dot({ state }: { state: DotState }) {
  return (
    <div
      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${DOT_CLS[state]}`}
    >
      {state === "done" && <i className="fa-solid fa-check" />}
      {state === "warn" && <i className="fa-solid fa-triangle-exclamation" />}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active)
    return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
  return dir === "asc" ? (
    <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
  ) : (
    <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />
  );
}

type ConfirmProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
};
function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  danger = false,
}: ConfirmProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${danger ? "bg-red-100" : "bg-amber-100"}`}
          >
            <i
              className={`fa-solid fa-triangle-exclamation ${danger ? "text-red-500" : "text-amber-500"}`}
            />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`h-9 px-5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type HistoryModalProps = {
  goiThau: GoiThau;
  entries: LichSuGoiThau[];
  processEntries: XuLyBuocRecord[];
  onClose: () => void;
};

function HistoryModal({ goiThau, entries, processEntries, onClose }: HistoryModalProps) {
  const hasEntries = entries.length > 0 || processEntries.length > 0;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono font-bold text-blue-700">
              {goiThau.id}
            </p>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Lịch sử gói thầu
            </h3>
            <p className="text-xs text-slate-500 mt-1">{goiThau.ten}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {!hasEntries ? (
            <div className="py-10 text-center">
              <i className="fa-solid fa-clock-rotate-left text-3xl text-slate-200" />
              <p className="text-sm text-slate-400 mt-3">
                Chưa có lịch sử thao tác cho gói thầu này.
              </p>
            </div>
          ) : (
            <div className="relative space-y-5 before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-px before:bg-slate-200">
              {processEntries.map((entry) => (
                <div key={`${entry.goiThauId}-${entry.thoiGianXuLy}`} className="relative flex gap-4">
                  <div className="relative z-10 mt-1 h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-check text-[10px]" />
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {entry.thoiGianXuLy ?? "—"}
                    </p>
                    <div className="mt-2 grid gap-1 text-sm text-slate-600">
                      <p><span className="text-slate-400">Người xử lý:</span> {entry.nguoiXuLy || "—"}</p>
                      <p><span className="text-slate-400">Bước workflow:</span> {entry.buocWorkflow}</p>
                      <p><span className="text-slate-400">Người ký duyệt:</span> {entry.nguoiKyDuyet || "—"}</p>
                      <p><span className="text-slate-400">Ngày ký duyệt:</span> {entry.ngayKyDuyet || "—"}</p>
                      <p><span className="text-slate-400">Kết quả xử lý:</span> {entry.ketQua}</p>
                      {entry.lyDoKhongDuyet && (
                        <p><span className="text-slate-400">Lý do không duyệt:</span> {entry.lyDoKhongDuyet}</p>
                      )}
                      <p><span className="text-slate-400">Hệ thống:</span> {entry.thaoTacHeThong || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {entries.map((entry) => (
                <div key={entry.id} className="relative flex gap-4">
                  <div className="relative z-10 mt-1 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i className="fa-solid fa-clock text-[10px]" />
                  </div>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {entry.thoiGian}
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                      {entry.nguoiThucHien}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {entry.noiDung}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function DanhSachGoiThau() {
  const navigate = useNavigate();
  const [data, setData] = useState<GoiThau[]>(() => getMergedGoiThauList());
  const [selected, setSelected] = useState<GoiThau>(() => {
    const list = getMergedGoiThauList();
    return list.find((item) => item.id === "GT2025-003") ?? list[0];
  });
  const [search, setSearch] = useState("");
  const [filterHT, setFilterHT] = useState("");
  const [filterTT, setFilterTT] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);

  // Loading / error mock
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Confirm modals
  const [cancelTarget, setCancelTarget] = useState<GoiThau | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoiThau | null>(null);
  const [historyTarget, setHistoryTarget] = useState<GoiThau | null>(null);

  const simulateLoad = useCallback(() => {
    setLoading(true);
    setError(false);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return simulateLoad();
  }, [simulateLoad]);
  useEffect(() => {
    setPage(1);
  }, [search, filterHT, filterTT, sortCol, sortDir]);

  /* ─ Derived list ─ */
  const filtered = useMemo(() => {
    let list = data.filter(
      (r) =>
        (r.ten.toLowerCase().includes(search.toLowerCase()) ||
          r.id.toLowerCase().includes(search.toLowerCase())) &&
        (filterHT === "" || r.hinhThuc === filterHT) &&
        (filterTT === "" || r.trangThai === filterTT),
    );
    if (sortCol) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortCol === "giaTriNum") cmp = a.giaTriNum - b.giaTriNum;
        else cmp = String(a[sortCol]).localeCompare(String(b[sortCol]), "vi");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [data, search, filterHT, filterTT, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function handleCancel() {
    if (!cancelTarget) return;
    setData((prev) =>
      prev.map((r) =>
        r.id === cancelTarget.id ? { ...r, trangThai: "Đã hủy" } : r,
      ),
    );
    if (selected.id === cancelTarget.id)
      setSelected({ ...selected, trangThai: "Đã hủy" });
    toast.success(`Đã hủy gói thầu "${cancelTarget.ten}"`);
    setCancelTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const remaining = data.filter((r) => r.id !== deleteTarget.id);
    setData(remaining);
    if (selected.id === deleteTarget.id && remaining.length > 0)
      setSelected(remaining[0]);
    toast.success(`Đã xóa "${deleteTarget.ten}"`);
    setDeleteTarget(null);
  }

  function goToEdit(item: GoiThau) {
    if (!canEditGoiThau(item)) {
      toast.error("Chỉ được chỉnh sửa gói thầu ở trạng thái Nháp");
      return;
    }
    navigate(`/tao-goi-thau?mode=edit&id=${encodeURIComponent(item.id)}`, {
      state: { goiThau: item },
    });
  }

  function handlePrimaryAction(item: GoiThau) {
    if (canEditGoiThau(item)) {
      goToEdit(item);
      return;
    }
    if (canUpdateCurrentStep(item)) {
      navigate(`/xu-ly-buoc/${encodeURIComponent(item.id)}`);
      return;
    }
    toast.error("Gói thầu ở trạng thái này không còn thao tác xử lý bước");
  }

  function goToCurrentStep(item: GoiThau) {
    if (!canUpdateCurrentStep(item)) {
      toast.error("Gói thầu ở trạng thái này không còn thao tác xử lý bước");
      return;
    }
    navigate(`/xu-ly-buoc/${encodeURIComponent(item.id)}`);
  }

  function goToStepResult(item: GoiThau, stepName: string) {
    navigate(
      `/xu-ly-buoc/${encodeURIComponent(item.id)}?mode=view&step=${encodeURIComponent(stepName)}`,
    );
  }

  /* ─ Detail panel content ─ */
  function DetailPanel() {
    const detailInfo = DETAIL_INFO_BY_ID[selected.id] ?? DEFAULT_DETAIL_INFO;
    const currentStepName = getCurrentStepName(selected.id, detailInfo.buocHienTai);
    const processingInfo = getXuLyBuoc(selected.id);
    const progressStatus =
      selected.trangThai === "Trễ hạn"
        ? "Quá hạn"
        : selected.trangThai === "Chờ duyệt"
          ? "Sắp quá hạn"
          : "Đúng hạn";
    const displaySteps = detailInfo.steps.map((step) => {
      const stepRecord = getXuLyBuocByStep(selected.id, step.ten);
      const isCurrent = step.ten === currentStepName;
      if (!isCurrent) {
        if (stepRecord?.ketQua === "Duyệt") {
          return {
            ...step,
            state: "done" as DotState,
            current: false,
          };
        }
        return {
          ...step,
          current: false,
        };
      }
      if (stepRecord?.ketQua === "Duyệt") {
        return {
          ...step,
          state: "done" as DotState,
          current: false,
        };
      }
      return {
        ...step,
        state: canUpdateCurrentStep(selected) ? ("warn" as DotState) : step.state,
        current: true,
        nguoiXuLy: processingInfo
          ? processingInfo.nguoiXuLy
          : step.nguoiXuLy || detailInfo.nguoiXuLy,
        slaText: progressStatus,
      };
    });

    return (
      <>
        <div className="font-mono text-xs font-bold text-blue-700 mb-1">
          {selected.id}
        </div>
        <div className="text-sm font-bold text-slate-900 mb-0.5">
          {selected.ten}
        </div>
        <div className="text-xs text-slate-400 mb-3">{selected.donVi}</div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="text-xs border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
            {selected.hinhThuc}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[selected.trangThai]}`}
          >
            {selected.trangThai}
          </span>
        </div>

        {/* Progress */}
        <div className="flex justify-between text-xs text-slate-600 mb-1.5">
          <span>Tiến độ quy trình</span>
          <span>
            {selected.detail.buoc} bước ({selected.detail.pct})
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full ${BAR_COLOR[selected.trangThai]}`}
            style={{ width: selected.detail.pct }}
          />
        </div>

        {/* Meta */}
        <div className="space-y-2 mb-5">
          {(
            [
              ["Bước hiện tại", currentStepName],
              ["Giá trị", formatCurrencyDisplay(selected.giaTriStr)],
              ["Nguồn vốn", selected.detail.nguonVon],
              ["Ngày tạo", selected.detail.ngayTao],
              ["Hạn hoàn thành", selected.detail.hanHT],
              ["Tình trạng tiến độ", progressStatus],
            ] as [string, string][]
          ).map(([lbl, val]) => (
            <div key={lbl} className="flex justify-between text-xs">
              <span className="text-slate-400">{lbl}</span>
              <span
                className={`max-w-[150px] text-right font-semibold ${
                  (lbl === "Hạn hoàn thành" || lbl === "Tình trạng tiến độ") &&
                  selected.trangThai === "Trễ hạn"
                    ? "text-red-500"
                    : "text-slate-800"
                }`}
              >
                {val}
              </span>
            </div>
          ))}
          {detailInfo.lyDoTreHan && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs">
              <p className="font-semibold text-red-600">Lý do trễ hạn</p>
              <p className="mt-1 leading-relaxed text-red-700">
                {detailInfo.lyDoTreHan}
              </p>
            </div>
          )}
        </div>

        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400">
            THÔNG TIN BƯỚC HIỆN TẠI
          </p>
          <div className="space-y-2 text-xs">
            {[
              [
                "Người xử lý",
                processingInfo
                  ? processingInfo.nguoiXuLy || "—"
                  : detailInfo.nguoiXuLy || "—",
              ],
              ["Ngày xử lý", processingInfo?.ngayXuLy || "—"],
              ["Người ký", processingInfo?.nguoiKyDuyet || "—"],
              ["Ngày ký", processingInfo?.ngayKyDuyet || "—"],
              ["Kết quả", processingInfo?.ketQua || "Chờ xử lý"],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex justify-between gap-3">
                <span className="text-slate-400">{lbl}</span>
                <span className="text-right font-semibold text-slate-800">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
          CÁC BƯỚC QUY TRÌNH
        </div>
        <div className="space-y-3 mb-5">
          {displaySteps.map((step) => (
            <div
              key={step.ten}
              role="button"
              tabIndex={0}
              onClick={() => goToStepResult(selected, step.ten)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToStepResult(selected, step.ten);
                }
              }}
              className={`flex items-start gap-2.5 rounded-xl ${
                step.current
                  ? "border border-amber-200 bg-amber-50 p-2 -mx-2 cursor-pointer"
                  : "p-1.5 -mx-1.5 hover:bg-slate-50 cursor-pointer"
              }`}
            >
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
                  {step.current && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToCurrentStep(selected);
                      }}
                      className="shrink-0 rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Cập nhật
                    </button>
                  )}
                </div>
                {step.current && (
                  <div className="mt-1 space-y-0.5 text-[11px]">
                    {step.nguoiXuLy && (
                      <div className="text-slate-600">
                        Người xử lý:{" "}
                        <span className="font-semibold">{step.nguoiXuLy}</span>
                      </div>
                    )}
                    {step.slaText && (
                      <div className="text-slate-600">
                        Tình trạng tiến độ:{" "}
                        <span
                          className={`font-semibold ${
                            step.slaText.includes("Quá hạn")
                              ? "text-red-600"
                              : step.slaText.includes("Sắp")
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {step.slaText}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => goToCurrentStep(selected)}
            disabled={!canUpdateCurrentStep(selected)}
            title={
              canUpdateCurrentStep(selected)
                ? "Xử lý bước hiện tại"
                : "Không còn thao tác xử lý"
            }
            className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl py-2.5 transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
          >
            <i className="fa-solid fa-clipboard-list text-xs" />
            Xử lý bước hiện tại
          </button>
          <button
            onClick={() => setHistoryTarget(selected)}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors"
          >
            <i className="fa-solid fa-clock-rotate-left text-xs" /> Lịch sử xử lý
          </button>
          {selected.trangThai !== "Đã hủy" &&
            selected.trangThai !== "Hoàn thành" && (
              <button
                onClick={() => setCancelTarget(selected)}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl py-2.5 transition-colors"
              >
                <i className="fa-solid fa-ban text-xs" /> Hủy gói thầu
              </button>
            )}
          <button
            onClick={() => setDeleteTarget(selected)}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl py-2.5 transition-colors"
          >
            <i className="fa-solid fa-trash text-xs" /> Xóa gói thầu
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh sách gói thầu
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => simulateLoad()}
            title="Tải lại"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i
              className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}
            />
          </button>
          {/* Mobile: toggle detail panel */}
          <button
            onClick={() => setDetailOpen((o) => !o)}
            title="Chi tiết gói thầu"
            className="2xl:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-sidebar-flip" />
          </button>
          <button
            onClick={() => navigate("/tao-goi-thau")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus text-xs" /> Tạo gói thầu
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 min-h-0 h-[calc(100vh-3.5rem)] overflow-hidden relative">
        <main className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-6 space-y-4">
          {/* FILTER BAR */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã gói thầu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              )}
            </div>
            <select
              value={filterHT}
              onChange={(e) => setFilterHT(e.target.value)}
              className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả hình thức</option>
              <option>Chỉ định thầu rút gọn</option>
              <option>Chỉ định thầu tự quyết định</option>
              <option>Chỉ định thầu thông thường</option>
              <option>Chào hàng cạnh tranh</option>
              <option>Đấu thầu rộng rãi</option>
            </select>
            <select
              value={filterTT}
              onChange={(e) => setFilterTT(e.target.value)}
              className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option>Đang xử lý</option>
              <option>Hoàn thành</option>
              <option>Trễ hạn</option>
              <option>Chờ duyệt</option>
              <option>Đã hủy</option>
              <option>Nháp</option>
            </select>
          </div>

          {/* TABLE CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
                <p className="text-sm">Đang tải dữ liệu...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400" />
                <p className="text-sm text-slate-600">
                  Không thể tải dữ liệu. Vui lòng thử lại.
                </p>
                <button
                  onClick={() => simulateLoad()}
                  className="mt-1 h-8 px-4 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-rotate-right" /> Thử lại
                </button>
              </div>
            )}

            {/* Table */}
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
                        onClick={() => toggleSort("id")}
                      >
                        Mã gói{" "}
                        <SortIcon active={sortCol === "id"} dir={sortDir} />
                      </th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                        onClick={() => toggleSort("ten")}
                      >
                        Tên gói thầu{" "}
                        <SortIcon active={sortCol === "ten"} dir={sortDir} />
                      </th>
                      <th className="px-5 py-3 text-left min-w-[190px]">Hình thức</th>
                      <th
                        className="px-5 py-3 text-right cursor-pointer hover:text-slate-600 select-none whitespace-nowrap"
                        onClick={() => toggleSort("giaTriNum")}
                      >
                        Giá trị (VNĐ){" "}
                        <SortIcon
                          active={sortCol === "giaTriNum"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-left">Đơn vị</th>
                      <th
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none min-w-[130px]"
                        onClick={() => toggleSort("trangThai")}
                      >
                        Trạng thái{" "}
                        <SortIcon
                          active={sortCol === "trangThai"}
                          dir={sortDir}
                        />
                      </th>
                      <th className="px-5 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <i className="fa-solid fa-folder-open text-4xl text-slate-200" />
                            <p className="text-sm font-medium text-slate-500">
                              {search || filterHT || filterTT
                                ? "Không có gói thầu phù hợp với bộ lọc"
                                : "Chưa có gói thầu nào"}
                            </p>
                            {(search || filterHT || filterTT) && (
                              <button
                                onClick={() => {
                                  setSearch("");
                                  setFilterHT("");
                                  setFilterTT("");
                                }}
                                className="text-xs text-blue-600 hover:underline mt-1"
                              >
                                Xóa bộ lọc
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelected(row);
                            setDetailOpen(true);
                          }}
                          className={`cursor-pointer transition-colors ${row.trangThai === "Trễ hạn" ? "bg-red-50/30" : ""} ${selected?.id === row.id ? "bg-blue-50" : "hover:bg-slate-50"} ${row.trangThai === "Đã hủy" ? "opacity-50" : ""}`}
                        >
                          <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold whitespace-nowrap">
                            {row.id}
                          </td>
                          <td className="px-5 py-3 text-slate-800 max-w-[220px]">
                            <div className="line-clamp-2">{row.ten}</div>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${HT_BADGE[row.hinhThuc] ?? "bg-slate-100 text-slate-600"}`}
                            >
                              {row.hinhThuc}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                            {row.giaTriStr}
                          </td>
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                            {row.donVi}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[row.trangThai]}`}
                            >
                              {row.trangThai}
                            </span>
                          </td>
                          <td
                            className="px-5 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                title={
                                  canEditGoiThau(row)
                                    ? "Chỉnh sửa gói thầu"
                                    : canUpdateCurrentStep(row)
                                      ? "Cập nhật bước hiện tại"
                                      : "Không còn thao tác xử lý"
                                }
                                onClick={() => handlePrimaryAction(row)}
                                disabled={!canEditGoiThau(row) && !canUpdateCurrentStep(row)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                              >
                                <i className={`fa-solid ${canEditGoiThau(row) ? "fa-pen" : "fa-clipboard-list"} text-xs`} />
                              </button>
                              {row.trangThai !== "Đã hủy" &&
                                row.trangThai !== "Hoàn thành" && (
                                  <button
                                    title="Hủy gói thầu"
                                    onClick={() => setCancelTarget(row)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                                  >
                                    <i className="fa-solid fa-ban text-xs" />
                                  </button>
                                )}
                              <button
                                title="Xóa"
                                onClick={() => setDeleteTarget(row)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                              >
                                <i className="fa-solid fa-trash text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && filtered.length > PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Hiển thị {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} /{" "}
                  {filtered.length} kết quả
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (n) =>
                        n === 1 || n === totalPages || Math.abs(n - page) <= 1,
                    )
                    .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1)
                        acc.push("…");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "…" ? (
                        <span
                          key={`e${i}`}
                          className="px-1 text-slate-400 text-xs"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n as number)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                          {n}
                        </button>
                      ),
                    )}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <i className="fa-solid fa-chevron-right text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* DETAIL PANEL — wide desktop: always visible; smaller screens: drawer overlay */}
        {/* Desktop */}
        <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden 2xl:block">
          <DetailPanel />
        </aside>

        {/* Drawer */}
        {detailOpen && (
          <div className="2xl:hidden fixed inset-0 z-[100] flex">
            <div
              className="flex-1 bg-black/30"
              onClick={() => setDetailOpen(false)}
            />
            <div className="w-[min(360px,calc(100vw-64px))] bg-white overflow-y-auto p-5 shadow-2xl">
              <button
                onClick={() => setDetailOpen(false)}
                className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                <i className="fa-solid fa-xmark" /> Đóng
              </button>
              <DetailPanel />
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm modals ── */}
      {cancelTarget && (
        <ConfirmModal
          title="Hủy gói thầu"
          message={`Bạn có chắc muốn hủy gói thầu "${cancelTarget.ten}"? Trạng thái sẽ chuyển sang "Đã hủy".`}
          confirmLabel="Xác nhận hủy"
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          danger
          title="Xóa gói thầu"
          message={`Bạn có chắc muốn xóa gói thầu "${deleteTarget.ten}" (${deleteTarget.id})? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {historyTarget && (
        <HistoryModal
          goiThau={historyTarget}
          entries={HISTORY_LOGS.filter(
            (entry) => entry.goiThauId === historyTarget.id,
          )}
          processEntries={getXuLyBuocHistory(historyTarget.id)}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </>
  );
}

