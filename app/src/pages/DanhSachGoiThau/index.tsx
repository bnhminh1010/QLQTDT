import { useState } from "react";

type TrangThai = "Đang xử lý" | "Hoàn thành" | "Trễ hạn" | "Chờ duyệt";
type HinhThuc =
  | "Chỉ định thầu rút gọn"
  | "Chỉ định thầu tự quyết định"
  | "Chỉ định thầu thông thường"
  | "Chào hàng cạnh tranh"
  | "Đấu thầu rộng rãi";
type DotState = "done" | "warn" | "idle";

const BADGE: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
};
const HT_BADGE: Record<HinhThuc, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};
const DOT_CLS: Record<DotState, string> = {
  done: "bg-emerald-500 text-white",
  warn: "bg-amber-500 text-white",
  idle: "bg-slate-200",
};

const BAR_COLOR: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-500",
  "Hoàn thành": "bg-emerald-500",
  "Trễ hạn": "bg-red-500",
  "Chờ duyệt": "bg-amber-500",
};
const TAG_COLOR: Record<TrangThai, string> = {
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
};

const ALL_ROWS = [
  {
    id: "GT2025-001",
    ten: "Mua sắm thiết bị y tế khoa Nội",
    hinhThuc: "Chỉ định thầu rút gọn",
    giaTriStr: "320,000,000",
    donVi: "Khoa Nội",
    trangThai: "Đang xử lý",
    detail: {
      nguonVon: "Ngân sách BV",
      ngayTao: "10/01/2025",
      hanHT: "30/04/2025",
      pct: "35.7%",
      bước: "5/14",
    },
  },
  {
    id: "GT2025-002",
    ten: "Sửa chữa hệ thống điện tầng 3",
    hinhThuc: "Chỉ định thầu tự quyết định",
    giaTriStr: "38,000,000",
    donVi: "P.HCQT",
    trangThai: "Hoàn thành",
    detail: {
      nguonVon: "Tự chủ tài chính",
      ngayTao: "15/01/2025",
      hanHT: "28/02/2025",
      pct: "100%",
      bước: "7/7",
    },
  },
  {
    id: "GT2025-003",
    ten: "Dịch vụ vệ sinh bệnh viện quý 3",
    hinhThuc: "Chào hàng cạnh tranh",
    giaTriStr: "850,000,000",
    donVi: "P.HCQT",
    trangThai: "Trễ hạn",
    detail: {
      nguonVon: "Tự chủ tài chính",
      ngayTao: "05/03/2025",
      hanHT: "29/03/2025",
      pct: "21%",
      bước: "3/14",
    },
  },
  {
    id: "GT2025-004",
    ten: "Mua sắm thuốc điều trị ung thư",
    hinhThuc: "Đấu thầu rộng rãi",
    giaTriStr: "12,500,000,000",
    donVi: "Khoa Dược",
    trangThai: "Chờ duyệt",
    detail: {
      nguonVon: "Ngân sách Nhà nước",
      ngayTao: "20/03/2025",
      hanHT: "30/06/2025",
      pct: "7.7%",
      bước: "2/26",
    },
  },
];

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

type BadgeProps = { label: string; cls: string };
type DotProps = { state: DotState };

function Badge({ label, cls }: BadgeProps) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {label}
    </span>
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

function DanhSachGoiThau() {
  const [selected, setSelected] = useState(ALL_ROWS[2]);
  const [search, setSearch] = useState("");
  const [filterHT, setFilterHT] = useState("");
  const [filterTT, setFilterTT] = useState("");

  const filtered = ALL_ROWS.filter(
    (r) =>
      r.ten.toLowerCase().includes(search.toLowerCase()) &&
      (filterHT === "" || r.hinhThuc === filterHT) &&
      (filterTT === "" || r.trangThai === filterTT),
  );

  const barColor = BAR_COLOR;
  const tagColor = TAG_COLOR;

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh sách gói thầu
        </h1>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              9
            </span>
          </button>
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <i className="fa-solid fa-plus text-xs" /> Tạo gói thầu
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* FILTER BAR */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Tìm tên gói thầu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterHT}
              onChange={(e) => setFilterHT(e.target.value)}
              className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
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
              className="border border-slate-200 rounded-xl text-sm px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
            >
              <option value="">Tất cả trạng thái</option>
              <option>Đang xử lý</option>
              <option>Hoàn thành</option>
              <option>Trễ hạn</option>
              <option>Chờ duyệt</option>
            </select>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Mã gói</th>
                    <th className="px-5 py-3 text-left">Tên gói thầu</th>
                    <th className="px-5 py-3 text-left">Hình thức</th>
                    <th className="px-5 py-3 text-right">Giá trị (VNĐ)</th>
                    <th className="px-5 py-3 text-left">Đơn vị</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={`cursor-pointer transition-colors ${row.trangThai === "Trễ hạn" ? "bg-red-50/30" : ""} ${selected?.id === row.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold whitespace-nowrap">
                        {row.id}
                      </td>
                      <td className="px-5 py-3 text-slate-800">{row.ten}</td>
                      <td className="px-5 py-3">
                        <Badge
                          label={row.hinhThuc}
                          cls={
                            HT_BADGE[row.hinhThuc as HinhThuc] ??
                            "bg-slate-100 text-slate-600"
                          }
                        />
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-700">
                        {row.giaTriStr}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{row.donVi}</td>
                      <td className="px-5 py-3">
                        <Badge
                          label={row.trangThai}
                          cls={
                            BADGE[row.trangThai as TrangThai] ??
                            "bg-slate-100 text-slate-600"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* DETAIL PANEL */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          {selected ? (
            <>
              <div className="font-mono text-xs font-bold text-blue-700 mb-1">
                {selected.id}
              </div>
              <div className="text-sm font-bold text-slate-900 mb-0.5">
                {selected.ten}
              </div>
              <div className="text-xs text-slate-400 mb-3">
                {selected.donVi}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="text-xs border border-slate-300 text-slate-600 px-2 py-0.5 rounded-full">
                  {selected.hinhThuc}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${tagColor[selected.trangThai as TrangThai]}`}
                >
                  {selected.trangThai}
                </span>
              </div>
              <div className="space-y-2 mb-5">
                {[
                  ["Giá trị", selected.giaTriStr + " đ"],
                  ["Nguồn vốn", selected.detail.nguonVon],
                  ["Ngày tạo", selected.detail.ngayTao],
                  ["Hạn hoàn thành", selected.detail.hanHT],
                ].map(([lbl, val]) => (
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

              <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                <span>Tiến độ quy trình</span>
                <span>
                  {selected.detail.bước} bước ({selected.detail.pct})
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor[selected.trangThai as TrangThai]}`}
                  style={{ width: selected.detail.pct }}
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center pt-16">
              <i className="fa-regular fa-file-lines text-4xl mb-3" />
              <p>Chọn một gói thầu để xem chi tiết</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
export default DanhSachGoiThau;
