/* ─────────────────────────────────────────────────────────────
   Báo cáo + Dashboard API
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse } from "./types";

export type BaoCaoGoiThauFilter = {
  page?: number;
  pageSize?: number;
  khoaPhongId?: number;
  tuNgay?: string;
  denNgay?: string;
  trangThai?: string;
  hinhThucId?: number;
};

export type BaoCaoGoiThauItem = {
  id: number;
  idCongKhai: string;
  maGoiThau: string;
  tenGoiThau: string;
  tenHinhThuc?: string;
  tenKhoaPhong?: string;
  hinhThucId?: number;
  khoaPhongId?: number;
  giaTri?: number;
  trangThai: string;
  tongSoBuoc: number;
  soBuocHoanThanh: number;
  phanTramHoanThanh: number;
  ngayTao?: string;
};

export type BaoCaoGoiThauResponse = {
  items: BaoCaoGoiThauItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type DashboardTongQuan = {
  tongGoiThau: number;
  dangXuLy: number;
  hoanThanh: number;
  quaHan: number;
  tongNganSach: number;
  thongKeThang: { nam: number; thang: number; soLuong: number }[];
  phanBoTrangThai: { trangThai: string; soLuong: number }[];
};

export async function searchBaoCaoGoiThau(filter: BaoCaoGoiThauFilter): Promise<BaoCaoGoiThauResponse> {
  const res = await http.get<ApiResponse<BaoCaoGoiThauResponse>>("/bao-cao/goi-thau", { params: filter });
  return res.data;
}

export async function getBaoCaoTongHop(params?: {
  tuNgay?: string;
  denNgay?: string;
  hinhThucId?: number;
}): Promise<any> {
  const res = await http.get<ApiResponse<any>>("/bao-cao/tong-hop", { params });
  return res.data;
}

export async function getDashboardTongQuan(): Promise<DashboardTongQuan> {
  const res = await http.get<ApiResponse<DashboardTongQuan>>("/dashboard/tong-quan");
  return res.data;
}

export async function getBaoCaoChiTieu(params?: {
  tuNgay?: string;
  denNgay?: string;
  hinhThucId?: number;
}): Promise<any> {
  const res = await http.get<ApiResponse<any>>("/bao-cao/chi-tieu", { params });
  return res.data;
}

export type WorkflowStepReport = {
  tenBuoc: string;
  tongSo: number;
  hoanThanh: number;
  dangXuLy: number;
  choDuyet: number;
  quaHan: number;
  tiLeHoanThanh: number;
};

export async function getWorkflowStepReport(params?: {
  tuNgay?: string;
  denNgay?: string;
  hinhThucId?: number;
}): Promise<WorkflowStepReport[]> {
  const res = await http.get<ApiResponse<WorkflowStepReport[]>>("/bao-cao/workflow-steps", { params });
  return res.data;
}

export type BaoCaoTietKiem = {
  khoaPhongId?: number;
  tenKhoaPhong: string;
  tongGoiThau: number;
  tongNganSach: number;
  tongGiaTriHopDong?: number;
  tienTietKiem?: number;
  phanTramTietKiem: number;
};

export type BaoCaoHieuSuatNguoiDung = {
  nguoiDungId: number;
  hoTen: string;
  tenDangNhap: string;
  tongBuocXuLy: number;
  soBuocHoanThanh: number;
  soBuocQuaHan: number;
  thoiGianXuLyTrungBinhGio: number;
  tiLeQuaHan: number;
};

export type WorkflowBottleneck = {
  tenBuoc: string;
  tongSo: number;
  dangXuLy: number;
  choDuyet: number;
  hoanThanh: number;
  quaHan: number;
  thoiGianTrungBinhGio: number;
  mucDoCanhBao: string; // OK | WARN | CRITICAL
};

export async function getBaoCaoTietKiem(params?: {
  tuNgay?: string; denNgay?: string; hinhThucId?: number;
}): Promise<BaoCaoTietKiem[]> {
  const res = await http.get<ApiResponse<BaoCaoTietKiem[]>>("/bao-cao/tiet-kiem", { params });
  return res.data;
}

export async function getBaoCaoHieuSuatNguoiDung(params?: {
  tuNgay?: string; denNgay?: string; hinhThucId?: number;
}): Promise<BaoCaoHieuSuatNguoiDung[]> {
  const res = await http.get<ApiResponse<BaoCaoHieuSuatNguoiDung[]>>("/bao-cao/hieu-suat-nguoi-dung", { params });
  return res.data;
}

export async function getWorkflowBottleneck(params?: {
  tuNgay?: string; denNgay?: string; hinhThucId?: number;
}): Promise<WorkflowBottleneck[]> {
  const res = await http.get<ApiResponse<WorkflowBottleneck[]>>("/bao-cao/workflow-bottleneck", { params });
  return res.data;
}

export async function exportBaoCaoCsv(params?: {
  tuNgay?: string;
  denNgay?: string;
  hinhThucId?: number;
}): Promise<Blob> {
  const res = await http.get("/bao-cao/export", {
    params,
    responseType: "blob",
  } as any);
  return res as unknown as Blob;
}
