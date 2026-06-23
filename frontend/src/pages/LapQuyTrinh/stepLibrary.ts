/* ─────────────────────────────────────────────────────────────
   Thư viện bước mẫu
   Dùng khi Admin chọn + Thêm bước → Từ thư viện bước
───────────────────────────────────────────────────────────── */

export type StepLibraryEntry = {
  id: string;
  tenBuoc: string;
  loaiBuoc: string;
  donViPhuTrach?: string;
  vaiTroXuLy?: string;
  slaNgay?: number;
  loaiThoiHan?: "Chỉ cảnh báo quá hạn" | "Bắt buộc hoàn thành trước hạn";
  coKyDuyet?: boolean;
  donViKyHoSo?: string;
  vaiTroKyDuyet?: string;
  moTa?: string;
};

const STEP_LIBRARY: StepLibraryEntry[] = [
  {
    id: "lib_dxms",
    tenBuoc: "Đề xuất mua sắm/sửa chữa",
    loaiBuoc: "Thường",
    donViPhuTrach: "K/P mua sắm",
    vaiTroXuLy: "Nhân viên K/P mua sắm",
    slaNgay: 1,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
  },
  {
    id: "lib_ttct",
    tenBuoc: "Tờ trình chủ trương",
    loaiBuoc: "Thường",
    donViPhuTrach: "K/P mua sắm",
    vaiTroXuLy: "Nhân viên K/P mua sắm",
    slaNgay: 2,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
    coKyDuyet: true,
    donViKyHoSo: "Giám đốc BV",
    vaiTroKyDuyet: "Giám đốc BV",
  },
  {
    id: "lib_dtycbg",
    tenBuoc: "Đăng tải yêu cầu báo giá",
    loaiBuoc: "Đăng tải",
    donViPhuTrach: "K/P mua sắm",
    vaiTroXuLy: "Nhân viên K/P mua sắm",
    slaNgay: 0.5,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
  },
  {
    id: "lib_bbktbg",
    tenBuoc: "Biên bản kiểm tra báo giá",
    loaiBuoc: "Thường",
    donViPhuTrach: "Tổ kiểm tra giá",
    vaiTroXuLy: "Tổ kiểm tra giá",
    slaNgay: 1,
    loaiThoiHan: "Bắt buộc hoàn thành trước hạn",
  },
  {
    id: "lib_laphsmt",
    tenBuoc: "Lập HSMT",
    loaiBuoc: "Thường",
    donViPhuTrach: "Tư vấn LCNT",
    vaiTroXuLy: "Tư vấn LCNT",
    slaNgay: 5,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
  },
  {
    id: "lib_phathsm",
    tenBuoc: "Phát hành HSMT",
    loaiBuoc: "Đăng tải",
    donViPhuTrach: "K/P mua sắm",
    vaiTroXuLy: "Nhân viên K/P mua sắm",
    slaNgay: 0.5,
    loaiThoiHan: "Bắt buộc hoàn thành trước hạn",
  },
  {
    id: "lib_mothau",
    tenBuoc: "Mở thầu Online",
    loaiBuoc: "Thường",
    donViPhuTrach: "K/P mua sắm",
    vaiTroXuLy: "Nhân viên K/P mua sắm",
    slaNgay: 0.5,
    loaiThoiHan: "Bắt buộc hoàn thành trước hạn",
  },
  {
    id: "lib_bcdghsdt",
    tenBuoc: "Báo cáo đánh giá HSDT",
    loaiBuoc: "Đánh giá/kiểm tra",
    donViPhuTrach: "Tổ chuyên gia",
    vaiTroXuLy: "Tổ chuyên gia",
    slaNgay: 3,
    loaiThoiHan: "Bắt buộc hoàn thành trước hạn",
  },
  {
    id: "lib_hd",
    tenBuoc: "Hợp đồng",
    loaiBuoc: "Hợp đồng",
    donViPhuTrach: "K/P mua sắm",
    vaiTroXuLy: "Nhân viên K/P mua sắm",
    slaNgay: 5,
    loaiThoiHan: "Chỉ cảnh báo quá hạn",
    coKyDuyet: true,
    donViKyHoSo: "Giám đốc BV",
    vaiTroKyDuyet: "Giám đốc BV",
  },
];

export function getStepLibrary(): StepLibraryEntry[] {
  return STEP_LIBRARY;
}

export function searchStepLibrary(query: string): StepLibraryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return STEP_LIBRARY;
  return STEP_LIBRARY.filter(
    (s) =>
      s.tenBuoc.toLowerCase().includes(q) ||
      s.donViPhuTrach?.toLowerCase().includes(q)
  );
}

export function getStepById(id: string): StepLibraryEntry | undefined {
  return STEP_LIBRARY.find((s) => s.id === id);
}
