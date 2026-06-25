/* ─────────────────────────────────────────────────────────────
   Hình thức đấu thầu API
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse, PagedResult } from "./types";

/* ─── Types ─────────────────────────────────────────────── */

export type HinhThucDauThau = {
  id: number;
  maHinhThuc: string;
  tenHinhThuc: string;
  hanMucToiDa?: number;
  trangThaiHoatDong: boolean;
  soGoi: number;
};

export type CreateHinhThucRequest = {
  maHinhThuc: string;
  tenHinhThuc: string;
  hanMucToiDa?: number;
};

export type UpdateHinhThucRequest = {
  tenHinhThuc?: string;
  hanMucToiDa?: number;
  trangThaiHoatDong?: boolean;
};

/* ─── APIs ──────────────────────────────────────────────── */

export async function searchHinhThuc(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<HinhThucDauThau[]> {
  const res = await http.get<ApiResponse<PagedResult<HinhThucDauThau>>>("/hinh-thuc-dau-thau", {
    params,
  });
  return res.data.items ?? [];
}

export async function getAllHinhThuc(): Promise<HinhThucDauThau[]> {
  return searchHinhThuc({ page: 1, pageSize: 100 });
}

export async function createHinhThuc(data: CreateHinhThucRequest): Promise<HinhThucDauThau> {
  const res = await http.post<ApiResponse<HinhThucDauThau>>("/hinh-thuc-dau-thau", data);
  return res.data;
}

export async function updateHinhThuc(id: number, data: UpdateHinhThucRequest): Promise<HinhThucDauThau> {
  const res = await http.put<ApiResponse<HinhThucDauThau>>(`/hinh-thuc-dau-thau/${id}`, data);
  return res.data;
}

export async function deleteHinhThuc(id: number): Promise<void> {
  await http.del(`/hinh-thuc-dau-thau/${id}`);
}
