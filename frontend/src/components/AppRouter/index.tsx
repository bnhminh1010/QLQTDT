import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Layouts
import DefaultLayout from "@/layouts/DefaultLayouts";
import AuthLayout from "@/layouts/AuthLayout";

// Pages — lazy loaded
const Login = lazy(() => import("@/pages/Login"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DanhSachGoiThau = lazy(() => import("@/pages/DanhSachGoiThau"));
const TaoGoiThau = lazy(() => import("@/pages/TaoGoiThau"));
const DanhMucThucHien = lazy(() => import("@/pages/DanhMucThucHien"));
const KhoaPhong = lazy(() => import("@/pages/KhoaPhong"));
const NguoiDung = lazy(() => import("@/pages/NguoiDung"));
const BaoCao = lazy(() => import("@/pages/BaoCao"));
const LapQuyTrinh = lazy(() => import("@/pages/LapQuyTrinh"));
const DanhSachQuyTrinh = lazy(() => import("@/pages/DanhSachQuyTrinh"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const XuLyBuocGoiThau = lazy(() => import("@/pages/XuLyBuocGoiThau"));
import RouteGuard from "@/components/RouteGuard";

function Guarded({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}

function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex items-center justify-center h-full"><i className="fa-solid fa-circle-notch fa-spin text-blue-400 text-xl" /></div>}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LazyLoad><Login /></LazyLoad>} />
      {/* AuthLayout — login / register / forgot password */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LazyLoad><Login /></LazyLoad>} />
        <Route path="/forgot-password" element={<LazyLoad><ForgotPassword /></LazyLoad>} />
      </Route>
      {/* DefaultLayout — các trang sau đăng nhập */}
      <Route element={<DefaultLayout />}>
        <Route path="/dashboard" element={<Guarded><LazyLoad><Dashboard /></LazyLoad></Guarded>} />
        <Route path="/danh-sach-goi-thau" element={<Guarded><LazyLoad><DanhSachGoiThau /></LazyLoad></Guarded>} />
        <Route path="/tao-goi-thau" element={<Guarded><LazyLoad><TaoGoiThau /></LazyLoad></Guarded>} />
        <Route path="/xu-ly-buoc/:id" element={<Guarded><LazyLoad><XuLyBuocGoiThau /></LazyLoad></Guarded>} />
        <Route path="/danh-muc-thuc-hien" element={<Guarded><LazyLoad><DanhMucThucHien /></LazyLoad></Guarded>} />
        <Route path="/lap-quy-trinh" element={<Guarded><LazyLoad><LapQuyTrinh /></LazyLoad></Guarded>} />
        <Route path="/danh-sach-quy-trinh" element={<Guarded><LazyLoad><DanhSachQuyTrinh /></LazyLoad></Guarded>} />
        <Route path="/khoa-phong" element={<Guarded><LazyLoad><KhoaPhong /></LazyLoad></Guarded>} />
        <Route path="/nguoi-dung" element={<Guarded><LazyLoad><NguoiDung /></LazyLoad></Guarded>} />
        <Route path="/nguoi-dung/yeu-cau-thay-doi" element={<Guarded><LazyLoad><NguoiDung /></LazyLoad></Guarded>} />
        <Route path="/bao-cao" element={<Guarded><LazyLoad><BaoCao /></LazyLoad></Guarded>} />
        <Route path="/profile" element={<Guarded><LazyLoad><UserProfile /></LazyLoad></Guarded>} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
