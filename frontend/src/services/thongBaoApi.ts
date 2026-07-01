/* ─────────────────────────────────────────────────────────────
   Thông báo API
───────────────────────────────────────────────────────────── */
import http from "@/util/http";

export type ThongBaoItem = {
  idCongKhai: string;
  loaiThongBao: string;
  trangThai?: string;
  mucDo?: string;
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
  return await http.get<ThongBaoListResponse>("/thong-bao", { params });
}

export async function markReadThongBao(idCongKhai: string): Promise<void> {
  await http.post(`/thong-bao/${idCongKhai}/mark-read`);
}

export async function markAllReadThongBao(): Promise<{ message: string; count: number }> {
  return await http.post<{ message: string; count: number }>("/thong-bao/mark-all-read");
}
