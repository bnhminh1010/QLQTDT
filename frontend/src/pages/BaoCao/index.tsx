import { useMemo, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import { searchBaoCaoGoiThau, getWorkflowStepReport, getBaoCaoTietKiem, getBaoCaoHieuSuatNguoiDung, getWorkflowBottleneck, type WorkflowStepReport, type BaoCaoTietKiem, type BaoCaoHieuSuatNguoiDung, type WorkflowBottleneck } from "@/services/baoCaoApi";
import { WorkflowGraphModal } from "./components/WorkflowGraphModal";

type TimeMode = "day" | "month" | "year";

type PackageReport = {
  internalId: number;
  id: string;
  name: string;
  unit: string;
  method: string;
  status: string;
  value: number;
  progress: "Đúng hạn" | "Sắp quá hạn" | "Quá hạn";
  days: number;
  saving: number;
  createdAt: string;
};

type IconColor = "blue" | "green" | "purple" | "amber";

const ICON_BG: Record<IconColor, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-700",
  amber: "bg-amber-100 text-amber-600",
};

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

function useMounted() {
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);
  return mounted;
}

function formatMoney(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  }
  return `${Math.round(value / 1_000_000).toLocaleString("vi-VN")} triệu`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN");
}

function inRange(item: PackageReport, mode: TimeMode, from: string, to: string, month: string, year: string) {
  const date = new Date(`${item.createdAt}T00:00:00`);
  if (mode === "day") {
    const fromDate = from ? new Date(`${from}T00:00:00`) : null;
    const toDate = to ? new Date(`${to}T23:59:59`) : null;
    return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  }
  if (mode === "month") {
    return date.getFullYear() === Number(year) && date.getMonth() + 1 === Number(month);
  }
  return date.getFullYear() === Number(year);
}

function downloadCsv(rows: PackageReport[], fileName: string) {
  const header = ["Mã gói", "Tên gói", "Đơn vị", "Hình thức", "Giá trị", "Trạng thái", "Tiến độ"];
  const body = rows.map((row) => [row.id, row.name, row.unit, row.method, row.value, row.status, row.progress]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const TRANG_THAI_MAP: Record<string, string> = {
  DU_THAO: "Nháp", DANG_XU_LY: "Đang xử lý", HOAN_THANH: "Hoàn thành",
  HUY_BO: "Đã hủy", QUA_HAN: "Trễ hạn", DA_CHON_NHA_THAU: "Đã chọn nhà thầu",
};

export default function BaoCao() {
  const printRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const [packages, setPackages] = useState<PackageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitFilter, setUnitFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [methodFilter, setMethodFilter] = useState("Tất cả");
  const [timeMode, setTimeMode] = useState<TimeMode>("day");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [selectedUnit, setSelectedUnit] = useState("");
  const [stepReport, setStepReport] = useState<WorkflowStepReport[]>([]);
  const [stepReportLoading, setStepReportLoading] = useState(false);
  const [tietKiemData, setTietKiemData] = useState<BaoCaoTietKiem[]>([]);
  const [hieuSuatData, setHieuSuatData] = useState<BaoCaoHieuSuatNguoiDung[]>([]);
  const [bottleneckData, setBottleneckData] = useState<WorkflowBottleneck[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [graphTarget, setGraphTarget] = useState<PackageReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const result = await searchBaoCaoGoiThau({ page: 1, pageSize: 100 });
        if (cancelled) return;
        const mapped: PackageReport[] = result.items.map((item) => ({
          internalId: item.id,
          id: item.maGoiThau,
          name: item.tenGoiThau,
          unit: item.tenKhoaPhong || "—",
          method: item.tenHinhThuc || "—",
          status: TRANG_THAI_MAP[item.trangThai] ?? item.trangThai,
          value: item.giaTri || 0,
          progress: item.phanTramHoanThanh >= 100 ? ("Đúng hạn" as const) : item.trangThai === "QUA_HAN" ? ("Quá hạn" as const) : ("Đúng hạn" as const),
          days: 0,
          saving: 0,
          createdAt: item.ngayTao?.slice(0, 10) || "",
        }));
        if (cancelled) return;
        setPackages(mapped);
      } catch {
        toast.error("Không thể tải dữ liệu báo cáo");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    fetchStepReport();
    fetchExtraReports();
    return () => { cancelled = true; };
  }, []);

  async function fetchExtraReports() {
    setExtraLoading(true);
    try { const data = await getBaoCaoTietKiem(); if (mounted.current) setTietKiemData(data); } catch { /* ignore */ }
    try { const data = await getBaoCaoHieuSuatNguoiDung(); if (mounted.current) setHieuSuatData(data); } catch { /* ignore */ }
    try { const data = await getWorkflowBottleneck(); if (mounted.current) setBottleneckData(data); } catch { /* ignore */ }
    if (mounted.current) setExtraLoading(false);
  }

  async function fetchStepReport() {
    setStepReportLoading(true);
    try {
      const data = await getWorkflowStepReport();
      if (mounted.current) setStepReport(data);
    } catch { /* ignore */ }
    finally { if (mounted.current) setStepReportLoading(false); }
  }

  const allUnits = useMemo(() => Array.from(new Set(packages.map((p) => p.unit))).sort(), [packages]);
  const allMethods = useMemo(() => Array.from(new Set(packages.map((p) => p.method))).sort(), [packages]);
  const allStatusesVn = useMemo(() => Array.from(new Set(packages.map((p) => p.status))).sort(), [packages]);

  const filteredPackages = useMemo(
    () => packages.filter((item) => {
      const matchUnit = unitFilter === "Tất cả" || item.unit === unitFilter;
      const matchStatus = statusFilter === "Tất cả" || item.status === statusFilter;
      const matchMethod = methodFilter === "Tất cả" || item.method === methodFilter;
      return matchUnit && matchStatus && matchMethod && inRange(item, timeMode, fromDate, toDate, month, year);
    }),
    [packages, unitFilter, statusFilter, methodFilter, timeMode, fromDate, toDate, month, year],
  );

  const unitRows = useMemo(
    () => allUnits.map((unit) => {
      const rows = filteredPackages.filter((item) => item.unit === unit);
      return {
        unit,
        count: rows.length,
        total: rows.reduce((sum, item) => sum + item.value, 0),
        done: rows.filter((item) => item.status === "Hoàn thành").length,
        prog: rows.filter((item) => item.status === "Đang xử lý" || item.status === "Chờ duyệt").length,
        late: rows.filter((item) => item.status === "Trễ hạn").length,
        topPackage: rows[0]?.name ?? "Chưa có gói thầu",
      };
    }).filter((row) => row.count > 0),
    [allUnits, filteredPackages],
  );

  const panelUnit = selectedUnit || (unitRows.length > 0 ? unitRows[0].unit : "");
  const panelRows = filteredPackages.filter((item) => item.unit === panelUnit);
  const totalValue = filteredPackages.reduce((sum, item) => sum + item.value, 0);
  const totalSaving = filteredPackages.reduce((sum, item) => sum + item.saving, 0);
  const onTime = filteredPackages.filter((item) => item.progress !== "Quá hạn").length;
  const avgDays = filteredPackages.length > 0
    ? Math.round(filteredPackages.reduce((sum, item) => sum + item.days, 0) / filteredPackages.length)
    : 0;
  const completionRate = panelRows.length > 0
    ? Math.round((panelRows.filter((item) => item.status === "Hoàn thành").length / panelRows.length) * 100)
    : 0;

  const monthlyData = MONTHS.map((_, index) =>
    filteredPackages.filter((item) => new Date(`${item.createdAt}T00:00:00`).getMonth() === index).length,
  );
  const maxMonth = Math.max(...monthlyData, 1);
  const methodRows = allMethods.map((method) => {
    const count = filteredPackages.filter((item) => item.method === method).length;
    const pct = filteredPackages.length > 0 ? Math.round((count / filteredPackages.length) * 100) : 0;
    return { method, count, pct };
  }).filter((item) => item.count > 0);

  const kpi = [
    { icon: "fa-sack-dollar", color: "blue" as IconColor, label: "TỔNG GIÁ TRỊ", val: formatMoney(totalValue), sub: "theo bộ lọc hiện tại", valCls: "text-blue-700" },
    { icon: "fa-piggy-bank", color: "green" as IconColor, label: "TIẾT KIỆM", val: formatMoney(totalSaving), sub: "theo dữ liệu đang xem", valCls: "text-emerald-600" },
    { icon: "fa-clock-rotate-left", color: "purple" as IconColor, label: "TỈ LỆ ĐÚNG HẠN", val: `${filteredPackages.length ? Math.round((onTime / filteredPackages.length) * 100) : 0}%`, sub: "gói đúng tiến độ", valCls: "text-purple-700" },
    { icon: "fa-calendar-days", color: "amber" as IconColor, label: "TRUNG BÌNH / GÓI", val: `${avgDays} ngày`, sub: "thời gian xử lý TB", valCls: "text-amber-600" },
  ];

  function resetFilters() {
    setUnitFilter("Tất cả");
    setStatusFilter("Tất cả");
    setMethodFilter("Tất cả");
    setTimeMode("day");
    const today = new Date(); const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(today.getMonth() - 3);
    setFromDate(threeMonthsAgo.toISOString().slice(0, 10));
    setToDate(today.toISOString().slice(0, 10));
    setMonth(String(today.getMonth() + 1));
    setYear(String(today.getFullYear()));
    setSelectedUnit("");
  }

  function exportCurrent(type: "Excel" | "PDF") {
    if (type === "Excel") downloadCsv(filteredPackages, `bao-cao-${Date.now()}.csv`);
    if (type === "PDF") window.print();
  }

  function applyFilter(status?: string) {
    if (status) setStatusFilter(status);
    toast.success("Đã áp dụng bộ lọc");
  }

  // Drill-down: click KPI → filter gói tương ứng
  function drillKpi(idx: number) {
    if (idx === 0) resetFilters(); // tổng giá trị → xem tất cả
    if (idx === 2) applyFilter("Trễ hạn"); // tỉ lệ đúng hạn → lọc Trễ hạn
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
          <p className="text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Báo cáo &amp; Thống kê</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{packages.length} gói thầu</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" ref={printRef}>
        <main className="flex-1 overflow-y-auto p-6 space-y-5 bao-cao-print">
          {/* ── FILTER BAR ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-5">
            <div className="flex flex-wrap items-end gap-3">
              {/* Đơn vị */}
              <div className="min-w-[180px] flex-1">
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Đơn vị/Khoa phòng</label>
                <SelectField value={unitFilter}
                  onValueChange={(v) => { setUnitFilter(v); if (v !== "Tất cả") setSelectedUnit(v); }}
                  options={[{ value: "Tất cả", label: "Tất cả" }, ...allUnits.map((u) => ({ value: u, label: u }))]}
                  triggerClassName="h-9 bg-white text-xs" />
              </div>

              {/* Thời gian */}
              <div className="min-w-[240px] flex-[2]">
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Thời gian thống kê</label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 h-9">
                  {(["day", "month", "year"] as TimeMode[]).map((mode) => (
                    <button key={mode} onClick={() => setTimeMode(mode)}
                      className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${timeMode === mode ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
                      {mode === "day" ? "Ngày" : mode === "month" ? "Tháng" : "Năm"}
                    </button>
                  ))}
                  {timeMode === "day" && (
                    <span className="flex items-center gap-1 ml-1">
                      <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                        className="h-6 w-[110px] rounded border border-slate-200 text-[10px] px-1" />
                      <span className="text-[10px] text-slate-400">→</span>
                      <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                        className="h-6 w-[110px] rounded border border-slate-200 text-[10px] px-1" />
                    </span>
                  )}
                  {timeMode === "month" && (
                    <span className="flex items-center gap-1 ml-1">
                      <SelectField value={month} onValueChange={setMonth}
                        options={Array.from({ length: 12 }, (_, i) => `${i + 1}`).map((m) => ({ value: m, label: `Th ${m}` }))}
                        triggerClassName="h-6 w-16 rounded bg-white text-[10px] px-1" />
                      <SelectField value={year} onValueChange={setYear}
                        options={["2025", "2026"].map((y) => ({ value: y, label: y }))}
                        triggerClassName="h-6 w-16 rounded bg-white text-[10px] px-1" />
                    </span>
                  )}
                  {timeMode === "year" && (
                    <SelectField value={year} onValueChange={setYear}
                      options={["2025", "2026"].map((y) => ({ value: y, label: y }))}
                      triggerClassName="h-6 w-16 rounded bg-white text-[10px] px-1 ml-1" />
                  )}
                </div>
              </div>

              {/* Trạng thái */}
              <div className="min-w-[140px] flex-1">
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Trạng thái</label>
                <SelectField value={statusFilter} onValueChange={setStatusFilter}
                  options={[{ value: "Tất cả", label: "Tất cả" }, ...allStatusesVn.map((s) => ({ value: s, label: s }))]}
                  triggerClassName="h-9 bg-white text-xs" />
              </div>

              {/* Loại hình */}
              <div className="min-w-[140px] flex-1">
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Loại hình đấu thầu</label>
                <SelectField value={methodFilter} onValueChange={setMethodFilter}
                  options={[{ value: "Tất cả", label: "Tất cả" }, ...allMethods.map((m) => ({ value: m, label: m }))]}
                  triggerClassName="h-9 bg-white text-xs" />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pb-px">
                <button onClick={() => toast.success("Đã áp dụng bộ lọc")}
                  className="h-9 px-4 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 flex items-center gap-1.5">
                  <i className="fa-solid fa-filter text-[10px]" /> Lọc
                </button>
                <button onClick={resetFilters}
                  className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1">
                  <i className="fa-solid fa-rotate-left text-[10px]" /> Đặt lại
                </button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpi.map((item, ki) => (
              <button key={item.label} onClick={() => drillKpi(ki)} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 text-left hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${ICON_BG[item.color]}`}>
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">{item.label}</div>
                  <div className={`text-2xl font-extrabold ${item.valCls}`}>{item.val}</div>
                  <div className="text-xs text-slate-400">{item.sub}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-800">Gói thầu theo tháng</span>
                <span className="text-xs text-slate-400">Tổng {filteredPackages.length} gói</span>
              </div>
              <div className="flex items-end gap-2 h-36">
                {monthlyData.map((count, index) => {
                  const hPct = count > 0 ? Math.round((count / maxMonth) * 100) : 0;
                  return (
                    <button key={MONTHS[index]} type="button" className="flex-1 flex flex-col items-center gap-1 rounded-lg px-1 py-1 hover:bg-blue-50">
                      {count > 0 && <span className="text-[10px] text-slate-500">{count}</span>}
                      <div className="w-full rounded-t-sm bg-blue-500" style={{ height: `${hPct}%`, minHeight: count > 0 ? 4 : 0 }} />
                      <span className="text-[10px] text-slate-400">{MONTHS[index]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-semibold text-slate-800 mb-4">Phân bố theo hình thức</div>
              <div className="space-y-3">
                {methodRows.length === 0 ? (
                  <p className="text-sm text-slate-400">Không có dữ liệu.</p>
                ) : (
                  methodRows.map((item) => (
                    <div key={item.method}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-700">{item.method}</span>
                        <span className="font-semibold text-slate-800">{item.count} gói ({item.pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Workflow step report — dropdown closed by default */}
          <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden group" open>
            <summary className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-diagram-project text-slate-400" />
                Tiến độ các bước quy trình
              </span>
              <i className="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            {stepReportLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin mr-1" /> Đang tải...
              </div>
            ) : stepReport.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th className="px-5 py-3 text-left">Bước</th>
                      <th className="px-5 py-3 text-right">Tổng</th>
                      <th className="px-5 py-3 text-right">Hoàn thành</th>
                      <th className="px-5 py-3 text-right">Đang xử lý</th>
                      <th className="px-5 py-3 text-right">Chờ duyệt</th>
                      <th className="px-5 py-3 text-right">Quá hạn</th>
                      <th className="px-5 py-3 text-right">Tỉ lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stepReport.map((s) => (
                      <tr key={s.tenBuoc} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-800 font-medium">{s.tenBuoc}</td>
                        <td className="px-5 py-3 text-right text-slate-700">{s.tongSo}</td>
                        <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{s.hoanThanh}</td>
                        <td className="px-5 py-3 text-right text-blue-700 font-semibold">{s.dangXuLy}</td>
                        <td className="px-5 py-3 text-right text-amber-700 font-semibold">{s.choDuyet}</td>
                        <td className="px-5 py-3 text-right text-red-500 font-semibold">{s.quaHan}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.tiLeHoanThanh}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 w-9 text-right">{s.tiLeHoanThanh}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>

          {/* ── 1. PHÂN TÍCH TIẾT KIỆM NGÂN SÁCH ── */}
          <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden group" open>
            <summary className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-piggy-bank text-emerald-500" />
                Phân tích tiết kiệm ngân sách
              </span>
              <i className="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            {extraLoading ? (
              <div className="py-8 text-center text-xs text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-1" />Đang tải...</div>
            ) : tietKiemData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu.</div>
            ) : (
              <>
                {/* Summary KPI */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 p-5">
                  {(() => {
                    const tongNS = tietKiemData.reduce((s, r) => s + r.tongNganSach, 0);
                    const tongHD = tietKiemData.reduce((s, r) => s + (r.tongGiaTriHopDong || 0), 0);
                    const tongTK = tietKiemData.reduce((s, r) => s + (r.tienTietKiem || 0), 0);
                    const pct = tongNS > 0 ? (tongTK / tongNS * 100).toFixed(1) : "0.0";
                    return [
                      { label: "TỔNG NGÂN SÁCH", val: formatMoney(tongNS), cls: "text-blue-700" },
                      { label: "TỔNG HỢP ĐỒNG", val: formatMoney(tongHD), cls: "text-purple-700" },
                      { label: "TIẾT KIỆM", val: formatMoney(tongTK), cls: "text-emerald-600" },
                      { label: "TỈ LỆ TIẾT KIỆM", val: `${pct}%`, cls: tongTK >= 0 ? "text-emerald-600" : "text-red-600" },
                    ].map((k) => (
                      <div key={k.label} className="rounded-xl border border-slate-100 p-3">
                        <div className="text-[10px] font-bold text-slate-400 tracking-wide">{k.label}</div>
                        <div className={`text-lg font-extrabold ${k.cls}`}>{k.val}</div>
                      </div>
                    ));
                  })()}
                </div>
                {/* Table by department */}
                <div className="overflow-x-auto border-t border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                        <th className="px-5 py-3 text-left">Khoa/Phòng</th>
                        <th className="px-5 py-3 text-right">Số gói</th>
                        <th className="px-5 py-3 text-right">Ngân sách</th>
                        <th className="px-5 py-3 text-right">Giá trị HĐ</th>
                        <th className="px-5 py-3 text-right">Tiết kiệm</th>
                        <th className="px-5 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tietKiemData.map((r) => (
                        <tr key={r.tenKhoaPhong} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-slate-800 font-medium">{r.tenKhoaPhong}</td>
                          <td className="px-5 py-3 text-right text-slate-700">{r.tongGoiThau}</td>
                          <td className="px-5 py-3 text-right text-slate-700 font-medium">{formatCurrency(r.tongNganSach)}</td>
                          <td className="px-5 py-3 text-right text-purple-700 font-semibold">{r.tongGiaTriHopDong ? formatCurrency(r.tongGiaTriHopDong) : "—"}</td>
                          <td className="px-5 py-3 text-right font-semibold">
                            <span className={r.tienTietKiem && r.tienTietKiem >= 0 ? "text-emerald-600" : "text-red-600"}>
                              {r.tienTietKiem != null ? formatCurrency(r.tienTietKiem) : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${r.phanTramTietKiem >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                                  style={{ width: `${Math.abs(r.phanTramTietKiem)}%` }} />
                              </div>
                              <span className={`text-xs font-semibold w-9 text-right ${r.phanTramTietKiem >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {r.phanTramTietKiem >= 0 ? "+" : ""}{r.phanTramTietKiem}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </details>

          {/* ── 2. HIỆU SUẤT NGƯỜI DÙNG ── */}
          <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden group" open>
            <summary className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-users text-indigo-500" />
                Hiệu suất người dùng
              </span>
              <i className="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            {extraLoading ? (
              <div className="py-8 text-center text-xs text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-1" />Đang tải...</div>
            ) : hieuSuatData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th className="px-5 py-3 text-left">Người dùng</th>
                      <th className="px-5 py-3 text-right">Tổng bước</th>
                      <th className="px-5 py-3 text-right">Hoàn thành</th>
                      <th className="px-5 py-3 text-right">Quá hạn</th>
                      <th className="px-5 py-3 text-right">Giờ TB</th>
                      <th className="px-5 py-3 text-right">Tỉ lệ quá hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hieuSuatData.map((u) => (
                      <tr key={u.nguoiDungId} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{u.hoTen.charAt(0)}</div>
                            <div>
                              <div className="text-slate-800 font-medium text-sm">{u.hoTen}</div>
                              <div className="text-[10px] text-slate-400">{u.tenDangNhap}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-700 font-semibold">{u.tongBuocXuLy}</td>
                        <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{u.soBuocHoanThanh}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.soBuocQuaHan > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                          }`}>{u.soBuocQuaHan}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-700">{u.thoiGianXuLyTrungBinhGio > 0 ? `${u.thoiGianXuLyTrungBinhGio}h` : "—"}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.tiLeQuaHan > 30 ? "bg-red-100 text-red-600" :
                            u.tiLeQuaHan > 10 ? "bg-amber-100 text-amber-700" :
                            "bg-emerald-100 text-emerald-700"
                          }`}>{u.tiLeQuaHan}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>

          {/* ── 3. DASHBOARD WORKFLOW BOTTLENECK ── */}
          <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden group" open>
            <summary className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <i className="fa-solid fa-gauge-high text-orange-500" />
                Dashboard workflow — điểm nghẽn
              </span>
              <i className="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            {extraLoading ? (
              <div className="py-8 text-center text-xs text-slate-400"><i className="fa-solid fa-circle-notch fa-spin mr-1" />Đang tải...</div>
            ) : bottleneckData.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có dữ liệu.</div>
            ) : (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bottleneckData.map((b) => {
                  const warnColor = b.mucDoCanhBao === "CRITICAL" ? "border-red-400 bg-red-50" :
                    b.mucDoCanhBao === "WARN" ? "border-amber-400 bg-amber-50" : "border-emerald-300 bg-emerald-50";
                  const badgeColor = b.mucDoCanhBao === "CRITICAL" ? "bg-red-500" :
                    b.mucDoCanhBao === "WARN" ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <div key={b.tenBuoc} className={`rounded-xl border-2 p-4 ${warnColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-800">{b.tenBuoc}</span>
                        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${badgeColor}`}>
                          {b.mucDoCanhBao}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-slate-400">Tổng:</span> <span className="font-semibold text-slate-700">{b.tongSo}</span></div>
                        <div><span className="text-slate-400">Hoàn thành:</span> <span className="font-semibold text-emerald-700">{b.hoanThanh}</span></div>
                        <div><span className="text-slate-400">Đang xử lý:</span> <span className="font-semibold text-blue-700">{b.dangXuLy}</span></div>
                        <div><span className="text-slate-400">Chờ duyệt:</span> <span className="font-semibold text-amber-700">{b.choDuyet}</span></div>
                        <div><span className="text-slate-400">Quá hạn:</span> <span className="font-semibold text-red-600">{b.quaHan}</span></div>
                        <div><span className="text-slate-400">Giờ TB:</span> <span className="font-semibold text-slate-700">{b.thoiGianTrungBinhGio > 0 ? `${b.thoiGianTrungBinhGio}h` : "—"}</span></div>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                        {b.tongSo > 0 && (
                          <>
                            <div className="h-full bg-emerald-500" style={{ width: `${(b.hoanThanh / b.tongSo) * 100}%` }} />
                            <div className="h-full bg-blue-500" style={{ width: `${(b.dangXuLy / b.tongSo) * 100}%` }} />
                            <div className="h-full bg-amber-400" style={{ width: `${(b.choDuyet / b.tongSo) * 100}%` }} />
                            <div className="h-full bg-red-500" style={{ width: `${(b.quaHan / b.tongSo) * 100}%` }} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </details>

          <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden group" open>
            <summary className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm">Báo cáo chi tiết theo đơn vị</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => exportCurrent("Excel")} className="flex items-center gap-1.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-medium px-3 py-1.5 rounded-lg">
                    <i className="fa-solid fa-file-excel" /> Xuất Excel
                  </button>
                  <button onClick={() => exportCurrent("PDF")} className="flex items-center gap-1.5 border border-red-400 text-red-500 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg">
                    <i className="fa-solid fa-file-pdf" /> Xuất PDF
                  </button>
                </div>
                <i className="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Đơn vị</th>
                    <th className="px-5 py-3 text-right">Số gói</th>
                    <th className="px-5 py-3 text-right">Tổng giá trị</th>
                    <th className="px-5 py-3 text-right">Hoàn thành</th>
                    <th className="px-5 py-3 text-right">Đang xử lý</th>
                    <th className="px-5 py-3 text-right">Trễ hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unitRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">Không có dữ liệu</td></tr>
                  ) : (
                    unitRows.map((row) => (
                      <tr key={row.unit} onClick={() => setSelectedUnit(row.unit)} className={`cursor-pointer hover:bg-slate-50 ${panelUnit === row.unit ? "bg-blue-50" : ""}`}>
                        <td className="px-5 py-3 text-slate-800 font-medium">{row.unit}</td>
                        <td className="px-5 py-3 text-right text-slate-700">{row.count}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">{formatCurrency(row.total)}</td>
                        <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{row.done}</td>
                        <td className="px-5 py-3 text-right text-blue-700 font-semibold">{row.prog}</td>
                        <td className="px-5 py-3 text-right text-red-500 font-semibold">{row.late || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </details>

          {/* Danh sách gói thầu chi tiết */}
          <details className="bg-white rounded-2xl border border-slate-200 overflow-hidden group" open>
            <summary className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-slate-50 transition-colors">
              <span className="font-semibold text-slate-800 text-sm">Danh sách gói thầu</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{filteredPackages.length} gói</span>
                <i className="fa-solid fa-chevron-down text-xs text-slate-400 transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Mã gói</th>
                    <th className="px-5 py-3 text-left">Tên gói thầu</th>
                    <th className="px-5 py-3 text-left">Đơn vị</th>
                    <th className="px-5 py-3 text-left">Hình thức</th>
                    <th className="px-5 py-3 text-right">Giá trị</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Graph</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPackages.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">Không có gói thầu</td></tr>
                  ) : (
                    filteredPackages.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold whitespace-nowrap">{p.id}</td>
                        <td className="px-5 py-3 text-slate-800 max-w-[200px]"><div className="line-clamp-2">{p.name}</div></td>
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{p.unit}</td>
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{p.method}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700 whitespace-nowrap">{formatCurrency(p.value)}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.status === "Hoàn thành" ? "bg-emerald-100 text-emerald-700" :
                            p.status === "Trễ hạn" ? "bg-red-100 text-red-600" :
                            p.status === "Đang xử lý" ? "bg-blue-100 text-blue-700" :
                            p.status === "Chờ duyệt" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>{p.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setGraphTarget(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:border-blue-200 hover:bg-blue-100"
                            title="Xem graph quy trình"
                          >
                            <i className="fa-solid fa-diagram-project text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </details>
        </main>

        {/* BaoCao side panel — chỉ hiện khi chọn đơn vị */}
        {selectedUnit && (
        <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white hidden xl:block p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold text-slate-400 tracking-wide">CHI TIẾT ĐƠN VỊ</div>
            <button onClick={() => setSelectedUnit("")} className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Đóng">
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-bold text-slate-900 mb-1">{panelUnit || "Chưa chọn"}</div>
            <div className="text-xs text-slate-500 leading-relaxed mb-4">
              {panelRows[0]?.name ?? "Không có gói thầu"}
            </div>
            <div className="space-y-2 text-xs">
              {[
                ["Số gói", panelRows.length],
                ["Tổng giá trị", `${formatCurrency(panelRows.reduce((sum, item) => sum + item.value, 0))} đ`],
                ["Hoàn thành", panelRows.filter((item) => item.status === "Hoàn thành").length],
                ["Đang xử lý", panelRows.filter((item) => item.status === "Đang xử lý" || item.status === "Chờ duyệt").length],
                ["Trễ hạn", panelRows.filter((item) => item.status === "Trễ hạn").length],
                ["Tỷ lệ hoàn thành", `${completionRate}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-800 text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          {/* So sánh: xếp hạng giữa các khoa */}
          <div className="rounded-2xl border border-slate-200 p-4 mt-3">
            <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">SO SÁNH KHOA</div>
            <div className="space-y-2 text-xs">
              {unitRows.filter((r) => r.unit !== panelUnit).slice(0, 5).map((r) => {
                const rate = r.count > 0 ? Math.round((r.done / r.count) * 100) : 0;
                const diff = rate - completionRate;
                return (
                  <div key={r.unit} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                    <span className="text-slate-700 truncate max-w-[140px]">{r.unit}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold text-slate-700">{rate}%</span>
                      <span className={`text-[10px] font-bold ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {diff >= 0 ? "+" : ""}{diff}%
                      </span>
                    </div>
                  </div>
                );
              })}
              {unitRows.filter((r) => r.unit !== panelUnit).length === 0 && (
                <p className="text-slate-400 italic">Chỉ có 1 đơn vị</p>
              )}
            </div>
          </div>
          {/* Danh sách gói thầu trong đơn vị */}
          <div className="rounded-2xl border border-slate-200 p-4 mt-3">
            <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">DANH SÁCH GÓI THẦU</div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {panelRows.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có gói thầu.</p>
              ) : (
                panelRows.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.id}</div>
                    </div>
                    <span className={`shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      p.status === "Hoàn thành" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "Trễ hạn" ? "bg-red-100 text-red-600" :
                      p.status === "Đang xử lý" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
        )}
      </div>
      <WorkflowGraphModal
        tender={graphTarget ? {
          internalId: graphTarget.internalId,
          maGoiThau: graphTarget.id,
          tenGoiThau: graphTarget.name,
        } : null}
        onClose={() => setGraphTarget(null)}
      />
    </>
  );
}
