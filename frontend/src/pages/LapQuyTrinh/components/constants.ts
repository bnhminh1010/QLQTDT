/* ─── Badge helpers ────────────────────────────────────────── */

interface BadgeMap {
  [key: string]: string;
}

const HT_BADGE: BadgeMap = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
  "Mua sắm trực tiếp": "bg-cyan-100 text-cyan-700",
  "Chào giá trực tuyến thông thường": "bg-indigo-100 text-indigo-700",
  "Chào giá trực tuyến rút gọn": "bg-indigo-100 text-indigo-700",
  "Mua sắm trực tuyến": "bg-teal-100 text-teal-700",
  "Đặt hàng": "bg-orange-100 text-orange-700",
};

export const LOAI_HINH_DAU_THAU = [
  "Chỉ định thầu rút gọn",
  "Chỉ định thầu thông thường",
  "Chào hàng cạnh tranh",
  "Đấu thầu rộng rãi",
  "Mua sắm trực tiếp",
  "Chào giá trực tuyến thông thường",
  "Chào giá trực tuyến rút gọn",
  "Mua sắm trực tuyến",
  "Đặt hàng",
] as const;

export function getHtBadge(hinhThuc: string): string {
  return HT_BADGE[hinhThuc] ?? "bg-slate-100 text-slate-600";
}
