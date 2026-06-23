export const RUT_GON_THRESHOLD_BY_LOAI_GOI_THAU: Record<string, number> = {
  "Dịch vụ tư vấn": 500_000_000,
  "Hàng hóa": 1_000_000_000,
  "Dịch vụ phi tư vấn": 1_000_000_000,
  "Xây lắp": 1_000_000_000,
};

export type RutGonValidationInput = {
  hinhThuc?: string | null;
  loaiGoiThau?: string | null;
  giaTriStr?: string | number | null;
  canCuApDungRutGon?: string | null;
};

export type RutGonValidationResult = {
  valid: boolean;
  message?: string;
  threshold?: number;
};

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function parseMoneyToNumber(value?: string | number | null): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return Number(digits) || 0;
}

export function isRutGonHinhThuc(hinhThuc?: string | null) {
  return normalize(hinhThuc).includes("rut gon");
}

export function getRutGonThreshold(loaiGoiThau?: string | null) {
  const exact = RUT_GON_THRESHOLD_BY_LOAI_GOI_THAU[loaiGoiThau ?? ""];
  if (exact) return exact;

  const normalized = normalize(loaiGoiThau);
  if (normalized.includes("tu van") && !normalized.includes("phi")) return 500_000_000;
  if (normalized.includes("hang hoa")) return 1_000_000_000;
  if (normalized.includes("phi tu van")) return 1_000_000_000;
  if (normalized.includes("xay lap")) return 1_000_000_000;
  return null;
}

export function validateRutGonGoiThau(input: RutGonValidationInput): RutGonValidationResult {
  if (!isRutGonHinhThuc(input.hinhThuc)) return { valid: true };

  const giaTri = parseMoneyToNumber(input.giaTriStr);
  if (giaTri <= 0) {
    return { valid: false, message: "Giá gói thầu phải lớn hơn 0 khi áp dụng quy trình rút gọn." };
  }

  if (!input.loaiGoiThau?.trim()) {
    return { valid: false, message: "Vui lòng chọn loại gói thầu khi áp dụng quy trình rút gọn." };
  }

  if (!input.canCuApDungRutGon?.trim()) {
    return { valid: false, message: "Vui lòng nhập căn cứ áp dụng quy trình rút gọn." };
  }

  const threshold = getRutGonThreshold(input.loaiGoiThau);
  if (!threshold) {
    return { valid: false, message: "Chưa cấu hình hạn mức cho loại gói thầu áp dụng quy trình rút gọn." };
  }

  if (giaTri > threshold) {
    return {
      valid: false,
      threshold,
      message: `Gói thầu không đủ điều kiện áp dụng quy trình rút gọn. Giá trị gói thầu vượt hạn mức ${threshold.toLocaleString("vi-VN")} VND.`,
    };
  }

  return { valid: true, threshold };
}
