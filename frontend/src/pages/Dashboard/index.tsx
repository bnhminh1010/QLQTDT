import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

type TableRow = {
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
  steps: [DotState, string, string][];
};

const TABLE_ROWS: TableRow[] = [
  {
    code: "GT2025-001",
    name: "Mua sắm thiết bị y tế khoa Nội",
    unit: "Khoa Nội",
    status: "Đang xử lý",
    color: "blue",
    pct: "35.7%",
    txt: "5/14",
    nguonVon: "Ngân sách BV",
    ngayTao: "10/01/2025",
    hanHT: "30/04/2025",
    hinhThuc: "Chỉ định thầu rút gọn",
    steps: [
      ["done", "1. Đề xuất mua sắm", "K/p mua sắm"],
      ["done", "2. Tờ trình chủ trương", "K/p mua sắm"],
      ["done", "3. Đăng tải yêu cầu báo giá", "K/p mua sắm"],
      ["warn", "4. Biên bản kiểm tra báo giá", "Tổ kiểm tra giá"],
      ["idle", "5. Tờ trình phê duyệt dự toán", "K/p mua sắm"],
      ["idle", "6. QĐ phê duyệt dự toán", "Giám đốc BV"],
    ],
  },
  {
    code: "GT2025-002",
    name: "Sửa chữa hệ thống điện tầng 3",
    unit: "P.HCQT",
    status: "Hoàn thành",
    color: "green",
    pct: "100%",
    txt: "7/7",
    nguonVon: "Tự chủ tài chính",
    ngayTao: "15/01/2025",
    hanHT: "28/02/2025",
    hinhThuc: "Chỉ định thầu tự quyết định",
    steps: [
      ["done", "1. Đề xuất mua sắm", "K/p mua sắm"],
      ["done", "2. Tờ trình chủ trương", "K/p mua sắm"],
      ["done", "3. Đăng tải yêu cầu báo giá", "K/p mua sắm"],
      ["done", "4. Biên bản kiểm tra báo giá", "Tổ kiểm tra giá"],
      ["done", "5. Tờ trình phê duyệt dự toán", "K/p mua sắm"],
      ["done", "6. QĐ phê duyệt dự toán", "Giám đốc BV"],
      ["done", "7. Hoàn tất", "Ban giám đốc"],
    ],
  },
  {
    code: "GT2025-003",
    name: "Dịch vụ vệ sinh bệnh viện quý 3",
    unit: "P.HCQT",
    status: "Trễ hạn",
    color: "red",
    pct: "21.4%",
    txt: "3/14",
    nguonVon: "Tự chủ tài chính",
    ngayTao: "05/03/2025",
    hanHT: "29/03/2025",
    hinhThuc: "Chào hàng cạnh tranh",
    steps: [
      ["done", "1. Đề xuất mua sắm", "K/p mua sắm"],
      ["done", "2. Tờ trình chủ trương", "K/p mua sắm"],
      ["done", "3. Đăng tải yêu cầu báo giá", "K/p mua sắm"],
      ["warn", "4. Biên bản kiểm tra báo giá", "Tổ kiểm tra giá"],
      ["idle", "5. Tờ trình phê duyệt dự toán", "K/p mua sắm"],
    ],
  },
  {
    code: "GT2025-004",
    name: "Mua sắm thuốc điều trị ung thư",
    unit: "Khoa Dược",
    status: "Chờ duyệt",
    color: "amber",
    pct: "7.7%",
    txt: "2/26",
    nguonVon: "Ngân sách Nhà nước",
    ngayTao: "20/03/2025",
    hanHT: "30/06/2025",
    hinhThuc: "Đấu thầu rộng rãi",
    steps: [
      ["done", "1. Đề xuất mua sắm", "K/p mua sắm"],
      ["warn", "2. Tờ trình chủ trương", "K/p mua sắm"],
      ["idle", "3. Đăng tải yêu cầu báo giá", "K/p mua sắm"],
      ["idle", "4. Biên bản kiểm tra báo giá", "Tổ kiểm tra giá"],
    ],
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    icon: "fa-triangle-exclamation",
    color: "text-red-500 bg-red-50",
    title: "GT2025-003 trễ hạn 21 ngày",
    time: "Vừa xong",
    read: false,
  },
  {
    id: 2,
    icon: "fa-circle-check",
    color: "text-emerald-500 bg-emerald-50",
    title: "GT2025-002 đã hoàn thành",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: 3,
    icon: "fa-file-lines",
    color: "text-blue-500 bg-blue-50",
    title: "GT2025-001 cần duyệt tờ trình",
    time: "5 giờ trước",
    read: true,
  },
  {
    id: 4,
    icon: "fa-bell",
    color: "text-amber-500 bg-amber-50",
    title: "GT2025-004 đang chờ phê duyệt",
    time: "Hôm qua",
    read: true,
  },
  {
    id: 5,
    icon: "fa-circle-info",
    color: "text-slate-500 bg-slate-100",
    title: "Hệ thống cập nhật v1.2.0",
    time: "2 ngày trước",
    read: true,
  },
];

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(2);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const selected = TABLE_ROWS[selectedIdx];
  const unreadCount = notifs.filter((n) => !n.read).length;

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
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
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
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() =>
                        setNotifs((prev) =>
                          prev.map((x) =>
                            x.id === n.id ? { ...x, read: true } : x,
                          ),
                        )
                      }
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${n.color}`}
                      >
                        <i className={`fa-solid ${n.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}
                        >
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {n.time}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/tao-goi-thau")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
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
              ["fa-box-archive", "gray", "TỔNG GÓI THẦU", "24", "năm 2025", "text-slate-800"],
              ["fa-hourglass-half", "blue", "ĐANG XỬ LÝ", "8", "gói", "text-blue-600"],
              ["fa-triangle-exclamation", "red", "TRỄ HẠN", "3", "cần xử lý gấp", "text-red-500"],
              ["fa-circle-check", "green", "HOÀN THÀNH", "13", "gói", "text-emerald-600"],
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
                  <div className={`text-2xl font-extrabold ${valCls}`}>{val}</div>
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
                  {TABLE_ROWS.map((row, idx) => (
                    <tr
                      key={row.code}
                      onClick={() => setSelectedIdx(idx)}
                      className={`cursor-pointer transition-colors ${row.status === "Trễ hạn" ? "bg-red-50/40" : ""} ${selectedIdx === idx ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold">
                        {row.code}
                      </td>
                      <td className="px-5 py-3 text-slate-800">{row.name}</td>
                      <td className="px-5 py-3 text-slate-500">{row.unit}</td>
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
                ["blue", "fa-regular fa-file-lines", "Tờ trình phê duyệt dự toán – GT2025-001", "Chờ Giám đốc BV ký duyệt · Hạn: 12/05/2025", "Chờ duyệt", false],
                ["orange", "fa-solid fa-triangle-exclamation", "Biên bản kiểm tra báo giá – GT2025-003", "Trễ 21 ngày · Tổ kiểm tra giá chưa xử lý", "Trễ hạn", true],
                ["blue", "fa-regular fa-file-lines", "Tờ trình chủ trương – GT2025-004", "Chờ Giám đốc BV ký duyệt · Hạn: 13/05/2025", "Chờ duyệt", false],
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

        {/* DETAIL PANEL — dynamic based on selected row */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <div className="font-mono text-xs font-bold text-blue-700 mb-1">
            {selected.code}
          </div>
          <div className="text-sm font-bold text-slate-900 mb-0.5">
            {selected.name}
          </div>
          <div className="text-xs text-slate-400 mb-3">{selected.unit}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {selected.hinhThuc}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[selected.status]}`}
            >
              {selected.status}
            </span>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Tiến độ quy trình</span>
            <span>
              {selected.txt} bước ({selected.pct})
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${BAR_COLOR[selected.color]}`}
              style={{ width: selected.pct }}
            />
          </div>

          {/* Meta */}
          <div className="space-y-2 mb-5">
            {(
              [
                ["Nguồn vốn", selected.nguonVon, ""],
                ["Ngày tạo", selected.ngayTao, ""],
                ["Hạn hoàn thành", selected.hanHT, selected.status === "Trễ hạn" ? "text-red-500" : ""],
              ] as [string, string, string][]
            ).map(([lbl, val, cls]) => (
              <div key={lbl} className="flex justify-between text-xs">
                <span className="text-slate-400">{lbl}</span>
                <span className={`font-semibold text-slate-800 ${cls}`}>
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
            {selected.steps.map(([state, name, sub]) => (
              <div key={name} className="flex items-start gap-2.5">
                <Dot state={state} />
                <div>
                  <div className="text-xs font-medium text-slate-800">{name}</div>
                  <div className="text-[11px] text-slate-400">{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/danh-sach-goi-thau")}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors"
          >
            <i className="fa-solid fa-arrow-right text-xs" /> Xem chi tiết
          </button>
        </aside>
      </div>
    </>
  );
}
