import { useState } from "react";

type DotState = "done" | "warn" | "idle";

const DOT_CLS: Record<DotState, string> = {
  done: "bg-emerald-500 text-white",
  warn: "bg-amber-500 text-white",
  idle: "bg-slate-200",
};

type StepRow = { state: DotState; ten: string; donVi: string; thoiHan: string };
type DanhMuc = {
  id: string;
  hinhThuc: string;
  badge: string;
  soGoi: number;
  steps: StepRow[];
};

const DANH_MUC: DanhMuc[] = [
  {
    id: "CDT-RG",
    hinhThuc: "Chỉ định thầu rút gọn",
    badge: "bg-blue-100 text-blue-700",
    soGoi: 7,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "done",
        ten: "3. Đăng tải yêu cầu báo giá",
        donVi: "K/p mua sắm",
        thoiHan: "5 ngày",
      },
      {
        state: "warn",
        ten: "4. Biên bản kiểm tra báo giá",
        donVi: "Tổ kiểm tra giá",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "5. Tờ trình phê duyệt dự toán",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "6. QĐ phê duyệt dự toán",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "7. QĐ chỉ định nhà thầu",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
  {
    id: "CDT-TQD",
    hinhThuc: "Chỉ định thầu tự quyết định",
    badge: "bg-emerald-100 text-emerald-700",
    soGoi: 4,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "3. Lập hồ sơ mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "5 ngày",
      },
      {
        state: "idle",
        ten: "4. Phê duyệt hồ sơ mời thầu",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "5. QĐ chỉ định nhà thầu",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
  {
    id: "CHCT",
    hinhThuc: "Chào hàng cạnh tranh",
    badge: "bg-amber-100 text-amber-700",
    soGoi: 8,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "done",
        ten: "3. Đăng tải yêu cầu báo giá",
        donVi: "K/p mua sắm",
        thoiHan: "5 ngày",
      },
      {
        state: "warn",
        ten: "4. Biên bản kiểm tra báo giá",
        donVi: "Tổ kiểm tra giá",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "5. Tờ trình phê duyệt dự toán",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "6. QĐ phê duyệt dự toán",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "7. Tờ trình kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "8. QĐ kế hoạch LCNT",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "9. Đăng tải kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "10. Phát hành hồ sơ mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "11. Nộp hồ sơ dự thầu",
        donVi: "Nhà thầu",
        thoiHan: "5 ngày",
      },
      {
        state: "idle",
        ten: "12. Mở thầu & đánh giá HSDT",
        donVi: "Tổ chuyên gia",
        thoiHan: "5 ngày",
      },
      {
        state: "idle",
        ten: "13. Trình kết quả lựa chọn NT",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "14. QĐ phê duyệt kết quả đấu thầu",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
  {
    id: "DTRR",
    hinhThuc: "Đấu thầu rộng rãi",
    badge: "bg-purple-100 text-purple-700",
    soGoi: 5,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "3. Tờ trình phê duyệt dự toán",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "4. QĐ phê duyệt dự toán",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "5. Tờ trình kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "6. QĐ kế hoạch LCNT",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "7. Đăng tải kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "8. Lập hồ sơ mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "7 ngày",
      },
      {
        state: "idle",
        ten: "9. Phê duyệt HSMT",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "10. Đăng tải mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "10 ngày",
      },
      {
        state: "idle",
        ten: "11. Nộp HSDT",
        donVi: "Nhà thầu",
        thoiHan: "15 ngày",
      },
      {
        state: "idle",
        ten: "12. Mở thầu",
        donVi: "Tổ chuyên gia",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "13. Đánh giá HSDT",
        donVi: "Tổ chuyên gia",
        thoiHan: "10 ngày",
      },
      {
        state: "idle",
        ten: "14. Trình kết quả lựa chọn NT",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "15. QĐ phê duyệt kết quả",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "16. Đăng tải kết quả LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "17. Ký kết hợp đồng",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
];

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

export default function DanhMucThucHien() {
  const [selected, setSelected] = useState<DanhMuc>(DANH_MUC[0]);
  const [search, setSearch] = useState("");

  const filtered = DANH_MUC.filter((d) =>
    d.hinhThuc.toLowerCase().includes(search.toLowerCase()),
  );

  const doneCount = selected.steps.filter((s) => s.state === "done").length;
  const pct = Math.round((doneCount / selected.steps.length) * 100);

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh mục thực hiện
        </h1>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {DANH_MUC.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={`bg-white rounded-2xl border p-4 text-left transition-all ${
                  selected.id === d.id
                    ? "border-blue-400 ring-1 ring-blue-300"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${d.badge}`}
                >
                  {d.hinhThuc}
                </span>
                <div className="text-2xl font-extrabold text-slate-800">
                  {d.soGoi}
                </div>
                <div className="text-xs text-slate-400">
                  gói thầu · {d.steps.length} bước
                </div>
              </button>
            ))}
          </div>

          {/* SEARCH + TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-800 text-sm">
                Danh sách hình thức đấu thầu
              </span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm hình thức..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Hình thức</th>
                    <th className="px-5 py-3 text-center">Số bước</th>
                    <th className="px-5 py-3 text-center">
                      Số gói đang thực hiện
                    </th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className={`cursor-pointer transition-colors ${
                        selected.id === d.id
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.badge}`}
                        >
                          {d.hinhThuc}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-slate-700">
                        {d.steps.length}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {d.soGoi} gói
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <i className="fa-solid fa-circle-check" /> Đang hoạt
                          động
                        </span>
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
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${selected.badge}`}
          >
            {selected.hinhThuc}
          </span>
          <div className="text-xs text-slate-400 mb-1">
            {selected.steps.length} bước quy trình
          </div>

          <div className="flex justify-between text-xs text-slate-600 mb-1.5 mt-3">
            <span>Hoàn thành mẫu</span>
            <span>
              {doneCount}/{selected.steps.length} bước ({pct}%)
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
            CÁC BƯỚC QUY TRÌNH
          </div>
          <div className="space-y-3">
            {selected.steps.map((s) => (
              <div key={s.ten} className="flex items-start gap-2.5">
                <Dot state={s.state} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-800">
                    {s.ten}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">
                      {s.donVi}
                    </span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">
                      {s.thoiHan}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
