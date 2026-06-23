/* ─────────────────────────────────────────────────────────────
   Gói Thầu service — API calls to backend, backward-compat types
───────────────────────────────────────────────────────────── */
import {
  searchGoiThau,
  createGoiThau as createGoiThauApi,
  updateGoiThau as updateGoiThauApi,
  type GoiThauItem,
} from "@/services/goiThauApi";

/* ─── Types (backward‑compat with existing pages) ───────── */

export type TrangThai =
  | "Đang xử lý"
  | "Hoàn thành"
  | "Trễ hạn"
  | "Chờ duyệt"
  | "Đã hủy"
  | "Nháp";

export type HinhThuc = string;
export type LoaiGoiThau = string;

export type GoiThau = {
  id: string;                  // string form "GT{number}" for compat
  maGoiThau: string;
  ten: string;
  tenGoiThau: string;
  loaiGoiThau?: LoaiGoiThau;
  hinhThuc: HinhThuc;
  theoDoi?: string[];
  giaTriStr: string;
  giaTriNum: number;
  donVi: string;
  trangThai: TrangThai;
  detail: {
    nguonVon: string;
    ngayTao: string;
    hanHT: string;
    pct: string;
    buoc: string;
  };
};

const TRANG_THAI_MAP: Record<string, TrangThai> = {
  DU_THAO: "Nháp",
  DANG_XU_LY: "Đang xử lý",
  HOAN_THANH: "Hoàn thành",
  HUY_BO: "Đã hủy",
  QUA_HAN: "Trễ hạn",
  DA_CHON_NHA_THAU: "Chờ duyệt",
};

function mapItem(item: GoiThauItem): GoiThau {
  const pct = item.tongSoBuoc > 0
    ? Math.round((item.soBuocHoanThanh / item.tongSoBuoc) * 100)
    : 0;
  return {
    id: `GT${item.id}`,
    maGoiThau: item.maGoiThau,
    ten: item.tenGoiThau,
    tenGoiThau: item.tenGoiThau,
    hinhThuc: item.tenHinhThuc ?? "",
    giaTriStr: (item.nganSach ?? 0).toLocaleString("vi-VN"),
    giaTriNum: item.nganSach ?? 0,
    donVi: item.tenKhoaPhong ?? "",
    trangThai: TRANG_THAI_MAP[item.trangThai] ?? item.trangThai,
    detail: {
      nguonVon: "",
      ngayTao: item.ngayTao?.slice(0, 10) ?? "",
      hanHT: "",
      pct: `${pct}%`,
      buoc: `${item.soBuocHoanThanh}/${item.tongSoBuoc}`,
    },
  };
}

/* ─── API helpers ───────────────────────────────────────── */

export const getUserGoiThauList = async (): Promise<GoiThau[]> => {
  try {
    const result = await searchGoiThau({ page: 1, pageSize: 100 });
    return result.items.map(mapItem);
  } catch {
    return [];
  }
};

export const layDanhSachGoiThau = getUserGoiThauList;

export const getGoiThauById = async (id: string): Promise<GoiThau | undefined> => {
  // Try detail API first
  const numId = parseInt(id.replace(/^GT/, ''), 10);
  if (!isNaN(numId)) {
    try {
      const { getGoiThauChiTiet } = await import('@/services/goiThauApi');
      const detail = await getGoiThauChiTiet(numId);
      const list = await getUserGoiThauList();
      const fallback = list.find((g) => g.id === id || g.maGoiThau === id);
      return mapItem({ ...fallback, ...detail } as any);
    } catch { /* fallback to list search */ }
  }
  const list = await getUserGoiThauList();
  return list.find((g) => g.id === id || g.maGoiThau === id);
};

export const addGoiThau = async (item: Partial<GoiThau>): Promise<void> => {
  try {
    await createGoiThauApi({
      tenGoiThau: item.tenGoiThau || item.ten || '',
      moTa: item.maGoiThau || '',
      nganSach: item.giaTriNum || 0,
    });
  } catch { /* silent */ }
};
export const themGoiThau = addGoiThau;

export const updateGoiThau = async (item: Partial<GoiThau>): Promise<void> => {
  const numId = parseInt((item.id || '').replace(/^GT/, ''), 10);
  if (isNaN(numId)) return;
  try {
    await updateGoiThauApi(numId, {
      tenGoiThau: item.tenGoiThau || item.ten || '',
      moTa: item.maGoiThau || '',
      nganSach: item.giaTriNum || 0,
    });
  } catch { /* silent */ }
};
export const capNhatGoiThau = updateGoiThau;

export const formatVND = (s: string) => s.replace(/,/g, ".") + " đ";
export const dinhDangVND = formatVND;
export const sinhMaGoiThau = () => `GT${Date.now()}`;

// Re-export alias used by other pages
export { sinhMaGoiThau as generateGoiThauId };
