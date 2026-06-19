import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import {
  getCurrentMockReportAccount,
  getMockReportAccountByKey,
  setCurrentMockReportAccount,
} from "@/util/mockReportAccounts";

type RoleKey = "ADMIN" | "BGD" | "QLDT" | "KP" | "BCN";
type TimeMode = "day" | "month" | "year";

type ReportAccount = {
  key: RoleKey;
  label: string;
  role: string;
  unit?: string;
  canViewAll: boolean;
};

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

const ACCOUNTS: ReportAccount[] = [
  { key: "ADMIN", label: "Admin hệ thống", role: "ADMIN", canViewAll: true },
  { key: "BGD", label: "Ban Giám đốc", role: "BGĐ", canViewAll: true },
  { key: "QLDT", label: "Phòng QLĐT", role: "PHÒNG QLĐT", canViewAll: true },
  { key: "KP", label: "Khoa/Phòng - Khoa Nội", role: "K/P", unit: "Khoa Nội", canViewAll: false },
  { key: "BCN", label: "BCN Khoa Nội", role: "BCN", unit: "Khoa Nội", canViewAll: false },
];

const PACKAGES: PackageReport[] = [
  {
    id: "GT2025-001",
    name: "Mua sắm thiết bị y tế khoa Nội",
    unit: "Khoa Nội",
    method: "Đấu thầu rộng rãi",
    status: "Đang xử lý",
    value: 320_000_000,
    progress: "Đúng hạn",
    days: 16,
    saving: 22_000_000,
    createdAt: "2025-03-05",
  },
  {
    id: "GT2025-007",
    name: "Mua sắm máy siêu âm",
    unit: "Khoa Nội",
    method: "Chỉ định thầu rút gọn",
    status: "Hoàn thành",
    value: 850_000_000,
    progress: "Đúng hạn",
    days: 14,
    saving: 54_000_000,
    createdAt: "2025-04-12",
  },
  {
    id: "GT2025-008",
    name: "Vật tư tiêu hao khoa Nội",
    unit: "Khoa Nội",
    method: "Chào hàng cạnh tranh",
    status: "Hoàn thành",
    value: 1_230_000_000,
    progress: "Đúng hạn",
    days: 18,
    saving: 80_000_000,
    createdAt: "2025-05-18",
  },
  {
    id: "GT2025-004",
    name: "Mua sắm thuốc điều trị ung thư",
    unit: "Khoa Dược",
    method: "Đấu thầu rộng rãi",
    status: "Chờ duyệt",
    value: 7_000_000_000,
    progress: "Sắp quá hạn",
    days: 24,
    saving: 420_000_000,
    createdAt: "2025-03-22",
  },
  {
    id: "GT2025-009",
    name: "Mua sắm hóa chất xét nghiệm",
    unit: "Khoa Dược",
    method: "Chỉ định thầu thông thường",
    status: "Hoàn thành",
    value: 2_400_000_000,
    progress: "Đúng hạn",
    days: 17,
    saving: 140_000_000,
    createdAt: "2025-06-03",
  },
  {
    id: "GT2025-005",
    name: "Mua sắm vật tư tiêu hao khoa Ngoại",
    unit: "Khoa Ngoại",
    method: "Chỉ định thầu thông thường",
    status: "Đang xử lý",
    value: 730_000_000,
    progress: "Đúng hạn",
    days: 19,
    saving: 36_000_000,
    createdAt: "2025-05-02",
  },
  {
    id: "GT2025-003",
    name: "Dịch vụ vệ sinh bệnh viện quý 3",
    unit: "P.HCQT",
    method: "Chào hàng cạnh tranh",
    status: "Trễ hạn",
    value: 850_000_000,
    progress: "Quá hạn",
    days: 31,
    saving: 45_000_000,
    createdAt: "2025-03-05",
  },
  {
    id: "GT2025-002",
    name: "Sửa chữa hệ thống điện tầng 3",
    unit: "P.HCQT",
    method: "Chỉ định thầu tự quyết định",
    status: "Hoàn thành",
    value: 320_000_000,
    progress: "Đúng hạn",
    days: 13,
    saving: 45_000_000,
    createdAt: "2025-02-14",
  },
];

const ICON_BG: Record<IconColor, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-700",
  amber: "bg-amber-100 text-amber-600",
};

const STATUS_BADGE: Record<string, string> = {
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Trễ hạn": "bg-red-100 text-red-600",
};

const PROGRESS_BADGE: Record<PackageReport["progress"], string> = {
  "Đúng hạn": "text-emerald-700",
  "Sắp quá hạn": "text-amber-700",
  "Quá hạn": "text-red-600",
};

const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const UNITS = ["Khoa Nội", "Khoa Dược", "Khoa Ngoại", "P.HCQT"];
const STATUSES = ["Hoàn thành", "Đang xử lý", "Chờ duyệt", "Trễ hạn"];
const METHODS = Array.from(new Set(PACKAGES.map((item) => item.method)));

function formatMoney(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })} tỷ`;
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
  const body = rows.map((row) => [
    row.id,
    row.name,
    row.unit,
    row.method,
    row.value,
    row.status,
    row.progress,
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BaoCao() {
  const [accountKey, setAccountKey] = useState<RoleKey>(
    () => getCurrentMockReportAccount().key as RoleKey,
  );
  const [unitFilter, setUnitFilter] = useState("Tất cả");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [methodFilter, setMethodFilter] = useState("Tất cả");
  const [timeMode, setTimeMode] = useState<TimeMode>("day");
  const [fromDate, setFromDate] = useState("2025-01-01");
  const [toDate, setToDate] = useState("2025-12-31");
  const [month, setMonth] = useState("3");
  const [year, setYear] = useState("2025");
  const [selectedUnit, setSelectedUnit] = useState("P.HCQT");

  const account = ACCOUNTS.find((item) => item.key === accountKey) ?? ACCOUNTS[0];
  const scopedUnit = account.canViewAll ? unitFilter : account.unit ?? "Khoa Nội";

  const filteredPackages = useMemo(
    () =>
      PACKAGES.filter((item) => {
        const matchUnit = scopedUnit === "Tất cả" || item.unit === scopedUnit;
        const matchStatus = statusFilter === "Tất cả" || item.status === statusFilter;
        const matchMethod = methodFilter === "Tất cả" || item.method === methodFilter;
        return matchUnit && matchStatus && matchMethod && inRange(item, timeMode, fromDate, toDate, month, year);
      }),
    [fromDate, methodFilter, month, scopedUnit, statusFilter, timeMode, toDate, year],
  );

  const unitRows = useMemo(
    () =>
      UNITS.map((unit) => {
        const rows = filteredPackages.filter((item) => item.unit === unit);
        return {
          unit,
          count: rows.length,
          total: rows.reduce((sum, item) => sum + item.value, 0),
          done: rows.filter((item) => item.status === "Hoàn thành").length,
          prog: rows.filter((item) => item.status === "Đang xử lý" || item.status === "Chờ duyệt").length,
          late: rows.filter((item) => item.status === "Trễ hạn").length,
          topPackage: rows[0]?.name ?? "Chưa có gói thầu theo bộ lọc",
        };
      }).filter((row) => row.count > 0 || account.canViewAll),
    [account.canViewAll, filteredPackages],
  );

  const panelUnit =
    !account.canViewAll
      ? account.unit ?? "Khoa Nội"
      : scopedUnit !== "Tất cả"
        ? scopedUnit
        : selectedUnit;
  const panelRows = filteredPackages.filter((item) => item.unit === panelUnit);
  const totalValue = filteredPackages.reduce((sum, item) => sum + item.value, 0);
  const totalSaving = filteredPackages.reduce((sum, item) => sum + item.saving, 0);
  const onTime = filteredPackages.filter((item) => item.progress !== "Quá hạn").length;
  const avgDays =
    filteredPackages.length > 0
      ? Math.round(filteredPackages.reduce((sum, item) => sum + item.days, 0) / filteredPackages.length)
      : 0;
  const completionRate =
    panelRows.length > 0
      ? Math.round((panelRows.filter((item) => item.status === "Hoàn thành").length / panelRows.length) * 100)
      : 0;

  const monthlyData = MONTHS.map((_, index) =>
    filteredPackages.filter((item) => new Date(`${item.createdAt}T00:00:00`).getMonth() === index).length,
  );
  const maxMonth = Math.max(...monthlyData, 1);
  const methodRows = METHODS.map((method) => {
    const count = filteredPackages.filter((item) => item.method === method).length;
    const pct = filteredPackages.length > 0 ? Math.round((count / filteredPackages.length) * 100) : 0;
    return { method, count, pct };
  }).filter((item) => item.count > 0);

  const kpi = [
    {
      icon: "fa-sack-dollar",
      color: "blue" as IconColor,
      label: "TỔNG GIÁ TRỊ",
      val: formatMoney(totalValue),
      sub: account.canViewAll ? "theo bộ lọc hiện tại" : `chỉ ${account.unit}`,
      valCls: "text-blue-700",
    },
    {
      icon: "fa-piggy-bank",
      color: "green" as IconColor,
      label: "TIẾT KIỆM",
      val: formatMoney(totalSaving),
      sub: "theo dữ liệu đang xem",
      valCls: "text-emerald-600",
    },
    {
      icon: "fa-clock-rotate-left",
      color: "purple" as IconColor,
      label: "TỈ LỆ ĐÚNG HẠN",
      val: `${filteredPackages.length ? Math.round((onTime / filteredPackages.length) * 100) : 0}%`,
      sub: "gói đúng tiến độ",
      valCls: "text-purple-700",
    },
    {
      icon: "fa-calendar-days",
      color: "amber" as IconColor,
      label: "TRUNG BÌNH / GÓI",
      val: `${avgDays} ngày`,
      sub: "thời gian xử lý TB",
      valCls: "text-amber-600",
    },
  ];

  function resetFilters() {
    setUnitFilter("Tất cả");
    setStatusFilter("Tất cả");
    setMethodFilter("Tất cả");
    setTimeMode("day");
    setFromDate("2025-01-01");
    setToDate("2025-12-31");
    setMonth("3");
    setYear("2025");
    setSelectedUnit(account.canViewAll ? "P.HCQT" : account.unit ?? "Khoa Nội");
  }

  function handleAccountChange(value: RoleKey) {
    const nextAccount = ACCOUNTS.find((item) => item.key === value) ?? ACCOUNTS[0];
    setCurrentMockReportAccount(getMockReportAccountByKey(value));
    setAccountKey(value);
    setUnitFilter("Tất cả");
    setSelectedUnit(nextAccount.canViewAll ? "P.HCQT" : nextAccount.unit ?? "Khoa Nội");
  }

  function exportCurrent(type: "Excel" | "PDF") {
    if (type === "Excel") {
      downloadCsv(filteredPackages, `bao-cao-${account.role.toLowerCase()}-${Date.now()}.csv`);
    }
    toast.success(`Xuất ${type} theo đúng ${filteredPackages.length} gói thầu trong bộ lọc hiện tại`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Báo cáo &amp; Thống kê</h1>
        <div className="flex items-center gap-3">
          <SelectField
            value={accountKey}
            onValueChange={(value) => handleAccountChange(value as RoleKey)}
            options={ACCOUNTS.map((item) => ({
              value: item.key,
              label: item.label,
            }))}
            triggerClassName="h-9 rounded-lg bg-white font-medium text-slate-700"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="grid grid-cols-1 2xl:grid-cols-[220px_1fr_170px_220px_auto] gap-4 items-end">
              <div>
                <label className="text-xs font-semibold text-slate-500">Đơn vị/Khoa phòng</label>
                {account.canViewAll ? (
                  <SelectField
                    value={unitFilter}
                    onValueChange={(value) => {
                      setUnitFilter(value);
                      if (value !== "Tất cả") setSelectedUnit(value);
                    }}
                    options={[
                      { value: "Tất cả", label: "Tất cả" },
                      ...UNITS.map((unit) => ({ value: unit, label: unit })),
                    ]}
                    triggerClassName="mt-1 h-10 bg-white"
                  />
                ) : (
                  <div className="mt-1 h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 flex items-center">
                    {account.unit}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">Thời gian thống kê</div>
                <div className="mt-1 rounded-xl border border-slate-200 p-2">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <label className="flex items-center gap-1.5">
                      <input type="radio" checked={timeMode === "day"} onChange={() => setTimeMode("day")} />
                      Theo ngày
                    </label>
                    {timeMode === "day" && (
                      <>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2" />
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2" />
                      </>
                    )}
                    <label className="flex items-center gap-1.5">
                      <input type="radio" checked={timeMode === "month"} onChange={() => setTimeMode("month")} />
                      Theo tháng
                    </label>
                    {timeMode === "month" && (
                      <>
                        <SelectField
                          value={month}
                          onValueChange={setMonth}
                          options={Array.from({ length: 12 }, (_, i) => `${i + 1}`).map((item) => ({
                            value: item,
                            label: `Tháng ${item}`,
                          }))}
                          triggerClassName="h-8 w-[112px] rounded-lg bg-white px-2"
                        />
                        <SelectField
                          value={year}
                          onValueChange={setYear}
                          options={["2025", "2026"].map((item) => ({
                            value: item,
                            label: item,
                          }))}
                          triggerClassName="h-8 w-[92px] rounded-lg bg-white px-2"
                        />
                      </>
                    )}
                    <label className="flex items-center gap-1.5">
                      <input type="radio" checked={timeMode === "year"} onChange={() => setTimeMode("year")} />
                      Theo năm
                    </label>
                    {timeMode === "year" && (
                      <SelectField
                        value={year}
                        onValueChange={setYear}
                        options={["2025", "2026"].map((item) => ({
                          value: item,
                          label: item,
                        }))}
                        triggerClassName="h-8 w-[92px] rounded-lg bg-white px-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
                <SelectField
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={[
                    { value: "Tất cả", label: "Tất cả" },
                    ...STATUSES.map((item) => ({ value: item, label: item })),
                  ]}
                  triggerClassName="mt-1 h-10 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500">Loại hình đấu thầu</label>
                <SelectField
                  value={methodFilter}
                  onValueChange={setMethodFilter}
                  options={[
                    { value: "Tất cả", label: "Tất cả" },
                    ...METHODS.map((item) => ({ value: item, label: item })),
                  ]}
                  triggerClassName="mt-1 h-10 bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={() => toast.success("Đã áp dụng bộ lọc báo cáo")} className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                  Áp dụng
                </button>
                <button onClick={resetFilters} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Đặt lại
                </button>
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
                <span className="text-sm font-semibold text-slate-800">Gói thầu theo tháng - 2025</span>
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
                  <p className="text-sm text-slate-400">Không có dữ liệu theo bộ lọc.</p>
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
              <span className="font-semibold text-slate-800 text-sm">
                {account.canViewAll ? "Báo cáo chi tiết theo đơn vị" : "Báo cáo gói thầu"}
              </span>
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
              {account.canViewAll ? (
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
                    {unitRows.map((row) => (
                      <tr key={row.unit} onClick={() => setSelectedUnit(row.unit)} className={`cursor-pointer hover:bg-slate-50 ${panelUnit === row.unit ? "bg-blue-50" : ""}`}>
                        <td className="px-5 py-3 text-slate-800 font-medium">{row.unit}</td>
                        <td className="px-5 py-3 text-right text-slate-700">{row.count}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">{formatCurrency(row.total)}</td>
                        <td className="px-5 py-3 text-right text-emerald-700 font-semibold">{row.done}</td>
                        <td className="px-5 py-3 text-right text-blue-700 font-semibold">{row.prog}</td>
                        <td className="px-5 py-3 text-right text-red-500 font-semibold">{row.late || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                      <th className="px-5 py-3 text-left">Mã gói</th>
                      <th className="px-5 py-3 text-left">Tên gói</th>
                      <th className="px-5 py-3 text-left">Hình thức</th>
                      <th className="px-5 py-3 text-right">Giá trị</th>
                      <th className="px-5 py-3 text-left">Trạng thái</th>
                      <th className="px-5 py-3 text-left">Tiến độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPackages.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-blue-700">{row.id}</td>
                        <td className="px-5 py-3 text-slate-800">{row.name}</td>
                        <td className="px-5 py-3 text-slate-600">{row.method}</td>
                        <td className="px-5 py-3 text-right font-medium text-slate-700">{formatCurrency(row.value)}</td>
                        <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>{row.status}</span></td>
                        <td className={`px-5 py-3 font-semibold ${PROGRESS_BADGE[row.progress]}`}>{row.progress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>

        <aside className="w-[320px] shrink-0 border-l border-slate-200 bg-white hidden xl:block p-5">
          <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">CHI TIẾT ĐƠN VỊ</div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-bold text-slate-900 mb-1">{panelUnit}</div>
            <div className="text-xs text-slate-500 leading-relaxed mb-4">
              {panelRows[0]?.name ?? "Không có gói thầu theo bộ lọc hiện tại"}
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
