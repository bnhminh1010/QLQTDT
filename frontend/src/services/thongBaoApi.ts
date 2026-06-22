/* ─────────────────────────────────────────────────────────────
   Thông báo API
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse } from "./types";

export type ThongBaoItem = {
  idCongKhai: string;
  loaiThongBao: string;
  tieuDe: string;
  noiDung?: string;
  daDoc: boolean;
  urlDieuHuong?: string;
  ngayTao: string;
};

export type ThongBaoListResponse = {
  totalCount: number;
  items: ThongBaoItem[];
};

export async function getThongBaos(params: {
  page?: number;
  pageSize?: number;
  daDoc?: boolean;
}): Promise<ThongBaoListResponse> {
  const res = await http.get<ApiResponse<ThongBaoListResponse>>("/thong-bao", { params });
  return res.data;
}

export async function markReadThongBao(idCongKhai: string): Promise<void> {
  await http.post(`/thong-bao/${idCongKhai}/mark-read`);
}

export async function markAllReadThongBao(): Promise<{ message: string; count: number }> {
  return await http.post<{ message: string; count: number }>("/thong-bao/mark-all-read");
}
