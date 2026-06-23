import { Routes, Route } from "react-router-dom";

// Layouts
import DefaultLayout from "@/layouts/DefaultLayouts";
import AuthLayout from "@/layouts/AuthLayout";

// Pages
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import DanhSachGoiThau from "@/pages/DanhSachGoiThau";
import TaoGoiThau from "@/pages/TaoGoiThau";
import DanhMucThucHien from "@/pages/DanhMucThucHien";
import KhoaPhong from "@/pages/KhoaPhong";
import NguoiDung from "@/pages/NguoiDung";
import BaoCao from "@/pages/BaoCao";
import LapQuyTrinh from "@/pages/LapQuyTrinh";
import DanhSachQuyTrinh from "@/pages/DanhSachQuyTrinh";
import UserProfile from "@/pages/UserProfile";
import XuLyBuocGoiThau from "@/pages/XuLyBuocGoiThau";
import RouteGuard from "@/components/RouteGuard";

function Guarded({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {/* AuthLayout — login / register / forgot password */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      {/* DefaultLayout — các trang sau đăng nhập */}
      <Route element={<DefaultLayout />}>
        <Route path="/dashboard" element={<Guarded><Dashboard /></Guarded>} />
        <Route path="/danh-sach-goi-thau" element={<Guarded><DanhSachGoiThau /></Guarded>} />
        <Route path="/tao-goi-thau" element={<Guarded><TaoGoiThau /></Guarded>} />
        <Route path="/xu-ly-buoc/:id" element={<Guarded><XuLyBuocGoiThau /></Guarded>} />
        <Route path="/danh-muc-thuc-hien" element={<Guarded><DanhMucThucHien /></Guarded>} />
        <Route path="/lap-quy-trinh" element={<Guarded><LapQuyTrinh /></Guarded>} />
        <Route path="/danh-sach-quy-trinh" element={<Guarded><DanhSachQuyTrinh /></Guarded>} />
        <Route path="/khoa-phong" element={<Guarded><KhoaPhong /></Guarded>} />
        <Route path="/nguoi-dung" element={<Guarded><NguoiDung /></Guarded>} />
        <Route path="/bao-cao" element={<Guarded><BaoCao /></Guarded>} />
        <Route path="/profile" element={<Guarded><UserProfile /></Guarded>} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
