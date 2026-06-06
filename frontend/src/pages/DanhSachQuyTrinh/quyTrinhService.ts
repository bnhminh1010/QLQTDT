/* ─────────────────────────────────────────────────────────────────────────────
   Mock store cho Quy Trình (Workflow) — lưu trữ dữ liệu bằng localStorage
   Dùng chung cho trang Lập quy trình và Danh sách quy trình
───────────────────────────────────────────────────────────────────────────── */

export type LoaiBuoc = "Bắt đầu" | "Thường" | "Kết thúc";
export type TrangThaiBuoc = "Đang xử lý" | "Chờ duyệt" | "Hoàn tất";
export type DieuKienChuyen =
  | "Duyệt"
  | "Từ chối"
  | "Yêu cầu kiểm tra"
  | "Trả về";
export type TrangThaiQT = "Đang hoạt động" | "Đã tắt";

export const HINH_THUC_OPTIONS = [
  "Chỉ định thầu rút gọn",
  "Chỉ định thầu tự quyết định",
  "Chỉ định thầu thông thường",
  "Chào hàng cạnh tranh",
  "Đấu thầu rộng rãi",
] as const;

export type HinhThucQT = (typeof HINH_THUC_OPTIONS)[number];

export type Buoc = {
  id: string;
  /** Tên bước thực hiện */
  ten: string;
  /** Loại bước: Bắt đầu / Thường / Kết thúc */
  loai: LoaiBuoc;
  /** Đơn vị phụ trách bước này */
  donViPhuTrach: string;
  /** Vai trò người xử lý */
  vaiTroXuLy: string;
  /** SLA — số ngày xử lý tối đa */
  slaNgay: number;
  /** Trạng thái mặc định khi bước bắt đầu */
  trangThaiMacDinh: TrangThaiBuoc;
  /** Các điều kiện để chuyển sang bước tiếp theo */
  dieuKienChuyen: DieuKienChuyen[];
  /** ID của bước tiếp theo (transition) */
  buocTiepTheoId: string;
  /** Ghi chú thêm */
  moTa: string;
};

export type QuyTrinh = {
  id: string;
  /** Tên quy trình */
  ten: string;
  /** Hình thức đấu thầu áp dụng */
  hinhThuc: HinhThucQT;
  /** Danh sách các bước trong quy trình */
  buocList: Buoc[];
  /** Trạng thái quy trình */
  trangThai: TrangThaiQT;
  /** Ngày tạo ISO string */
  ngayTao: string;
};

/** Khóa lưu trong localStorage */
const KHOA_LUU = "qlqtdt_quy_trinh";

/** Đọc toàn bộ danh sách quy trình từ localStorage */
export function layDanhSachQuyTrinh(): QuyTrinh[] {
  try {
    const raw = localStorage.getItem(KHOA_LUU);
    return raw ? (JSON.parse(raw) as QuyTrinh[]) : [];
  } catch {
    return [];
  }
}

/** Lưu danh sách vào localStorage */
function luuDanhSach(list: QuyTrinh[]): void {
  localStorage.setItem(KHOA_LUU, JSON.stringify(list));
}

/** Thêm quy trình mới vào đầu danh sách */
export function themQuyTrinh(qt: QuyTrinh): void {
  const list = layDanhSachQuyTrinh();
  list.unshift(qt);
  luuDanhSach(list);
}

/** Cập nhật quy trình đã có */
export function capNhatQuyTrinh(qt: QuyTrinh): void {
  luuDanhSach(
    layDanhSachQuyTrinh().map((x) => (x.id === qt.id ? qt : x)),
  );
}

/** Xóa quy trình theo ID */
export function xoaQuyTrinh(id: string): void {
  luuDanhSach(layDanhSachQuyTrinh().filter((x) => x.id !== id));
}

/** Tìm quy trình theo ID */
export function layQuyTrinhTheoId(id: string): QuyTrinh | undefined {
  return layDanhSachQuyTrinh().find((x) => x.id === id);
}

/** Sinh mã quy trình duy nhất */
export function sinhMaQuyTrinh(): string {
  return `QT${Date.now()}`;
}

// ─── Alias tương thích ngược (dùng trong các file cũ) ────────────────────────
export const getQuyTrinhList = layDanhSachQuyTrinh;
export const addQuyTrinh = themQuyTrinh;
export const updateQuyTrinh = capNhatQuyTrinh;
export const deleteQuyTrinh = xoaQuyTrinh;
export const getQuyTrinhById = layQuyTrinhTheoId;
export const generateQuyTrinhId = sinhMaQuyTrinh;
