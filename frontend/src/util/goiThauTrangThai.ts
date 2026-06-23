export type GoiThauTrangThaiLabel =
  | "Nháp"
  | "Chờ duyệt"
  | "Đang xử lý"
  | "Hoàn thành"
  | "Trễ hạn"
  | "Đã hủy"
  | "Đã chọn nhà thầu";

export type GoiThauBarColor = "blue" | "green" | "red" | "amber" | "slate" | "purple";

export const GOI_THAU_TRANG_THAI = {
  DU_THAO: "DU_THAO",
  CHO_DUYET: "CHO_DUYET",
  DANG_XU_LY: "DANG_XU_LY",
  HOAN_THANH: "HOAN_THANH",
  HUY_BO: "HUY_BO",
  QUA_HAN: "QUA_HAN",
  DA_CHON_NHA_THAU: "DA_CHON_NHA_THAU",
} as const;

const LABEL_BY_STATUS: Record<string, GoiThauTrangThaiLabel> = {
  DU_THAO: "Nháp",
  NHAP: "Nháp",
  "Nháp": "Nháp",
  CHO_DUYET: "Chờ duyệt",
  "Chờ duyệt": "Chờ duyệt",
  DANG_XU_LY: "Đang xử lý",
  "Đang xử lý": "Đang xử lý",
  HOAN_THANH: "Hoàn thành",
  "Hoàn thành": "Hoàn thành",
  QUA_HAN: "Trễ hạn",
  TRE_HAN: "Trễ hạn",
  "Trễ hạn": "Trễ hạn",
  HUY_BO: "Đã hủy",
  "Đã hủy": "Đã hủy",
  DA_CHON_NHA_THAU: "Đã chọn nhà thầu",
  "Đã chọn nhà thầu": "Đã chọn nhà thầu",
};

const API_BY_LABEL: Record<GoiThauTrangThaiLabel, string> = {
  "Nháp": GOI_THAU_TRANG_THAI.DU_THAO,
  "Chờ duyệt": GOI_THAU_TRANG_THAI.CHO_DUYET,
  "Đang xử lý": GOI_THAU_TRANG_THAI.DANG_XU_LY,
  "Hoàn thành": GOI_THAU_TRANG_THAI.HOAN_THANH,
  "Trễ hạn": GOI_THAU_TRANG_THAI.QUA_HAN,
  "Đã hủy": GOI_THAU_TRANG_THAI.HUY_BO,
  "Đã chọn nhà thầu": GOI_THAU_TRANG_THAI.DA_CHON_NHA_THAU,
};

export function toGoiThauTrangThaiLabel(status?: string | null): GoiThauTrangThaiLabel {
  if (!status) return "Nháp";
  return LABEL_BY_STATUS[status] ?? "Nháp";
}

export function toGoiThauTrangThaiApi(status?: string | null): string {
  const label = toGoiThauTrangThaiLabel(status);
  return API_BY_LABEL[label];
}

export function getGoiThauTrangThaiBadge(status?: string | null) {
  const label = toGoiThauTrangThaiLabel(status);
  const map: Record<GoiThauTrangThaiLabel, string> = {
    "Nháp": "bg-purple-100 text-purple-600",
    "Chờ duyệt": "bg-amber-100 text-amber-700",
    "Đang xử lý": "bg-blue-100 text-blue-700",
    "Hoàn thành": "bg-emerald-100 text-emerald-700",
    "Trễ hạn": "bg-red-100 text-red-600",
    "Đã hủy": "bg-slate-100 text-slate-500",
    "Đã chọn nhà thầu": "bg-emerald-100 text-emerald-700",
  };
  return map[label];
}

export function getGoiThauTrangThaiBarColor(status?: string | null): GoiThauBarColor {
  const label = toGoiThauTrangThaiLabel(status);
  const map: Record<GoiThauTrangThaiLabel, GoiThauBarColor> = {
    "Nháp": "purple",
    "Chờ duyệt": "amber",
    "Đang xử lý": "blue",
    "Hoàn thành": "green",
    "Trễ hạn": "red",
    "Đã hủy": "slate",
    "Đã chọn nhà thầu": "green",
  };
  return map[label];
}
