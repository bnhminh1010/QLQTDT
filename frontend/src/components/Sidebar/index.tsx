import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const { pathname } = useLocation();
  const link = (path: string) =>
    `flex items-center gap-2.5 px-4 py-[9px] text-[13px] transition-colors ${
      pathname === path
        ? "bg-blue-900 text-white"
        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-300"
    }`;

  return (
    <aside className="w-[220px] bg-slate-950 flex flex-col fixed top-0 left-0 bottom-0 z-[100] overflow-y-auto overflow-x-hidden">
      <div className="flex items-center gap-2.5 px-3.5 h-14 border-b border-white/[0.08] shrink-0">
        <div className="w-[34px] h-[34px] bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm shrink-0">
          <i className="fa-solid fa-gavel" />
        </div>
        <div>
          <span className="block text-slate-100 text-[12.5px] font-bold whitespace-nowrap">
            Quy trình Đấu thầu
          </span>
          <span className="block text-[#475569] text-[11px] whitespace-nowrap">
            Bệnh viện Ung Bướu
          </span>
        </div>
      </div>

      <nav className="flex-1 py-1.5">
        <div className="text-[10px] font-bold text-[#334155] tracking-[.09em] px-4 pt-3.5 pb-1">
          TỔNG QUAN
        </div>
        <ul>
          <li>
            <Link to="/dashboard" className={link("/dashboard")}>
              <i className="fa-solid fa-gauge-high w-4 text-center shrink-0" />
              <span>Dashboard</span>
            </Link>
          </li>
        </ul>

        <div className="text-[10px] font-bold text-[#334155] tracking-[.09em] px-4 pt-3.5 pb-1">
          ĐẤU THẦU
        </div>
        <ul>
          <li>
            <Link
              to="/danh-sach-goi-thau"
              className={link("/danh-sach-goi-thau")}
            >
              <i className="fa-solid fa-list w-4 text-center shrink-0" />
              <span>Danh sách gói thầu</span>
            </Link>
          </li>
          <li>
            <Link to="/tao-goi-thau" className={link("/tao-goi-thau")}>
              <i className="fa-solid fa-plus-circle w-4 text-center shrink-0" />
              <span>Tạo gói thầu</span>
            </Link>
          </li>
          <li>
            <Link
              to="/danh-muc-thuc-hien"
              className={link("/danh-muc-thuc-hien")}
            >
              <i className="fa-solid fa-bars-staggered w-4 text-center shrink-0" />
              <span>Danh mục thực hiện</span>
            </Link>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-2.5 px-4 py-[9px] text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            >
              <i className="fa-solid fa-diagram-project w-4 text-center shrink-0" />
              <span>Lập quy trình</span>
            </a>
          </li>
        </ul>

        <div className="text-[10px] font-bold text-[#334155] tracking-[.09em] px-4 pt-3.5 pb-1">
          HỆ THỐNG
        </div>
        <ul>
          <li>
            <Link to="/bao-cao" className={link("/bao-cao")}>
              <i className="fa-solid fa-chart-bar w-4 text-center shrink-0" />
              <span>Báo cáo</span>
            </Link>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-2.5 px-4 py-[9px] text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            >
              <i className="fa-solid fa-building w-4 text-center shrink-0" />
              <span>Khoa/phòng</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-2.5 px-4 py-[9px] text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            >
              <i className="fa-solid fa-user w-4 text-center shrink-0" />
              <span>Người dùng</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-2.5 px-4 py-[9px] text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            >
              <i className="fa-solid fa-gear w-4 text-center shrink-0" />
              <span>Cài đặt</span>
            </a>
          </li>
        </ul>
      </nav>

      <div className="flex items-center gap-2.5 px-4 py-3.5 border-t border-white/[0.07] shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          T
        </div>
        <div>
          <span className="block text-slate-200 text-[12.5px] font-semibold">
            Nguyễn Mạnh Tuấn
          </span>
          <span className="block text-slate-500 text-[11px]">P.HCQT</span>
        </div>
      </div>
    </aside>
  );
}
