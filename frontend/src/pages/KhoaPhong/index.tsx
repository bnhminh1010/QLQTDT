import { useState } from "react";

type LoaiPhong = "Khoa lâm sàng" | "Khoa cận lâm sàng" | "Phòng chức năng";

const LOAI_BADGE: Record<LoaiPhong, string> = {
  "Khoa lâm sàng": "bg-blue-100 text-blue-700",
  "Khoa cận lâm sàng": "bg-purple-100 text-purple-700",
  "Phòng chức năng": "bg-slate-100 text-slate-600",
};

type Phong = {
  id: string;
  ten: string;
  loai: LoaiPhong;
  truongKhoa: string;
  soNhanVien: number;
  soGoiThau: number;
  email: string;
  sdt: string;
};

const DATA: Phong[] = [
  {
    id: "KN",
    ten: "Khoa Nội",
    loai: "Khoa lâm sàng",
    truongKhoa: "BS. Nguyễn Văn An",
    soNhanVien: 24,
    soGoiThau: 5,
    email: "khoanoi@bvungbuou.vn",
    sdt: "028 3812 1234",
  },
  {
    id: "KNG",
    ten: "Khoa Ngoại",
    loai: "Khoa lâm sàng",
    truongKhoa: "BS. Trần Thị Bình",
    soNhanVien: 18,
    soGoiThau: 3,
    email: "khoangoa@bvungbuou.vn",
    sdt: "028 3812 1235",
  },
  {
    id: "KD",
    ten: "Khoa Dược",
    loai: "Khoa cận lâm sàng",
    truongKhoa: "DS. Lê Văn Cường",
    soNhanVien: 12,
    soGoiThau: 8,
    email: "khoaduoc@bvungbuou.vn",
    sdt: "028 3812 1236",
  },
  {
    id: "KXN",
    ten: "Khoa Xét nghiệm",
    loai: "Khoa cận lâm sàng",
    truongKhoa: "BS. Phạm Thị Dung",
    soNhanVien: 15,
    soGoiThau: 2,
    email: "khoaxn@bvungbuou.vn",
    sdt: "028 3812 1237",
  },
  {
    id: "PHCQT",
    ten: "P.Hành chính quản trị",
    loai: "Phòng chức năng",
    truongKhoa: "Ông Hoàng Văn Em",
    soNhanVien: 10,
    soGoiThau: 6,
    email: "phcqt@bvungbuou.vn",
    sdt: "028 3812 1238",
  },
  {
    id: "PKH",
    ten: "P.Kế hoạch",
    loai: "Phòng chức năng",
    truongKhoa: "Bà Ngô Thị Phương",
    soNhanVien: 8,
    soGoiThau: 4,
    email: "pkh@bvungbuou.vn",
    sdt: "028 3812 1239",
  },
];

export default function KhoaPhong() {
  const [selected, setSelected] = useState<Phong>(DATA[0]);
  const [search, setSearch] = useState("");
  const [filterLoai, setFilterLoai] = useState("");

  const filtered = DATA.filter(
    (p) =>
      p.ten.toLowerCase().includes(search.toLowerCase()) &&
      (filterLoai === "" || p.loai === filterLoai),
  );

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Khoa / Phòng</h1>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <i className="fa-solid fa-plus text-xs" /> Thêm khoa/phòng
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              [
                "fa-building",
                "blue",
                "TỔNG KHOA/PHÒNG",
                DATA.length.toString(),
                "đơn vị",
                "text-blue-600",
              ],
              [
                "fa-stethoscope",
                "purple",
                "KHOA LÂM SÀNG",
                DATA.filter(
                  (d) => d.loai === "Khoa lâm sàng",
                ).length.toString(),
                "khoa",
                "text-purple-600",
              ],
              [
                "fa-gear",
                "gray",
                "PHÒNG CHỨC NĂNG",
                DATA.filter(
                  (d) => d.loai === "Phòng chức năng",
                ).length.toString(),
                "phòng",
                "text-slate-600",
              ],
            ].map(([icon, color, lbl, val, sub, valCls]) => (
              <div
                key={lbl}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "blue" ? "bg-blue-100 text-blue-600" : color === "purple" ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"}`}
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

          {/* FILTER + TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800 text-sm flex-1">
                Danh sách khoa/phòng
              </span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm khoa/phòng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>
              <select
                value={filterLoai}
                onChange={(e) => setFilterLoai(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Tất cả loại</option>
                <option>Khoa lâm sàng</option>
                <option>Khoa cận lâm sàng</option>
                <option>Phòng chức năng</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Tên khoa/phòng</th>
                    <th className="px-5 py-3 text-left">Loại</th>
                    <th className="px-5 py-3 text-left">Trưởng khoa/phòng</th>
                    <th className="px-5 py-3 text-center">Nhân viên</th>
                    <th className="px-5 py-3 text-center">Gói thầu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`cursor-pointer transition-colors ${selected.id === p.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-building text-slate-400 text-sm" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {p.ten}
                            </div>
                            <div className="text-xs text-slate-400">{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LOAI_BADGE[p.loai]}`}
                        >
                          {p.loai}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {p.truongKhoa}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-slate-700">
                        {p.soNhanVien}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {p.soGoiThau}
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
        <aside className="w-[272px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
            <i className="fa-solid fa-building text-blue-600 text-xl" />
          </div>
          <div className="text-sm font-bold text-slate-900 mb-0.5">
            {selected.ten}
          </div>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-4 ${LOAI_BADGE[selected.loai]}`}
          >
            {selected.loai}
          </span>

          <div className="space-y-2 mb-5">
            {[
              ["Mã", selected.id],
              ["Trưởng khoa/phòng", selected.truongKhoa],
              ["Email", selected.email],
              ["Điện thoại", selected.sdt],
            ].map(([lbl, val]) => (
              <div key={lbl} className="flex flex-col text-xs gap-0.5">
                <span className="text-slate-400">{lbl}</span>
                <span className="text-slate-800 font-medium">{val}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              [
                "fa-users",
                "Nhân viên",
                selected.soNhanVien.toString(),
                "bg-slate-50",
              ],
              [
                "fa-box-archive",
                "Gói thầu",
                selected.soGoiThau.toString(),
                "bg-blue-50",
              ],
            ].map(([icon, lbl, val, bg]) => (
              <div key={lbl} className={`${bg} rounded-xl p-3 text-center`}>
                <i className={`fa-solid ${icon} text-slate-400 mb-1`} />
                <div className="text-xl font-extrabold text-slate-800">
                  {val}
                </div>
                <div className="text-[11px] text-slate-400">{lbl}</div>
              </div>
            ))}
          </div>

          <button className="mt-5 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors">
            <i className="fa-solid fa-pen text-xs" /> Chỉnh sửa
          </button>
        </aside>
      </div>
    </>
  );
}
