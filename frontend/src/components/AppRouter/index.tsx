import { Routes, Route } from "react-router-dom";

// Layouts
import DefaultLayout from "@/layouts/DefaultLayouts";
import AuthLayout from "@/layouts/AuthLayout";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import DanhSachGoiThau from "@/pages/DanhSachGoiThau";
import TaoGoiThau from "@/pages/TaoGoiThau";
import DanhMucThucHien from "@/pages/DanhMucThucHien";
import KhoaPhong from "@/pages/KhoaPhong";
import NguoiDung from "@/pages/NguoiDung";
import BaoCao from "@/pages/BaoCao";
import LapQuyTrinh from "@/pages/LapQuyTrinh";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      {/* AuthLayout — login / register / forgot password */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      {/* DefaultLayout — các trang sau đăng nhập */}
      <Route element={<DefaultLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/danh-sach-goi-thau" element={<DanhSachGoiThau />} />
        <Route path="/tao-goi-thau" element={<TaoGoiThau />} />
        <Route path="/danh-muc-thuc-hien" element={<DanhMucThucHien />} />
        <Route path="/lap-quy-trinh" element={<LapQuyTrinh />} />
        <Route path="/khoa-phong" element={<KhoaPhong />} />
        <Route path="/nguoi-dung" element={<NguoiDung />} />
        <Route path="/bao-cao" element={<BaoCao />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
