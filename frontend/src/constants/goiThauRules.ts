export const HINH_THUC_MA = {
  CHI_DINH_THAU_RUT_GON: "CHI_DINH_THAU_RUT_GON",
  CHI_DINH_THAU: "CHI_DINH_THAU",
  CHAO_HANG_CANH_TRANH: "CHAO_HANG_CANH_TRANH",
  DAU_THAU_RONG_RAI: "DAU_THAU_RONG_RAI",
  MUA_SAM_TRUC_TIEP: "MUA_SAM_TRUC_TIEP",
  CHAO_GIA_TRUC_TUYEN: "CHAO_GIA_TRUC_TUYEN",
  DAT_HANG: "DAT_HANG",
} as const;

/** Ngân sách tối đa cho chỉ định thầu rút gọn (VND) */
export const NGAN_SACH_CHI_DINH_THAU_RUT_GON_TOI_DA = 500_000_000;

/** Ngân sách tối đa cho các hình thức khác (VND) */
export const NGAN_SACH_CHAO_HANG_CANH_TRANH_TOI_DA = 5_000_000_000;
export const NGAN_SACH_CHAO_GIA_TRUC_TUYEN_TOI_DA = 200_000_000;
export const NGAN_SACH_MUA_SAM_TRUC_TIEP_TOI_DA = 100_000_000;
export const NGAN_SACH_DAT_HANG_TOI_DA = 50_000_000;

/** Tên hiển thị của các hình thức rút gọn */
export const RUT_GON_DISPLAY_NAMES = new Set<string>([
  "Chỉ định thầu rút gọn",
]);

export function isRutGon(tenHinhThuc: string): boolean {
  return RUT_GON_DISPLAY_NAMES.has(tenHinhThuc);
}

/**
 * Lấy ngân sách tối đa cho một hình thức đấu thầu (dựa trên tên hiển thị).
 * null = không giới hạn.
 */
export function getHanMucToiDa(tenHinhThuc: string): number | null {
  switch (tenHinhThuc) {
    case "Chỉ định thầu rút gọn":
      return NGAN_SACH_CHI_DINH_THAU_RUT_GON_TOI_DA;
    case "Chào hàng cạnh tranh":
      return NGAN_SACH_CHAO_HANG_CANH_TRANH_TOI_DA;
    case "Chào giá trực tuyến thông thường":
    case "Chào giá trực tuyến rút gọn":
      return NGAN_SACH_CHAO_GIA_TRUC_TUYEN_TOI_DA;
    case "Mua sắm trực tiếp":
      return NGAN_SACH_MUA_SAM_TRUC_TIEP_TOI_DA;
    case "Mua sắm trực tuyến":
      return NGAN_SACH_MUA_SAM_TRUC_TIEP_TOI_DA;
    case "Đặt hàng":
      return NGAN_SACH_DAT_HANG_TOI_DA;
    default:
      return null;
  }
}
