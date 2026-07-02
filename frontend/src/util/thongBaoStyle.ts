export type ThongBaoPriority =
  | "overdue"
  | "warning"
  | "new"
  | "success"
  | "cancelled"
  | "info";

type ThongBaoSource = {
  loaiThongBao?: string | null;
  trangThai?: string | null;
  mucDo?: string | null;
  tieuDe?: string | null;
};

type ThongBaoStyle = {
  label: string;
  icon: string;
  iconClassName: string;
  titleClassName: string;
  badgeClassName: string;
  dotClassName: string;
};

const THONG_BAO_STYLE: Record<ThongBaoPriority, ThongBaoStyle> = {
  overdue: {
    label: "Quá hạn",
    icon: "fa-triangle-exclamation",
    iconClassName: "bg-red-50 text-red-600 border border-red-100",
    titleClassName: "text-red-700",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    dotClassName: "bg-red-500",
  },
  warning: {
    label: "Sắp tới hạn",
    icon: "fa-hourglass-half",
    iconClassName: "bg-amber-50 text-amber-600 border border-amber-100",
    titleClassName: "text-amber-700",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  new: {
    label: "Mới",
    icon: "fa-circle-plus",
    iconClassName: "bg-blue-50 text-blue-600 border border-blue-100",
    titleClassName: "text-blue-700",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-500",
  },
  success: {
    label: "Hoàn thành",
    icon: "fa-circle-check",
    iconClassName: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    titleClassName: "text-emerald-700",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  cancelled: {
    label: "Đã hủy",
    icon: "fa-circle-xmark",
    iconClassName: "bg-slate-100 text-slate-500 border border-slate-200",
    titleClassName: "text-slate-600",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-500",
    dotClassName: "bg-slate-400",
  },
  info: {
    label: "Thông tin",
    icon: "fa-bell",
    iconClassName: "bg-slate-100 text-slate-500 border border-slate-200",
    titleClassName: "text-slate-700",
    badgeClassName: "border-slate-200 bg-white text-slate-500",
    dotClassName: "bg-slate-400",
  },
};

const FIELD_PRIORITY_RULES: Array<[RegExp, ThongBaoPriority]> = [
  [/\b(QUA_HAN|TRE_HAN|OVERDUE|LATE|CRITICAL)\b/, "overdue"],
  [/\b(SAP_TOI_HAN|DUE_SOON|NEAR_DUE|WARNING|WARN)\b/, "warning"],
  [/\b(GOI_THAU_MOI|BUOC_MOI|NEW|MOI)\b/, "new"],
  [/\b(HOAN_THANH|COMPLETED|APPROVED|PHE_DUYET|PHEDUYET|OK|SUCCESS)\b/, "success"],
  [/\b(DA_HUY|HUY|CANCELLED|CANCELED|FAILED|REJECTED|TU_CHOI|ERROR)\b/, "cancelled"],
];

function normalizeText(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchPriority(value?: string | null): ThongBaoPriority | null {
  const normalized = normalizeText(value)
    .replace(/\u0111/g, "d")
    .replace(/[^a-z0-9_]+/g, "_")
    .toUpperCase();
  for (const [pattern, priority] of FIELD_PRIORITY_RULES) {
    if (pattern.test(normalized)) return priority;
  }
  return null;
}

function matchPriorityFromTitle(title?: string | null): ThongBaoPriority | null {
  const normalized = normalizeText(title).replace(/\u0111/g, "d");

  if (
    normalized.includes("qua han") ||
    normalized.includes("tre han")
  ) {
    return "overdue";
  }

  if (
    normalized.includes("sap toi han") ||
    normalized.includes("sap den han")
  ) {
    return "warning";
  }

  if (
    normalized.includes("goi thau moi") ||
    normalized.includes("buoc moi") ||
    (normalized.includes("moi") && normalized.includes("xu ly"))
  ) {
    return "new";
  }

  if (
    normalized.includes("hoan thanh") ||
    normalized.includes("phe duyet") ||
    normalized.includes("da duyet") ||
    normalized.includes("duoc duyet")
  ) {
    return "success";
  }

  if (
    normalized.includes("da bi huy") ||
    normalized.includes("da huy") ||
    normalized.includes("bi huy")
  ) {
    return "cancelled";
  }

  return null;
}

export function resolveThongBaoPriority(item: ThongBaoSource): ThongBaoPriority {
  const fromField =
    matchPriority(item.mucDo) ??
    matchPriority(item.trangThai) ??
    matchPriority(item.loaiThongBao);

  return fromField ?? matchPriorityFromTitle(item.tieuDe) ?? "info";
}

export function getThongBaoStyle(item: ThongBaoSource): ThongBaoStyle {
  return THONG_BAO_STYLE[resolveThongBaoPriority(item)];
}
