/* ─────────────────────────────────────────────────────────────────────────────
   Mock store cho Gói Thầu — lưu trữ dữ liệu bằng localStorage
   Dùng chung cho trang Tạo gói thầu và Danh sách gói thầu
───────────────────────────────────────────────────────────────────────────── */

export type TrangThai =
  | "Đang xử lý"
  | "Hoàn thành"
  | "Trễ hạn"
  | "Chờ duyệt"
  | "Đã hủy"
  | "Nháp";

export type HinhThuc =
  | "Chỉ định thầu rút gọn"
  | "Chỉ định thầu tự quyết định"
  | "Chỉ định thầu tự quyết định LCNT"
  | "Chỉ định thầu thông thường"
  | "Chào hàng cạnh tranh"
  | "Đấu thầu rộng rãi"
  | "Mua sắm trực tiếp"
  | "Chào giá trực tuyến thông thường"
  | "Chào giá trực tuyến rút gọn"
  | "Mua sắm trực tuyến"
  | "Đặt hàng";

export type LoaiGoiThau =
  | "Hàng hóa"
  | "Dịch vụ tư vấn"
  | "Dịch vụ phi tư vấn"
  | "Xây lắp";

export type GoiThau = {
  id: string;
  ten: string;
  loaiGoiThau?: LoaiGoiThau;
  hinhThuc: HinhThuc;
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

/** Khóa lưu trong localStorage */
const KHOA_LUU = "qlqtdt_goi_thau_user";

/** Đọc danh sách gói thầu do người dùng tạo từ localStorage */
export function layDanhSachGoiThau(): GoiThau[] {
  try {
    const raw = localStorage.getItem(KHOA_LUU);
    return raw ? (JSON.parse(raw) as GoiThau[]) : [];
  } catch {
    return [];
  }
}

/** Lưu danh sách vào localStorage */
function luuDanhSach(list: GoiThau[]): void {
  localStorage.setItem(KHOA_LUU, JSON.stringify(list));
}

/** Thêm gói thầu mới vào đầu danh sách */
export function themGoiThau(item: GoiThau): void {
  const list = layDanhSachGoiThau();
  list.unshift(item);
  luuDanhSach(list);
}

/** Cập nhật hoặc thêm mới gói thầu vào localStorage */
export function capNhatGoiThau(item: GoiThau): void {
  const list = layDanhSachGoiThau();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  luuDanhSach(list);
}

/** Tìm gói thầu đã lưu theo mã */
export function layGoiThauTheoId(id: string): GoiThau | undefined {
  return layDanhSachGoiThau().find((x) => x.id === id);
}

/** Sinh mã gói thầu duy nhất */
export function sinhMaGoiThau(): string {
  const nam = new Date().getFullYear();
  const ts = Date.now().toString().slice(-5);
  return `GT${nam}-U${ts}`;
}

/** Định dạng số thành chuỗi tiền VNĐ có dấu chấm phân cách hàng nghìn */
export function dinhDangVND(s: string): string {
  const clean = s.replace(/[^\d]/g, "");
  const n = parseInt(clean, 10);
  if (!clean || isNaN(n) || n <= 0) return s;
  return n.toLocaleString("vi-VN");
}

// ─── Alias tương thích ngược (dùng trong các file cũ) ────────────────────────
export const getUserGoiThauList = layDanhSachGoiThau;
export const addGoiThau = themGoiThau;
export const updateGoiThau = capNhatGoiThau;
export const getGoiThauById = layGoiThauTheoId;
export const generateGoiThauId = sinhMaGoiThau;
export const formatVND = dinhDangVND;
