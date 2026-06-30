import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GoiThauDetailPanel from "@/components/workflow/GoiThauDetailPanel";
import {
  buildWorkflowDetailSteps,
  resolveWorkflowCurrentStepSummary,
} from "@/components/workflow/workflowDetailUtils";
import { SelectField } from "@/components/ui/select";
import { searchGoiThau } from "@/services/goiThauApi";
import { getGoiThauChiTiet, type GoiThauDetail } from "@/services/goiThauApi";
import {
  getThongBaos,
  markAllReadThongBao,
  markReadThongBao,
  type ThongBaoItem,
} from "@/services/thongBaoApi";
import {
  getParallelGroups,
  getWorkflowDesignSteps,
  getWorkflowState,
  getWorkflowSteps,
  formatWorkflowKetQua,
  type BuocWorkflowDto,
  type ParallelGroupDto,
  type WorkflowStateDto,
  type WorkflowStepStateDto,
} from "@/services/workflowApi";
import {
  getGoiThauTrangThaiBarColor,
  toGoiThauTrangThaiLabel,
  type GoiThauBarColor,
  type GoiThauTrangThaiLabel,
} from "@/util/goiThauTrangThai";

/* ─ RBAC ─ */
const CAN_CREATE = true;
const CAN_APPROVE = true;

type BadgeStatus = GoiThauTrangThaiLabel;
type BarColor = GoiThauBarColor;
type DotState = "done" | "warn" | "idle";
type StepStatus =
  | "Hoàn tất"
  | "Đang xử lý"
  | "Trễ hạn"
  | "Chờ ký duyệt"
  | "Chưa bắt đầu";
type WorkflowStep = {
  state: DotState;
  name: string;
  processor: string;
  status: StepStatus;
  sla: string;
  ngayXuLy?: string;
  nguoiKy?: string;
  ngayKy?: string;
  ketQua?: string;
  reason?: string;
};

type ParallelInfo = {
  title: string;
  condition: string;
  branches: {
    name: string;
    progress: string;
    status: string;
    currentStep: string;
    processor: string;
    steps: {
      name: string;
      state: "done" | "current" | "idle" | "skipped";
    }[];
  }[];
  mergeStatus: string;
  lockedStage: string;
};

const BADGE: Record<BadgeStatus, string> = {
  "Nháp": "bg-purple-100 text-purple-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Đã hủy": "bg-slate-100 text-slate-500",
  "Đã chọn nhà thầu": "bg-emerald-100 text-emerald-700",
};
const BAR_COLOR: Record<BarColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
  purple: "bg-purple-400",
};
type TableRow = {
  id: number;
  code: string;
  name: string;
  unit: string;
  status: BadgeStatus;
  color: BarColor;
  pct: string;
  txt: string;
  nguonVon: string;
  ngayTao: string;
  hanHT: string;
  hinhThuc: string;
  workflowId?: number;
  overdueReason?: string;
  currentStep: string;
  currentProcessor: string;
  currentProcessDate: string;
  currentSigner: string;
  currentSignedDate: string;
  currentResult: string;
  progressStatus: "Đúng hạn" | "Sắp quá hạn" | "Quá hạn";
  steps: WorkflowStep[];
  parallelInfo?: ParallelInfo;
};

const TABLE_ROWS: TableRow[] = []; void TABLE_ROWS;
const APPROVAL_ITEMS: any[] = [];

function Badge({ label }: { label: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[label] ?? "bg-slate-100 text-slate-600"}`}
    >
      {label}
    </span>
  );
}

function ProgBar({ color, pct }: { color: BarColor; pct: string }) {
  return (
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${BAR_COLOR[color]}`}
        style={{ width: pct }}
      />
    </div>
  );
}

const STEP_STATUS_LABEL: Record<string, StepStatus> = {
  HOAN_TAT: "Hoàn tất",
  COMPLETED: "Hoàn tất",
  DANG_XU_LY: "Đang xử lý",
  IN_PROGRESS: "Đang xử lý",
  CHO_DUYET: "Chờ ký duyệt",
  CHO_KY_DUYET: "Chờ ký duyệt",
  TRE_HAN: "Trễ hạn",
  QUA_HAN: "Trễ hạn",
};

const TIEN_DO_LABEL: Record<string, string> = {
  DUNG_TIEN_DO: "Đúng hạn",
  QUA_HAN: "Quá hạn",
  SAP_QUA_HAN: "Sắp quá hạn",
  CHUA_THUC_HIEN: "Chưa thực hiện",
  CHUA_CO_HAN: "Chưa có hạn xử lý",
  HOAN_TAT: "Hoàn tất",
};

function mapWorkflowStepStatus(step: WorkflowStepStateDto): StepStatus {
  if (step.ngayHoanThanh) return "Hoàn tất";
  if (step.trangThai && STEP_STATUS_LABEL[step.trangThai]) return STEP_STATUS_LABEL[step.trangThai];
  if (step.quaHan || step.tinhTrangTienDo === "QUA_HAN") return "Trễ hạn";
  if (step.ngayBatDau) return "Đang xử lý";
  return "Chưa bắt đầu";
}

function mapWorkflowStep(
  step: WorkflowStepStateDto,
  currentStepId?: number,
): WorkflowStep {
  const completed = step.trangThai === "COMPLETED" || Boolean(step.ngayHoanThanh);
  const current = step.id === currentStepId;
  const overdue = Boolean(step.quaHan) || step.tinhTrangTienDo === "QUA_HAN";

  return {
    state: completed ? "done" : current || overdue ? "warn" : "idle",
    name: step.tenBuoc,
    processor:
      step.tenNguoiXuLy ||
      step.tenNguoiKyDuyet ||
      step.tenVaiTroXuLy ||
      step.tenVaiTroKyDuyet ||
      "-",
    status: mapWorkflowStepStatus(step),
    sla: overdue ? "Quá hạn" : TIEN_DO_LABEL[step.tinhTrangTienDo ?? ""] || step.hanXuLy?.slice(0, 10) || "-",
    ngayXuLy: step.ngayXuLy?.slice(0, 10),
    nguoiKy: step.tenNguoiKyDuyet,
    ngayKy: step.ngayKyDuyet?.slice(0, 10),
    ketQua: formatWorkflowKetQua(step.ketQua),
    reason: step.lyDoKhongDuyet,
  };
}

function getProgressStatus(state?: WorkflowStateDto | null): TableRow["progressStatus"] {
  if (state?.tinhTrangTienDo === "QUA_HAN" || state?.steps.some((step) => step.quaHan)) {
    return "Quá hạn";
  }
  if (state?.tinhTrangTienDo === "SAP_QUA_HAN") return "Sắp quá hạn";
  return "Đúng hạn";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<ThongBaoItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<BadgeStatus | "">("");
  const notifRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState<WorkflowStateDto | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStepStateDto[]>([]);
  const [designSteps, setDesignSteps] = useState<BuocWorkflowDto[]>([]);
  const [parallelGroups, setParallelGroups] = useState<ParallelGroupDto[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<GoiThauDetail | null>(null);

  // Load data from API
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await searchGoiThau({ page: 1, pageSize: 50 });
        const rows: TableRow[] = await Promise.all(result.items.map(async (item) => {
          const status = toGoiThauTrangThaiLabel(item.trangThai);
          const color = getGoiThauTrangThaiBarColor(item.trangThai);
          let workflowState: WorkflowStateDto | null = null;
          try {
            workflowState = await getWorkflowState(item.id);
          } catch {
            workflowState = null;
          }
          const currentStep = workflowState?.currentSteps?.[0];
          const currentStepDetail = workflowState?.steps.find(
            (step) => step.id === currentStep?.stepInstanceId,
          );
	          return {
	          id: item.id,
	          code: item.maGoiThau || `GT${item.id}`,
	          name: item.tenGoiThau || '',
	          unit: item.tenKhoaPhong || '',
	          status,
	          color,
	          pct: `${item.phanTramHoanThanh}%`,
	          txt: `${item.soBuocHoanThanh}/${item.tongSoBuoc}`,
	          nguonVon: '',
	          ngayTao: item.ngayTao?.slice(0, 10) || '',
	          hanHT: currentStepDetail?.hanXuLy?.slice(0, 10) || '',
	          hinhThuc: item.tenHinhThuc || '',
	          workflowId: item.workflowId ?? workflowState?.workflowId,
	          currentStep: workflowState?.tenBuocHienTai || currentStep?.tenBuoc || '',
          currentProcessor:
            currentStepDetail?.tenNguoiXuLy ||
            currentStepDetail?.tenNguoiKyDuyet ||
            currentStepDetail?.tenVaiTroXuLy ||
            currentStepDetail?.tenVaiTroKyDuyet ||
            '',
          currentProcessDate: currentStepDetail?.ngayXuLy?.slice(0, 10) || '',
          currentSigner: currentStepDetail?.tenNguoiKyDuyet || '',
          currentSignedDate: currentStepDetail?.ngayKyDuyet?.slice(0, 10) || '',
          currentResult:
            formatWorkflowKetQua(currentStepDetail?.ketQua) ||
            (currentStepDetail?.trangThai === "HOAN_TAT" ? "Duyệt" : currentStepDetail?.trangThai || ''),
          progressStatus: getProgressStatus(workflowState),
          steps: workflowState?.steps.map((step) =>
            mapWorkflowStep(step, currentStep?.stepInstanceId),
          ) ?? [],
          };
        }));
        setTableRows(rows);
      } catch {
        setTableRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadNotifications() {
    try {
      const [list, unread] = await Promise.all([
        getThongBaos({ page: 1, pageSize: 10 }),
        getThongBaos({ page: 1, pageSize: 1, daDoc: false }),
      ]);
      setNotifs(list.items);
      setUnreadCount(unread.totalCount);
    } catch {
      // Dropdown thông báo không được làm hỏng dashboard chính.
    }
  }

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = tableRows.length > 0 ? (tableRows[selectedIdx] || tableRows[0]) : null;

  useEffect(() => {
    if (!selected) {
      setSelectedDetail(null);
      setWorkflowState(null);
      setWorkflowSteps([]);
      setDesignSteps([]);
      setParallelGroups([]);
      setWorkflowLoading(false);
      return;
    }

    const numericId = Number(selected.id);
    const selectedWorkflowId = selected.workflowId;
    if (!Number.isFinite(numericId) || numericId <= 0) {
      setSelectedDetail(null);
      setWorkflowState(null);
      setWorkflowSteps([]);
      setDesignSteps([]);
      setParallelGroups([]);
      setWorkflowLoading(false);
      return;
    }

    let cancelled = false;

    async function loadWorkflowDetail() {
      setWorkflowLoading(true);
      setSelectedDetail(null);
      const detailPromise = getGoiThauChiTiet(numericId).catch(() => null);

      void detailPromise.then((detail) => {
        if (!cancelled) setSelectedDetail(detail);
      });

      try {
        const [state, steps] = await Promise.all([
          getWorkflowState(numericId),
          getWorkflowSteps(numericId),
        ]);
        const detail = await detailPromise;
        const workflowId = selectedWorkflowId ?? detail?.workflowId ?? state.workflowId;
        const [design, groups] = workflowId
          ? await Promise.all([
              getWorkflowDesignSteps(workflowId).catch(() => [] as BuocWorkflowDto[]),
              getParallelGroups(workflowId).catch(() => [] as ParallelGroupDto[]),
            ])
          : [[] as BuocWorkflowDto[], [] as ParallelGroupDto[]];

        if (cancelled) return;
        setWorkflowState(state);
        setWorkflowSteps(steps);
        setDesignSteps(design);
        setParallelGroups(groups);
      } catch {
        if (cancelled) return;
        const detail = await detailPromise;
        setWorkflowState(null);
        setWorkflowSteps([]);

        const workflowId = selectedWorkflowId ?? detail?.workflowId;
        if (!workflowId) {
          setDesignSteps([]);
          setParallelGroups([]);
          return;
        }

        try {
          const [design, groups] = await Promise.all([
            getWorkflowDesignSteps(workflowId).catch(() => [] as BuocWorkflowDto[]),
            getParallelGroups(workflowId).catch(() => [] as ParallelGroupDto[]),
          ]);
          if (!cancelled) {
            setDesignSteps(design);
            setParallelGroups(groups);
          }
        } catch {
          if (!cancelled) {
            setDesignSteps([]);
            setParallelGroups([]);
          }
        }
      } finally {
        if (!cancelled) setWorkflowLoading(false);
      }
    }

    void loadWorkflowDetail();

    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.workflowId]);

  const filteredRows = tableRows.filter((r) => {
    const matchSearch =
      !search ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.unit.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const currentWorkflowSummary = useMemo(
    () => resolveWorkflowCurrentStepSummary(workflowState, workflowSteps),
    [workflowState, workflowSteps],
  );
  const displaySteps = useMemo(
    () => buildWorkflowDetailSteps(workflowState, workflowSteps, designSteps, parallelGroups),
    [workflowState, workflowSteps, designSteps, parallelGroups],
  );
  const currentStepName =
    currentWorkflowSummary.currentStepName ||
    selected?.currentStep ||
    "";

  /* Close notification dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    markAllReadThongBao()
      .then(() => {
        setNotifs((prev) => prev.map((n) => ({ ...n, daDoc: true })));
        setUnreadCount(0);
      })
      .catch(() => {});
  }

  function openNotification(item: ThongBaoItem) {
    markReadThongBao(item.idCongKhai).catch(() => {});
    setNotifs((prev) =>
      prev.map((x) => x.idCongKhai === item.idCongKhai ? { ...x, daDoc: true } : x),
    );
    setUnreadCount((count) => item.daDoc ? count : Math.max(0, count - 1));
    setNotifOpen(false);
    if (item.urlDieuHuong) navigate(item.urlDieuHuong);
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-bell" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-[200] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifs.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-slate-400">
                      Chưa có thông báo nào
                    </div>
                  )}
                  {notifs.map((n) => (
                    <div
                      key={n.idCongKhai}
                      onClick={() => openNotification(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.daDoc ? "bg-blue-50/40" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-sm">
                        <i className="fa-solid fa-bell" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs ${!n.daDoc ? "font-semibold text-slate-800" : "text-slate-600"}`}
                        >
                          {n.tieuDe}
                        </p>
                        {n.noiDung && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {n.noiDung}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {n.ngayTao ? new Date(n.ngayTao).toLocaleString("vi-VN") : ""}
                        </p>
                      </div>
                      {!n.daDoc && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {CAN_CREATE && (
            <button
              onClick={() => navigate("/tao-goi-thau")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-plus text-xs" /> Tạo gói thầu
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              [
                "fa-box-archive",
                "gray",
                "TỔNG GÓI THẦU",
                tableRows.length,
                "gói thầu",
                "text-slate-800",
                "",
              ],
              [
                "fa-hourglass-half",
                "blue",
                "ĐANG XỬ LÝ",
                tableRows.filter((r) => r.status === "Đang xử lý").length,
                "gói",
                "text-blue-600",
                "Đang xử lý",
              ],
              [
                "fa-triangle-exclamation",
                "red",
                "TRỄ HẠN",
                tableRows.filter((r) => r.status === "Trễ hạn").length,
                "cần xử lý gấp",
                "text-red-500",
                "Trễ hạn",
              ],
              [
                "fa-circle-check",
                "green",
                "HOÀN THÀNH",
                tableRows.filter((r) => r.status === "Hoàn thành").length,
                "gói",
                "text-emerald-600",
                "Hoàn thành",
              ],
            ].map(([icon, color, lbl, val, sub, valCls, targetStatus]) => (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  const status = targetStatus as BadgeStatus | "";
                  setFilterStatus(status);
                  setSearch("");
                  const firstMatch = status
                    ? tableRows.findIndex((row) => row.status === status)
                    : 0;
                  if (firstMatch >= 0) setSelectedIdx(firstMatch);
                }}
                className={`bg-white rounded-2xl border p-4 flex items-center gap-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  filterStatus === targetStatus
                    ? "border-blue-400 ring-1 ring-blue-200"
                    : "border-slate-200"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "gray" ? "bg-slate-100 text-slate-500" : color === "blue" ? "bg-blue-100 text-blue-600" : color === "red" ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-600"}`}
                >
                  <i className={`fa-solid ${icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">
                    {lbl}
                  </div>
                  <div className={`text-2xl font-extrabold ${valCls}`}>
                    {val}
                  </div>
                  <div className="text-xs text-slate-400">{sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">
                Gói thầu cần chú ý
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo mã, tên, đơn vị..."
                    className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-52"
                  />
                </div>
                <SelectField
                  value={filterStatus || "__all"}
                  onValueChange={(value) =>
                    setFilterStatus(value === "__all" ? "" : (value as BadgeStatus))
                  }
                  options={[
                    { value: "__all", label: "Tất cả trạng thái" },
                    { value: "Đang xử lý", label: "Đang xử lý" },
                    { value: "Hoàn thành", label: "Hoàn thành" },
                    { value: "Trễ hạn", label: "Trễ hạn" },
                    { value: "Chờ duyệt", label: "Chờ duyệt" },
                  ]}
                  triggerClassName="h-8 min-w-[150px] rounded-lg bg-white px-2 text-xs"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Mã gói</th>
                    <th className="px-5 py-3 text-left">Tên gói thầu</th>
                    <th className="px-5 py-3 text-left">Đơn vị</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-left w-40">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-slate-400 text-sm"
                      >
                        Không tìm thấy gói thầu phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const idx = tableRows.indexOf(row);
                      return (
                        <tr
                          key={row.code}
                          onClick={() => setSelectedIdx(idx)}
                          className={`cursor-pointer transition-colors ${row.status === "Trễ hạn" ? "bg-red-50/40" : ""} ${selectedIdx === idx ? "bg-blue-50" : "hover:bg-slate-50"}`}
                        >
                          <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold">
                            {row.code}
                          </td>
                          <td className="px-5 py-3 text-slate-800">
                            {row.name}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {row.unit}
                          </td>
                          <td className="px-5 py-3">
                            <Badge label={row.status} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <ProgBar color={row.color} pct={row.pct} />
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              {row.txt}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* APPROVAL — only visible to Admin/Quản lý */}
          {CAN_APPROVE && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <span className="font-semibold text-slate-800 text-sm">
                  Bước cần phê duyệt hôm nay
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {APPROVAL_ITEMS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      const idx = tableRows.findIndex(
                        (row) => row.code === item.code,
                      );
                      if (idx >= 0) setSelectedIdx(idx);
                    }}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                      item.overdue ? "bg-red-50/30" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        item.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-orange-100 text-orange-500"
                      }`}
                    >
                      <i className={item.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800">
                        {item.title} – {item.code}
                      </div>
                      <div className="mt-1 grid gap-0.5 text-xs">
                        <div className="flex gap-1.5 text-slate-600">
                          <span className="text-slate-400">Người xử lý:</span>
                          <span className="font-medium">{item.handler}</span>
                        </div>
                        <div className="flex gap-1.5 text-slate-600">
                          <span className="text-slate-400">Đơn vị:</span>
                          <span className="font-medium">{item.unit}</span>
                        </div>
                        <div
                          className={`font-semibold ${
                            item.overdue ? "text-red-500" : "text-blue-600"
                          }`}
                        >
                          {item.sla}
                        </div>
                      </div>
                    </div>
                    <Badge label={item.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* DETAIL PANEL — dynamic based on selected row */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <i className="fa-solid fa-circle-notch fa-spin text-blue-400 text-lg" />
            </div>
          ) : !selected ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <i className="fa-solid fa-inbox text-3xl mb-2" />
              <p className="text-xs">Chưa có dữ liệu</p>
            </div>
          ) : (
            <GoiThauDetailPanel
              code={selected.code}
              title={selected.name}
              subtitle={selected.unit}
              badges={[
                { label: selected.hinhThuc, className: "border border-slate-200 text-slate-600" },
                { label: selected.status, className: BADGE[selected.status] },
              ]}
              progressLabel={selected.txt}
              progressValue={selected.pct}
              progressBarClassName={BAR_COLOR[selected.color]}
              metaRows={[
                { label: "Bước hiện tại", value: currentStepName || "—" },
                { label: "Nguồn vốn", value: selectedDetail?.nguonVon || selected.nguonVon || "—" },
                { label: "Ngày tạo", value: selectedDetail?.ngayTao?.slice(0, 10) || selected.ngayTao || "—" },
                {
                  label: "Hạn hoàn thành",
                  value: currentWorkflowSummary.currentDueDate || selected.hanHT || "—",
                  valueClassName: selected.status === "Trễ hạn" ? "text-red-500" : undefined,
                },
                {
                  label: "Tình trạng tiến độ",
                  value: selected.progressStatus,
                  valueClassName: selected.progressStatus === "Quá hạn" ? "text-red-500" : undefined,
                },
              ]}
              stepInfoRows={[
                { label: "Người xử lý", value: currentWorkflowSummary.currentProcessor },
                { label: "Ngày xử lý", value: currentWorkflowSummary.currentProcessDate },
                { label: "Người ký", value: currentWorkflowSummary.currentSigner },
                { label: "Ngày ký", value: currentWorkflowSummary.currentSignedDate },
                { label: "Kết quả", value: currentWorkflowSummary.currentResult },
              ]}
              steps={displaySteps}
              stepsLoading={workflowLoading}
              stepsEmptyMessage="Chua co du lieu buoc quy trinh tu backend."
              footerAction={{
                label: "Xem chi tiết",
                onClick: () => navigate("/danh-sach-goi-thau"),
              }}
            />
          )}
        </aside>
      </div>
    </>
  );
}
