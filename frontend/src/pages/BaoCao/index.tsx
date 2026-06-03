import { useState } from "react";
import { toast } from "sonner";
import { TaoBaoCaoModal } from "./TaoBaoCaoModal";

const KPI = [
  {
    icon: "fa-sack-dollar",
    color: "blue",
    label: "TỔNG GIÁ TRỊ",
    val: "13.7 tỷ",
    sub: "năm 2025",
    valCls: "text-blue-700",
  },
  {
    icon: "fa-piggy-bank",
    color: "green",
    label: "TIẾT KIỆM",
    val: "842 tr",
    sub: "+6.2% vs KH",
    valCls: "text-emerald-600",
  },
  {
    icon: "fa-clock-rotate-left",
    color: "purple",
    label: "TỈ LỆ ĐÚNG HẠN",
    val: "79%",
    sub: "gói đúng tiến độ",
    valCls: "text-purple-700",
  },
  {
    icon: "fa-calendar-days",
    color: "amber",
    label: "TRUNG BÌNH / GÓI",
    val: "18 ngày",
    sub: "từ yêu cầu → ký",
    valCls: "text-amber-600",
  },
];

type IconColor = "blue" | "green" | "purple" | "amber" | "red";

const ICON_BG: Record<IconColor, string> = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-700",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-500",
};

const DIST = [
  {
    label: "Chỉ định thầu tự quyết định",
    count: 9,
    color: "green",
    pct: "37.5%",
    bar: "bg-emerald-500",
  },
  {
    label: "Chỉ định thầu rút gọn",
    count: 7,
    color: "blue",
    pct: "29.2%",
    bar: "bg-blue-500",
  },
  {
    label: "Chỉ định thầu thông thường",
    count: 4,
    color: "purple",
    pct: "16.7%",
    bar: "bg-purple-500",
  },
  {
    label: "Chào hàng cạnh tranh",
    count: 3,
    color: "amber",
    pct: "12.5%",
    bar: "bg-amber-500",
  },
  {
    label: "Đấu thầu rộng rãi",
    count: 1,
    color: "red",
    pct: "4.2%",
    bar: "bg-red-500",
  },
];

const MONTHS = [
  "T1",
  "T2",
  "T3",
  "T4",
  "T5",
  "T6",
  "T7",
  "T8",
  "T9",
  "T10",
  "T11",
  "T12",
];
const CHART_DATA = [3, 5, 2, 4, 6, 3, 0, 0, 0, 0, 0, 0];

export default function BaoCao() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Báo cáo &amp; Thống kê
        </h1>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              9
            </span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus text-xs" /> Tạo báo cáo
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {KPI.map((k) => (
              <div
                key={k.label}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${ICON_BG[k.color as IconColor]}`}
                >
                  <i className={`fa-solid ${k.icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">
                    {k.label}
                  </div>
                  <div className={`text-2xl font-extrabold ${k.valCls}`}>
                    {k.val}
                  </div>
                  <div className="text-xs text-slate-400">{k.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CHART + DISTRIBUTION */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Bar chart (CSS-only) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-800">
                  Gói thầu theo tháng – 2025
                </span>
                <span className="text-xs text-slate-400">Tổng 23 gói</span>
              </div>
              <div className="flex items-end gap-2 h-36">
                {CHART_DATA.map((n, i) => {
                  const maxH = Math.max(...CHART_DATA);
                  const hPct =
                    maxH > 0 && n > 0 ? Math.round((n / maxH) * 100) : 0;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      {n > 0 && (
                        <span className="text-[10px] text-slate-500">{n}</span>
                      )}
                      <div
                        className="w-full rounded-t-sm bg-blue-500 transition-all"
                        style={{ height: `${hPct}%`, minHeight: n > 0 ? 4 : 0 }}
                      />
                      <span className="text-[10px] text-slate-400">
                        {MONTHS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DISTRIBUTION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-semibold text-slate-800 mb-4">
                Phân bổ theo hình thức
              </div>
              <div className="space-y-3">
                {DIST.map((d) => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700">{d.label}</span>
                      <span className="font-semibold text-slate-800">
                        {d.count} gói ({d.pct})
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${d.bar}`}
                        style={{ width: d.pct }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EXPORT + SUMMARY TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">
                Báo cáo chi tiết theo đơn vị
              </span>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                  <i className="fa-solid fa-file-excel" /> Xuất Excel
                </button>
                <button className="flex items-center gap-1.5 border border-red-400 text-red-500 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
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
                  {[
                    ["Khoa Dược", 12, "9,400,000,000", 7, 4, 1],
                    ["P.HCQT", 7, "1,650,000,000", 4, 2, 1],
                    ["Khoa Nội", 3, "1,920,000,000", 2, 1, 0],
                    ["Khoa Ngoại", 1, "730,000,000", 0, 1, 0],
                  ].map(([unit, count, total, done, prog, late]) => (
                    <tr key={unit} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-800 font-medium">
                        {unit}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-700">
                        {count}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-700">
                        {total}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-emerald-700 font-semibold">
                          {done}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-blue-700 font-semibold">
                          {prog}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(late as number) > 0 ? (
                          <span className="text-red-500 font-semibold">
                            {late}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* DETAIL PANEL (empty placeholder) */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white hidden xl:flex flex-col items-center justify-center text-slate-400 text-sm text-center p-5">
          <i className="fa-solid fa-chart-bar text-4xl mb-3 text-slate-200" />
          <p>Chọn một gói thầu từ bảng để xem biểu đồ chi tiết</p>
        </aside>
      </div>

      {modalOpen && (
        <TaoBaoCaoModal
          onSave={(values) => {
            toast.success(`Đã tạo báo cáo "${values.tenBaoCao}"`);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
