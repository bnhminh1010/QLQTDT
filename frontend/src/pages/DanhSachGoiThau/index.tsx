import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserGoiThauList } from "./goiThauService";

/* ─── Types ───────────────────────────────────────────── */
type TrangThai =
  | "Đang xử lý"
  | "Hoàn thành"
  | "Trễ hạn"
  | "Chờ duyệt"
  | "Đã hủy"
  | "Nháp";
type HinhThuc =
  | "Chỉ định thầu rút gọn"
  | "Chỉ định thầu tự quyết định"
  | "Chỉ định thầu thông thường"
  | "Chào hàng cạnh tranh"
  | "Đấu thầu rộng rãi";
type DotState = "done" | "warn" | "idle";

type GoiThau = {
  id: string;
  ten: string;
  hinhThuc: HinhThuc;
  giaTriStr: string;
  giaTriNum: number;
  donVi: string;
  trangThai: TrangThai;
  detail: {
    nguonVon: string;
    ngayTao: string;
    hanHT: string;
    pct: string;
    buoc: string;
  };
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
const HT_BADGE: Record<HinhThuc, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
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

const PAGE_SIZE = 8;
type SortCol = "id" | "ten" | "giaTriNum" | "trangThai";

/* ─── Sub-components ──────────────────────────────────── */
function Dot({ state }: { state: DotState }) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${DOT_CLS[state]}`}
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

/* ─── Main component ──────────────────────────────────── */
export default function DanhSachGoiThau() {
  const navigate = useNavigate();
  const [data, setData] = useState<GoiThau[]>(() => [
    ...getUserGoiThauList(),
    ...INITIAL_DATA,
  ]);
  const [selected, setSelected] = useState<GoiThau>(INITIAL_DATA[2]);
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

  /* ─ Detail panel content ─ */
  function DetailPanel() {
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
              ["Giá trị", selected.giaTriStr + " đ"],
              ["Nguồn vốn", selected.detail.nguonVon],
              ["Ngày tạo", selected.detail.ngayTao],
              ["Hạn hoàn thành", selected.detail.hanHT],
            ] as [string, string][]
          ).map(([lbl, val]) => (
            <div key={lbl} className="flex justify-between text-xs">
              <span className="text-slate-400">{lbl}</span>
              <span
                className={`font-semibold ${lbl === "Hạn hoàn thành" && selected.trangThai === "Trễ hạn" ? "text-red-500" : "text-slate-800"}`}
              >
                {val}
              </span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
          CÁC BƯỚC QUY TRÌNH
        </div>
        <div className="space-y-3 mb-5">
          {STEPS_TEMPLATE.map(([state, name, sub]) => (
            <div key={name} className="flex items-start gap-2.5">
              <Dot state={state as DotState} />
              <div>
                <div className="text-xs font-medium text-slate-800">{name}</div>
                <div className="text-[11px] text-slate-400">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => navigate("/tao-goi-thau")}
            className="w-full flex items-center justify-center gap-2 text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 rounded-xl py-2.5 transition-colors"
          >
            <i className="fa-solid fa-pen text-xs" /> Chỉnh sửa
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
            className="xl:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-sidebar-flip" />
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              9
            </span>
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
      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-6 space-y-4 min-w-0">
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
                      <th className="px-5 py-3 text-left">Hình thức</th>
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
                        className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
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
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${HT_BADGE[row.hinhThuc]}`}
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
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[row.trangThai]}`}
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
                                title="Chỉnh sửa"
                                onClick={() => navigate("/tao-goi-thau")}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                              >
                                <i className="fa-solid fa-pen text-xs" />
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

        {/* DETAIL PANEL — desktop: always visible; mobile: drawer overlay */}
        {/* Desktop */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <DetailPanel />
        </aside>

        {/* Mobile drawer */}
        {detailOpen && (
          <div className="xl:hidden fixed inset-0 z-[100] flex">
            <div
              className="flex-1 bg-black/30"
              onClick={() => setDetailOpen(false)}
            />
            <div className="w-[300px] bg-white overflow-y-auto p-5 shadow-2xl">
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
    </>
  );
}

