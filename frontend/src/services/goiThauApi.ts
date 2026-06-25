/* ─────────────────────────────────────────────────────────────
   Gói thầu API
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse, PagedResult } from "./types";
import { toGoiThauTrangThaiLabel } from "@/util/goiThauTrangThai";

/* ─── Types ─────────────────────────────────────────────── */

export type GoiThauItem = {
  id: number;
  idCongKhai: string;
  maGoiThau: string;
  tenGoiThau: string;
  hinhThucId?: number;
  tenHinhThuc?: string;
  khoaPhongId?: number;
  tenKhoaPhong?: string;
  nganSach?: number;
  trangThai: string;
  ngayTao: string;
  ngayCapNhat?: string;
  tongSoBuoc: number;
  soBuocHoanThanh: number;
  phanTramHoanThanh: number;
};

export type GoiThauDetail = {
  id: number;
  idCongKhai: string;
  maGoiThau: string;
  tenGoiThau: string;
  moTa?: string;
  nganSach?: number;
  khoaPhongId?: number;
  tenKhoaPhong?: string;
  hinhThucId?: number;
  tenHinhThuc?: string;
  trangThai: string;
  nguonVon?: string;
  nguoiTaoId?: number;
  tenNguoiTao?: string;
  ngayTao: string;
  ngayCapNhat?: string;
  loaiGoiThau?: string;
  canCuApDungRutGon?: string;
  theoDoi?: string;
  workflowId?: number;
};

export type CreateGoiThauRequest = {
  tenGoiThau: string;
  moTa?: string;
  nganSach?: number;
  deXuatId?: number;
};

export type CreateGoiThauFullRequest = {
  tenGoiThau: string;
  moTa?: string;
  nganSach?: number;
  khoaPhongId?: number;
  hinhThucId: number;
  workflowId?: number;
  nguonVon?: string;
  loaiGoiThau?: string;
  theoDoi?: string;
};

export type UpdateGoiThauFullRequest = {
  tenGoiThau: string;
  moTa?: string;
  nganSach?: number;
  hinhThucId?: number;
  nguonVon?: string;
  loaiGoiThau?: string;
  canCuApDungRutGon?: string;
  theoDoi?: string;
};

/* ─── APIs ──────────────────────────────────────────────── */

export const TRANG_THAI_GOI_THAU = {
  DU_THAO: "DU_THAO",
  DANG_XU_LY: "DANG_XU_LY",
  HOAN_THANH: "HOAN_THANH",
  HUY_BO: "HUY_BO",
  QUA_HAN: "QUA_HAN",
  DA_CHON_NHA_THAU: "DA_CHON_NHA_THAU",
} as const;

export function resolveTrangThaiLabel(tt: string): string {
  return toGoiThauTrangThaiLabel(tt);
}

export async function searchGoiThau(params: {
  page?: number;
  pageSize?: number;
  trangThai?: string;
  search?: string;
}): Promise<PagedResult<GoiThauItem>> {
  const res = await http.get<ApiResponse<PagedResult<GoiThauItem>>>("/goi-thau", { params });
  return res.data;
}

export async function getGoiThauChiTiet(id: number): Promise<GoiThauDetail> {
  const res = await http.get<ApiResponse<GoiThauDetail>>(`/goi-thau/${id}/chi-tiet`);
  return res.data;
}

export async function createGoiThau(data: CreateGoiThauRequest): Promise<GoiThauDetail> {
  const res = await http.post<ApiResponse<GoiThauDetail>>("/goi-thau", data);
  return res.data;
}

export async function createGoiThauFull(data: CreateGoiThauFullRequest): Promise<GoiThauDetail> {
  const res = await http.post<ApiResponse<GoiThauDetail>>("/goi-thau", data);
  return res.data;
}

export async function updateGoiThau(id: number, data: CreateGoiThauRequest): Promise<GoiThauDetail> {
  const res = await http.put<ApiResponse<GoiThauDetail>>(`/goi-thau/${id}`, data);
  return res.data;
}

export async function updateGoiThauFull(id: number, data: UpdateGoiThauFullRequest): Promise<GoiThauDetail> {
  const res = await http.put<ApiResponse<GoiThauDetail>>(`/goi-thau/${id}`, data);
  return res.data;
}

export async function deleteGoiThau(id: number): Promise<void> {
  await http.del(`/goi-thau/${id}`);
}

export async function cancelGoiThau(id: number): Promise<void> {
  await http.post(`/goi-thau/${id}/cancel`);
}
