type BadgeStatus = "Đang xử lý" | "Hoàn thành" | "Trễ hạn" | "Chờ duyệt";
type BarColor = "blue" | "green" | "red" | "amber";
type DotState = "done" | "warn" | "idle";

const BADGE: Record<BadgeStatus, string> = {
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
};
const BAR_COLOR: Record<BarColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
};
const DOT_CLS: Record<DotState, string> = {
  done: "bg-emerald-500 text-white",
  warn: "bg-amber-500 text-white",
  idle: "bg-slate-200",
};

type BadgeProps = { label: BadgeStatus };
type ProgBarProps = { color: BarColor; pct: string };
type DotProps = { state: DotState };

function Badge({ label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[label] ?? "bg-slate-100 text-slate-600"}`}
    >
      {label}
    </span>
  );
}

function ProgBar({ color, pct }: ProgBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${BAR_COLOR[color]}`}
          style={{ width: pct }}
        />
      </div>
    </div>
  );
}

function Dot({ state }: DotProps) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${DOT_CLS[state]}`}
    >
      {state === "done" && <i className="fa-solid fa-check" />}
      {state === "warn" && <i className="fa-solid fa-triangle-exclamation" />}
    </div>
  );
}

const STEPS = [
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

export default function Dashboard() {
  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-solid fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <i className="fa-solid fa-plus text-xs" /> Tạo gói thầu
          </button>
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
                "24",
                "năm 2025",
                "text-slate-800",
              ],
              [
                "fa-hourglass-half",
                "blue",
                "ĐANG XỬ LÝ",
                "8",
                "gói",
                "text-blue-600",
              ],
              [
                "fa-triangle-exclamation",
                "red",
                "TRỄ HẠN",
                "3",
                "cần xử lý gấp",
                "text-red-500",
              ],
              [
                "fa-circle-check",
                "green",
                "HOÀN THÀNH",
                "13",
                "gói",
                "text-emerald-600",
              ],
            ].map(([icon, color, lbl, val, sub, valCls]) => (
              <div
                key={lbl}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
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
              </div>
            ))}
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-sm">
                Gói thầu cần chú ý
              </span>
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
                  {[
                    [
                      "GT2025-001",
                      "Mua sắm thiết bị y tế khoa Nội",
                      "Khoa Nội",
                      "Đang xử lý",
                      "blue",
                      "35.7%",
                      "5/14",
                    ],
                    [
                      "GT2025-002",
                      "Sửa chữa hệ thống điện tầng 3",
                      "P.HCQT",
                      "Hoàn thành",
                      "green",
                      "100%",
                      "7/7",
                    ],
                    [
                      "GT2025-003",
                      "Dịch vụ vệ sinh bệnh viện quý 3",
                      "P.HCQT",
                      "Trễ hạn",
                      "red",
                      "21.4%",
                      "3/14",
                    ],
                    [
                      "GT2025-004",
                      "Mua sắm thuốc điều trị ung thư",
                      "Khoa Dược",
                      "Chờ duyệt",
                      "amber",
                      "7.7%",
                      "2/26",
                    ],
                  ].map(([code, name, unit, status, color, pct, txt]) => (
                    <tr
                      key={code}
                      className={`hover:bg-slate-50 ${status === "Trễ hạn" ? "bg-red-50/40" : ""}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold">
                        {code}
                      </td>
                      <td className="px-5 py-3 text-slate-800">{name}</td>
                      <td className="px-5 py-3 text-slate-500">{unit}</td>
                      <td className="px-5 py-3">
                        <Badge label={status as BadgeStatus} />
                      </td>
                      <td className="px-5 py-3">
                        <ProgBar
                          color={color as BarColor}
                          pct={pct as string}
                        />
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          {txt}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* APPROVAL */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-sm">
                Bước cần phê duyệt hôm nay
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                [
                  "blue",
                  "fa-regular fa-file-lines",
                  "Tờ trình phê duyệt dự toán – GT2025-001",
                  "Chờ Giám đốc BV ký duyệt · Hạn: 12/05/2025",
                  "Chờ duyệt",
                  false,
                ],
                [
                  "orange",
                  "fa-solid fa-triangle-exclamation",
                  "Biên bản kiểm tra báo giá – GT2025-003",
                  "Trễ 21 ngày · Tổ kiểm tra giá chưa xử lý",
                  "Trễ hạn",
                  true,
                ],
                [
                  "blue",
                  "fa-regular fa-file-lines",
                  "Tờ trình chủ trương – GT2025-004",
                  "Chờ Giám đốc BV ký duyệt · Hạn: 13/05/2025",
                  "Chờ duyệt",
                  false,
                ],
              ].map(([color, icon, title, meta, status, overdue]) => (
                <div
                  key={title as string}
                  className={`flex items-center gap-4 px-5 py-4 ${overdue ? "bg-red-50/30" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color === "blue" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-500"}`}
                  >
                    <i className={icon as string} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {title}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${overdue ? "text-red-500" : "text-slate-400"}`}
                    >
                      {meta}
                    </div>
                  </div>
                  <Badge label={status as BadgeStatus} />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* DETAIL PANEL */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <div className="font-mono text-xs font-bold text-blue-700 mb-1">
            GT2025-003
          </div>
          <div className="text-sm font-bold text-slate-900 mb-0.5">
            Dịch vụ vệ sinh bệnh viện quý 3
          </div>
          <div className="text-xs text-slate-400 mb-3">P.HCQT</div>
          <div className="flex flex-wrap gap-1.5 mb-5">
            <span className="text-xs border border-slate-300 text-slate-600 px-2 py-0.5 rounded-full">
              Chào hàng cạnh tranh
            </span>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              Trễ hạn
            </span>
          </div>
          <div className="space-y-2 mb-5">
            {[
              ["Giá trị", "850,000,000 đ", ""],
              ["Nguồn vốn", "Tự chủ tài chính", ""],
              ["Ngày tạo", "05/03/2025", "font-semibold"],
              ["Hạn hoàn thành", "29/03/2025", "font-semibold text-red-500"],
            ].map(([lbl, val, cls]) => (
              <div key={lbl} className="flex justify-between text-xs">
                <span className="text-slate-400">{lbl}</span>
                <span className={`text-slate-800 ${cls}`}>{val}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Tiến độ quy trình</span>
            <span>3/14 bước (21%)</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: "21%" }}
            />
          </div>

          <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
            CÁC BƯỚC QUY TRÌNH
          </div>
          <div className="space-y-3">
            {STEPS.map(([state, name, sub]) => (
              <div key={name} className="flex items-start gap-2.5">
                <Dot state={state as DotState} />
                <div>
                  <div className="text-xs font-medium text-slate-800">
                    {name}
                  </div>
                  <div className="text-[11px] text-slate-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
