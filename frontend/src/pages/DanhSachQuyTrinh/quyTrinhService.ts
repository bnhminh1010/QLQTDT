/* ─────────────────────────────────────────────────────────────────────────────
   Mock store cho Quy Trình (Workflow) — lưu trữ dữ liệu bằng localStorage
   Dùng chung cho trang Lập quy trình và Danh sách quy trình
───────────────────────────────────────────────────────────────────────────── */

export type LoaiBuoc =
  | "Bắt đầu"
  | "Thường"
  | "Ký duyệt"
  | "Đăng tải"
  | "Đánh giá/kiểm tra"
  | "Hợp đồng"
  | "Kết thúc";
export type TrangThaiBuoc =
  | "Chưa bắt đầu"
  | "Đang xử lý"
  | "Chờ ký duyệt"
  | "Hoàn thành";
export type DieuKienChuyen =
  | "Duyệt"
  | "Từ chối"
  | "Yêu cầu kiểm tra"
  | "Trả về";
export type LoaiThoiHan =
  | "Chỉ cảnh báo quá hạn"
  | "Bắt buộc hoàn thành trước hạn";
export type HanhDongChuyen =
  | "Hoàn thành / Duyệt"
  | "Không duyệt"
  | "Trả về"
  | "Yêu cầu bổ sung"
  | "Bỏ qua bước";
export type DieuKienKichHoat = "Luôn" | "Theo vai trò" | "Theo kết quả xử lý";
export type TrangThaiQT = "Đang hoạt động" | "Đã tắt";

export type DieuKienChuyenTiep = {
  id: string;
  hanhDong: HanhDongChuyen;
  buocChuyenDenId: string;
  dieuKienKichHoat: DieuKienKichHoat;
  ketQuaApDung?: string;
  vaiTroApDung?: string;
  batBuocGhiChu: boolean;
  batBuocUpload: boolean;
};

export type NhanhSongSong = {
  id: string;
  tenNhanh: string;
  donVi: string;
  vaiTro: string;
  thoiHanNgay: number;
  loaiThoiHan: LoaiThoiHan;
  buocDauTienId: string;
};

export const HINH_THUC_OPTIONS = [
  "Chỉ định thầu tự quyết định LCNT",
  "Chỉ định thầu rút gọn",
  "Chỉ định thầu tự quyết định",
  "Chỉ định thầu thông thường",
  "Chào hàng cạnh tranh",
  "Đấu thầu rộng rãi",
  "Mua sắm trực tiếp",
  "Chào giá trực tuyến thông thường",
  "Chào giá trực tuyến rút gọn",
  "Mua sắm trực tuyến",
  "Đặt hàng",
] as const;

export type HinhThucQT = (typeof HINH_THUC_OPTIONS)[number];

export type Buoc = {
  id: string;
  /** Tên bước thực hiện */
  ten: string;
  /** Loại bước */
  loai: LoaiBuoc;
  /** Nhóm giai đoạn (tuỳ chọn) */
  nhomGiaiDoan?: string;
  /** Đơn vị phụ trách / soạn hồ sơ */
  donViPhuTrach: string;
  /** Vai trò người xử lý */
  vaiTroXuLy: string;
  /** Thời hạn xử lý — số ngày (cho phép 0 và thập phân) */
  slaNgay: number;
  /** Loại thời hạn: cảnh báo / bắt buộc */
  loaiThoiHan: LoaiThoiHan;
  /** Trạng thái mặc định khi bước bắt đầu */
  trangThaiMacDinh: TrangThaiBuoc;
  /** Có yêu cầu ký duyệt */
  coKyDuyet: boolean;
  /** Đơn vị kiểm tra/ký hồ sơ (khi coKyDuyet = true) */
  donViKyHoSo?: string;
  /** Vai trò ký duyệt (khi coKyDuyet = true) */
  vaiTroKyDuyet?: string;
  /** Số ngày ký duyệt */
  soNgayKyDuyet?: number;
  /** Bắt buộc ký trước khi chuyển bước */
  batBuocKyTruocChuyenBuoc: boolean;
  /** Bảng điều kiện chuyển tiếp */
  dieuKienChuyenTiep: DieuKienChuyenTiep[];
  /** Có tạo nhánh song song */
  coNhanhSongSong: boolean;
  /** Danh sách nhánh song song */
  nhanhList: NhanhSongSong[];
  /** Điều kiện hợp nhất nhánh */
  dieuKienHopNhat: "all" | "any" | "count";
  /** Số nhánh tối thiểu (khi dieuKienHopNhat = "count") */
  soNhanhHopNhatToiThieu: number;
  /** Bước tiếp theo sau khi tất cả nhánh hợp nhất */
  buocSauHopNhatId?: string;
  /** Ghi chú thêm */
  moTa: string;
  /** @deprecated dùng dieuKienChuyenTiep thay thế */
  dieuKienChuyen: DieuKienChuyen[];
  /** @deprecated dùng dieuKienChuyenTiep thay thế */
  buocTiepTheoId: string;
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
  luuDanhSach(layDanhSachQuyTrinh().map((x) => (x.id === qt.id ? qt : x)));
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
