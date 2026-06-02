import { useState } from "react";

type VaiTro = "Admin" | "Quản lý" | "Nhân viên";
type TrangThai = "Hoạt động" | "Chờ duyệt" | "Bị khóa";

const VAI_TRO_BADGE: Record<VaiTro, string> = {
  Admin: "bg-red-100 text-red-700",
  "Quản lý": "bg-purple-100 text-purple-700",
  "Nhân viên": "bg-slate-100 text-slate-600",
};

const TT_BADGE: Record<TrangThai, string> = {
  "Hoạt động": "bg-emerald-100 text-emerald-700",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
  "Bị khóa": "bg-red-100 text-red-600",
};

type User = {
  id: string;
  hoTen: string;
  username: string;
  email: string;
  phong: string;
  vaiTro: VaiTro;
  trangThai: TrangThai;
  ngayTao: string;
};

const DATA: User[] = [
  {
    id: "U001",
    hoTen: "Nguyễn Văn Admin",
    username: "admin",
    email: "admin@bvungbuou.vn",
    phong: "Ban Giám đốc",
    vaiTro: "Admin",
    trangThai: "Hoạt động",
    ngayTao: "01/01/2025",
  },
  {
    id: "U002",
    hoTen: "Trần Thị Bình",
    username: "ttbinh",
    email: "ttbinh@bvungbuou.vn",
    phong: "P.Kế hoạch",
    vaiTro: "Quản lý",
    trangThai: "Hoạt động",
    ngayTao: "05/01/2025",
  },
  {
    id: "U003",
    hoTen: "Lê Văn Cường",
    username: "lvcuong",
    email: "lvcuong@bvungbuou.vn",
    phong: "Khoa Dược",
    vaiTro: "Nhân viên",
    trangThai: "Hoạt động",
    ngayTao: "10/01/2025",
  },
  {
    id: "U004",
    hoTen: "Phạm Thị Dung",
    username: "ptdung",
    email: "ptdung@bvungbuou.vn",
    phong: "Khoa Xét nghiệm",
    vaiTro: "Nhân viên",
    trangThai: "Chờ duyệt",
    ngayTao: "15/02/2025",
  },
  {
    id: "U005",
    hoTen: "Hoàng Văn Em",
    username: "hvem",
    email: "hvem@bvungbuou.vn",
    phong: "P.HCQT",
    vaiTro: "Quản lý",
    trangThai: "Hoạt động",
    ngayTao: "20/02/2025",
  },
  {
    id: "U006",
    hoTen: "Ngô Thị Phương",
    username: "ntphuong",
    email: "ntphuong@bvungbuou.vn",
    phong: "Khoa Nội",
    vaiTro: "Nhân viên",
    trangThai: "Bị khóa",
    ngayTao: "01/03/2025",
  },
];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-indigo-500",
];

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1][0].toUpperCase();
}

export default function NguoiDung() {
  const [selected, setSelected] = useState<User>(DATA[0]);
  const [search, setSearch] = useState("");
  const [filterVaiTro, setFilterVaiTro] = useState("");
  const [filterTT, setFilterTT] = useState("");

  const filtered = DATA.filter(
    (u) =>
      (u.hoTen.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase())) &&
      (filterVaiTro === "" || u.vaiTro === filterVaiTro) &&
      (filterTT === "" || u.trangThai === filterTT),
  );

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Người dùng</h1>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>
          <button className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <i className="fa-solid fa-plus text-xs" /> Thêm người dùng
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              [
                "fa-users",
                "blue",
                "TỔNG NGƯỜI DÙNG",
                DATA.length.toString(),
                "tài khoản",
                "text-blue-600",
              ],
              [
                "fa-circle-check",
                "green",
                "HOẠT ĐỘNG",
                DATA.filter(
                  (d) => d.trangThai === "Hoạt động",
                ).length.toString(),
                "người",
                "text-emerald-600",
              ],
              [
                "fa-hourglass-half",
                "amber",
                "CHỜ DUYỆT",
                DATA.filter(
                  (d) => d.trangThai === "Chờ duyệt",
                ).length.toString(),
                "yêu cầu",
                "text-amber-600",
              ],
              [
                "fa-lock",
                "red",
                "BỊ KHÓA",
                DATA.filter((d) => d.trangThai === "Bị khóa").length.toString(),
                "tài khoản",
                "text-red-500",
              ],
            ].map(([icon, color, lbl, val, sub, valCls]) => (
              <div
                key={lbl}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "blue" ? "bg-blue-100 text-blue-600" : color === "green" ? "bg-emerald-100 text-emerald-600" : color === "amber" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-500"}`}
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
                Danh sách tài khoản
              </span>
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Tìm tên, username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>
              <select
                value={filterVaiTro}
                onChange={(e) => setFilterVaiTro(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Tất cả vai trò</option>
                <option>Admin</option>
                <option>Quản lý</option>
                <option>Nhân viên</option>
              </select>
              <select
                value={filterTT}
                onChange={(e) => setFilterTT(e.target.value)}
                className="border border-slate-200 rounded-xl text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option>Hoạt động</option>
                <option>Chờ duyệt</option>
                <option>Bị khóa</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Người dùng</th>
                    <th className="px-5 py-3 text-left">Khoa/phòng</th>
                    <th className="px-5 py-3 text-left">Vai trò</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-left">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={`cursor-pointer transition-colors ${selected.id === u.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                          >
                            {getInitials(u.hoTen)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">
                              {u.hoTen}
                            </div>
                            <div className="text-xs text-slate-400">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{u.phong}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${VAI_TRO_BADGE[u.vaiTro]}`}
                        >
                          {u.vaiTro}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TT_BADGE[u.trangThai]}`}
                        >
                          {u.trangThai}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {u.ngayTao}
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
          {(() => {
            const i = DATA.findIndex((u) => u.id === selected.id);
            return (
              <>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                >
                  {getInitials(selected.hoTen)}
                </div>
                <div className="text-sm font-bold text-slate-900 mb-0.5">
                  {selected.hoTen}
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  @{selected.username}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${VAI_TRO_BADGE[selected.vaiTro]}`}
                  >
                    {selected.vaiTro}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TT_BADGE[selected.trangThai]}`}
                  >
                    {selected.trangThai}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  {[
                    ["Mã", selected.id],
                    ["Email", selected.email],
                    ["Khoa/phòng", selected.phong],
                    ["Ngày tạo", selected.ngayTao],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex flex-col text-xs gap-0.5">
                      <span className="text-slate-400">{lbl}</span>
                      <span className="text-slate-800 font-medium">{val}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors">
                    <i className="fa-solid fa-pen text-xs" /> Chỉnh sửa
                  </button>
                  {selected.trangThai === "Chờ duyệt" && (
                    <button className="w-full flex items-center justify-center gap-2 text-sm text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 transition-colors">
                      <i className="fa-solid fa-check text-xs" /> Duyệt tài
                      khoản
                    </button>
                  )}
                  {selected.trangThai === "Hoạt động" && (
                    <button className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-xl py-2.5 transition-colors">
                      <i className="fa-solid fa-lock text-xs" /> Khóa tài khoản
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </aside>
      </div>
    </>
  );
}
