import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUserApi, clearStoredToken } from "@/services/api";
import type { LoginUserDto } from "@/services/api";
import { useAccessLevel, canAccess } from "@/hooks/useAccessLevel";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<LoginUserDto | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUserApi().then((u) => setUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const link = (path: string) =>
    `flex items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-4 py-[9px] text-[13px] transition-colors ${
      pathname === path
        ? "bg-blue-900 text-white"
        : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-300"
    }`;

  const hoTen = user?.hoTen ?? "?";
  const initial = hoTen.charAt(0).toUpperCase();
  const donVi = user?.roles?.[0]?.tenKhoaPhong ?? "";
  const level = useAccessLevel(user);

  function hasAccess(path: string) {
    return canAccess(path, level);
  }

  return (
    <aside className="w-16 lg:w-[220px] bg-slate-950 flex flex-col fixed top-0 left-0 bottom-0 z-[100] overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-center lg:justify-start gap-2.5 px-3.5 h-14 border-b border-white/[0.08] shrink-0">
        <div className="w-[34px] h-[34px] bg-white rounded-md flex items-center justify-center text-white text-sm shrink-0">
          <img
            src="/bvungbuouLogo_no_text.png"
            alt="BV Ung Bướu TP.HCM"
            className="w-8 h-10 object-contain"
          />
        </div>
        <div className="hidden lg:block">
          <span className="block text-slate-100 text-[12.5px] font-bold whitespace-nowrap">
            Quy trình Đấu thầu
          </span>
          <span className="block text-[#475569] text-[11px] whitespace-nowrap">
            Bệnh viện Ung Bướu
          </span>
        </div>
      </div>

      <nav className="flex-1 py-1.5">
        <div className="hidden lg:block text-[10px] font-bold text-[#334155] tracking-[.09em] px-4 pt-3.5 pb-1">
          TỔNG QUAN
        </div>
        <ul>
          <li>
            <Link to="/dashboard" className={link("/dashboard")}>
              <i className="fa-solid fa-gauge-high w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Dashboard</span>
            </Link>
          </li>
        </ul>

        <div className="hidden lg:block text-[10px] font-bold text-[#334155] tracking-[.09em] px-4 pt-3.5 pb-1">
          ĐẤU THẦU
        </div>
        <ul>
          {hasAccess("/danh-sach-goi-thau") && <li>
            <Link to="/danh-sach-goi-thau" className={link("/danh-sach-goi-thau")}>
              <i className="fa-solid fa-list w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Danh sách gói thầu</span>
            </Link>
          </li>}
          {hasAccess("/tao-goi-thau") && <li>
            <Link to="/tao-goi-thau" className={link("/tao-goi-thau")}>
              <i className="fa-solid fa-plus-circle w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Tạo gói thầu</span>
            </Link>
          </li>}
          {hasAccess("/danh-muc-thuc-hien") && <li>
            <Link to="/danh-muc-thuc-hien" className={link("/danh-muc-thuc-hien")}>
              <i className="fa-solid fa-bars-staggered w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Danh mục thực hiện</span>
            </Link>
          </li>}
          {hasAccess("/danh-sach-quy-trinh") && <li>
            <Link to="/danh-sach-quy-trinh" className={link("/danh-sach-quy-trinh")}>
              <i className="fa-solid fa-diagram-project w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Danh sách quy trình</span>
            </Link>
          </li>}
          {hasAccess("/lap-quy-trinh") && <li>
            <Link to="/lap-quy-trinh" className={link("/lap-quy-trinh")}>
              <i className="fa-solid fa-plus-square w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Lập quy trình</span>
            </Link>
          </li>}
        </ul>

        <div className="hidden lg:block text-[10px] font-bold text-[#334155] tracking-[.09em] px-4 pt-3.5 pb-1">
          HỆ THỐNG
        </div>
        <ul>
          {hasAccess("/bao-cao") && <li>
            <Link to="/bao-cao" className={link("/bao-cao")}>
              <i className="fa-solid fa-chart-bar w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Báo cáo</span>
            </Link>
          </li>}
          {hasAccess("/khoa-phong") && <li>
            <Link to="/khoa-phong" className={link("/khoa-phong")}>
              <i className="fa-solid fa-building w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Khoa/phòng</span>
            </Link>
          </li>}
          {hasAccess("/nguoi-dung") && <li>
            <Link to="/nguoi-dung" className={link("/nguoi-dung")}>
              <i className="fa-solid fa-user w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Người dùng</span>
            </Link>
          </li>}
          <li>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-4 py-[9px] text-[13px] text-slate-400 hover:bg-white/[0.06] hover:text-slate-300 transition-colors"
            >
              <i className="fa-solid fa-gear w-4 text-center shrink-0" />
              <span className="hidden lg:inline">Cài đặt</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen((o) => !o)}
          className="w-full flex items-center justify-center lg:justify-start gap-2.5 px-3 lg:px-4 py-3.5 border-t border-white/[0.07] hover:bg-white/[0.06] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initial}
          </div>
          <div className="hidden lg:block flex-1 text-left min-w-0">
            <span className="block text-slate-200 text-[12.5px] font-semibold truncate">
              {hoTen}
            </span>
            {donVi && (
              <span className="block text-slate-500 text-[11px]">{donVi}</span>
            )}
          </div>
          <i className={`hidden lg:block fa-solid fa-chevron-${userMenuOpen ? "down" : "up"} text-slate-500 text-[10px]`} />
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-full left-2 w-56 lg:left-0 lg:right-0 lg:w-auto mb-1 mx-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[200]">
            <button
              onClick={() => { setUserMenuOpen(false); navigate("/profile"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <i className="fa-solid fa-user-circle text-slate-400 w-4 text-center" /> Hồ sơ cá nhân
            </button>
            <button
              onClick={() => { setUserMenuOpen(false); navigate("/profile"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <i className="fa-solid fa-lock text-slate-400 w-4 text-center" /> Đổi mật khẩu
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={() => { setUserMenuOpen(false); clearStoredToken(); navigate("/login"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket text-red-400 w-4 text-center" /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
