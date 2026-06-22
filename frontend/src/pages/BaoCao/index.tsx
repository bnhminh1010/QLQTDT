import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import { searchBaoCaoGoiThau } from "@/services/baoCaoApi";

type TimeMode = "day" | "month" | "year";

type PackageReport = {
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const result = await searchBaoCaoGoiThau({ page: 1, pageSize: 200 });
        const mapped: PackageReport[] = result.items.map((item) => ({
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
        setPackages(mapped);
      } catch {
        toast.error("Không thể tải dữ liệu báo cáo");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    toast.success(`Xuất ${type} ${filteredPackages.length} gói thầu`);
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

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="grid grid-cols-1 2xl:grid-cols-[220px_1fr_170px_220px_auto] gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-slate-500">Đơn vị/Khoa phòng</label>
                <SelectField
                  value={unitFilter}
                  onValueChange={(value) => { setUnitFilter(value); if (value !== "Tất cả") setSelectedUnit(value); }}
                  options={[
                    { value: "Tất cả", label: "Tất cả" },
                    ...allUnits.map((unit) => ({ value: unit, label: unit })),
                  ]}
                  triggerClassName="mt-1 h-10 bg-white"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">Thời gian thống kê</div>
                <div className="mt-1 rounded-xl border border-slate-200 p-2">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="radio" checked={timeMode === "day"} onChange={() => setTimeMode("day")} /> Theo ngày
                    </label>
                    {timeMode === "day" && (
                      <>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2" />
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2" />
                      </>
                    )}
                    <label className="flex items-center gap-1.5">
                      <input type="radio" checked={timeMode === "month"} onChange={() => setTimeMode("month")} /> Theo tháng
                    </label>
                    {timeMode === "month" && (
                      <>
                        <SelectField value={month} onValueChange={setMonth}
                          options={Array.from({ length: 12 }, (_, i) => `${i + 1}`).map((item) => ({ value: item, label: `Tháng ${item}` }))}
                          triggerClassName="h-8 w-[112px] rounded-lg bg-white px-2" />
                        <SelectField value={year} onValueChange={setYear}
                          options={["2025", "2026"].map((item) => ({ value: item, label: item }))}
                          triggerClassName="h-8 w-[92px] rounded-lg bg-white px-2" />
                      </>
                    )}
                    <label className="flex items-center gap-1.5">
                      <input type="radio" checked={timeMode === "year"} onChange={() => setTimeMode("year")} /> Theo năm
                    </label>
                    {timeMode === "year" && (
                      <SelectField value={year} onValueChange={setYear}
                        options={["2025", "2026"].map((item) => ({ value: item, label: item }))}
                        triggerClassName="h-8 w-[92px] rounded-lg bg-white px-2" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
                <SelectField value={statusFilter} onValueChange={setStatusFilter}
                  options={[{ value: "Tất cả", label: "Tất cả" }, ...allStatusesVn.map((item) => ({ value: item, label: item }))]}
                  triggerClassName="mt-1 h-10 bg-white" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Loại hình đấu thầu</label>
                <SelectField value={methodFilter} onValueChange={setMethodFilter}
                  options={[{ value: "Tất cả", label: "Tất cả" }, ...allMethods.map((item) => ({ value: item, label: item }))]}
                  triggerClassName="mt-1 h-10 bg-white" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => toast.success("Đã áp dụng bộ lọc")} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Áp dụng</button>
                <button onClick={resetFilters} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">Đặt lại</button>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpi.map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${ICON_BG[item.color]}`}>
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">{item.label}</div>
                  <div className={`text-2xl font-extrabold ${item.valCls}`}>{item.val}</div>
                  <div className="text-xs text-slate-400">{item.sub}</div>
                </div>
              </div>
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

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Báo cáo chi tiết theo đơn vị</span>
              <div className="flex gap-2">
                <button onClick={() => exportCurrent("Excel")} className="flex items-center gap-1.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-medium px-3 py-1.5 rounded-lg">
                  <i className="fa-solid fa-file-excel" /> Xuất Excel
                </button>
                <button onClick={() => exportCurrent("PDF")} className="flex items-center gap-1.5 border border-red-400 text-red-500 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg">
                  <i className="fa-solid fa-file-pdf" /> Xuất PDF
                </button>
              </div>
            </div>
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
          </div>
        </main>

        <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white hidden xl:block p-5">
          <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">CHI TIẾT ĐƠN VỊ</div>
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
        </aside>
      </div>
    </>
  );
}
