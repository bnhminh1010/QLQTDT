/* ─────────────────────────────────────────────────────────────
   Gói Thầu service — API calls to backend, backward-compat types
───────────────────────────────────────────────────────────── */
import {
  searchGoiThau,
  createGoiThauFull as createGoiThauFullApi,
  updateGoiThauFull as updateGoiThauFullApi,
  type GoiThauItem,
  type CreateGoiThauFullRequest,
  type UpdateGoiThauFullRequest,
} from "@/services/goiThauApi";
import type { HinhThucDauThau } from "@/services/hinhThauApi";
import { toGoiThauTrangThaiLabel } from "@/util/goiThauTrangThai";

/* ─── Types (backward-compat with existing pages) ───────── */

export type TrangThai =
  | "Đang xử lý"
  | "Hoàn thành"
  | "Trễ hạn"
  | "Chờ duyệt"
  | "Đã hủy"
  | "Nháp"
  | "Đã chọn nhà thầu";

export type HinhThuc = string;
export type LoaiGoiThau = string;

export type GoiThau = {
  id: string;
  maGoiThau: string;
  ten: string;
  tenGoiThau: string;
  loaiGoiThau?: LoaiGoiThau;
  hinhThuc: HinhThuc;
  ghiChu?: string;
  canCuApDungRutGon?: string;
  theoDoi?: string[];
  workflowId?: number;
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

// Cache to avoid calling getAllHinhThuc many times
let _hinhThucCache: HinhThucDauThau[] | null = null;
let _hinhThucCachePromise: Promise<HinhThucDauThau[]> | null = null;

async function getHinhThucList(): Promise<HinhThucDauThau[]> {
  if (_hinhThucCache) return _hinhThucCache;
  if (_hinhThucCachePromise) return _hinhThucCachePromise;
  _hinhThucCachePromise = (async () => {
    const { getAllHinhThuc } = await import('@/services/hinhThauApi');
    const list = await getAllHinhThuc();
    _hinhThucCache = list;
    return list;
  })();
  const result = await _hinhThucCachePromise;
  _hinhThucCachePromise = null;
  return result;
}

function normalizeText(value?: string): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tenHinhThucToId(tenHinhThuc?: string): number | undefined {
  if (!tenHinhThuc) return undefined;
  if (!_hinhThucCache) return undefined;

  const normalizedName = normalizeText(tenHinhThuc);

  return _hinhThucCache.find(
    ht => normalizeText(ht.tenHinhThuc) === normalizedName
  )?.id;
}

/** Resolve tenKhoaPhong → khoaPhongId (for KhoaPhong dropdown in form) */
let _khoaPhongCache: { id: number; tenKhoaPhong: string }[] | null = null;
function tenKhoaPhongToId(ten?: string): number | undefined {
  if (!ten || !_khoaPhongCache) return undefined;
  return _khoaPhongCache.find(kp => kp.tenKhoaPhong === ten)?.id;
}
async function ensureKhoaPhongCache(): Promise<void> {
  if (_khoaPhongCache) return;
  try {
    const { getKhoaPhongs } = await import('@/services/adminApi');
    _khoaPhongCache = await getKhoaPhongs();
  } catch { _khoaPhongCache = []; }
}

function mapItem(item: GoiThauItem): GoiThau {
  const pct = item.tongSoBuoc > 0
    ? Math.round((item.soBuocHoanThanh / item.tongSoBuoc) * 100)
    : 0;
  // Override trangThai based on step completion, not DB value directly
  // DB TrangThai may be stale (seed data), step counts are real-time
  const computedTrangThai: TrangThai = item.tongSoBuoc > 0
    ? item.soBuocHoanThanh >= item.tongSoBuoc
      ? "Hoàn thành"
      : "Đang xử lý"
    : toGoiThauTrangThaiLabel(item.trangThai);
  return {
    id: `GT${item.id}`,
    maGoiThau: item.maGoiThau,
    ten: item.tenGoiThau,
    tenGoiThau: item.tenGoiThau,
    hinhThuc: item.tenHinhThuc ?? "",
    workflowId: item.workflowId,
    giaTriStr: (item.nganSach ?? 0).toLocaleString("vi-VN"),
    giaTriNum: item.nganSach ?? 0,
    donVi: item.tenKhoaPhong ?? "",
    trangThai: computedTrangThai,
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

/** Send full payload with hinhThucId resolution */
export const addGoiThau = async (item: Partial<GoiThau>): Promise<void> => {
  await getHinhThucList();
  await ensureKhoaPhongCache();


  const hinhThucId = tenHinhThucToId(item.hinhThuc);

  const payload: CreateGoiThauFullRequest = {
    tenGoiThau: item.tenGoiThau || item.ten || '',
    moTa: item.ghiChu || '',
    nganSach: item.giaTriNum || 0,
    hinhThucId: hinhThucId ?? 0,
    khoaPhongId: tenKhoaPhongToId(item.donVi),
    workflowId: item.workflowId,
    nguonVon: item.detail?.nguonVon,
    loaiGoiThau: item.loaiGoiThau,
    canCuApDungRutGon: item.canCuApDungRutGon,
    theoDoi: item.theoDoi ? JSON.stringify(item.theoDoi) : undefined,
  };

  await createGoiThauFullApi(payload);
};
export const themGoiThau = addGoiThau;

/** Send full payload with hinhThucId resolution */
export const updateGoiThau = async (item: Partial<GoiThau>): Promise<void> => {
  const numId = parseInt((item.id || '').replace(/^GT/, ''), 10);
  if (isNaN(numId)) return;
  await getHinhThucList();
  await ensureKhoaPhongCache();

  const hinhThucId = tenHinhThucToId(item.hinhThuc);

  if (!hinhThucId) {
    throw new Error(`Không tìm thấy hình thức đấu thầu: ${item.hinhThuc}`);
  }

  const payload: UpdateGoiThauFullRequest = {
    tenGoiThau: item.tenGoiThau || item.ten || '',
    moTa: item.ghiChu || '',
    nganSach: item.giaTriNum || 0,
    hinhThucId,
    nguonVon: item.detail?.nguonVon,
    loaiGoiThau: item.loaiGoiThau,
    canCuApDungRutGon: item.canCuApDungRutGon,
    theoDoi: item.theoDoi ? JSON.stringify(item.theoDoi) : undefined,
  };

  await updateGoiThauFullApi(numId, payload);
};
export const capNhatGoiThau = updateGoiThau;

export const formatVND = (s: string) => s.replace(/,/g, ".") + " đ";
export const dinhDangVND = formatVND;
export const sinhMaGoiThau = () => `GT${Date.now()}`;

export { sinhMaGoiThau as generateGoiThauId };
