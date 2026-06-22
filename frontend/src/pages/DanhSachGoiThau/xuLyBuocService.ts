export type KetQuaXuLy = "Chờ xử lý" | "Duyệt" | "Không duyệt";

export type XuLyBuocRecord = {
  goiThauId: string;
  tenGoiThau: string;
  buocWorkflow: string;
  nguoiXuLy: string;
  ngayXuLy: string;
  nguoiKyDuyet: string;
  ngayKyDuyet: string;
  ketQua: KetQuaXuLy;
  ghiChu: string;
  lyDoKhongDuyet?: string;
  taiLieuDinhKem: string[];
  thoiGianXuLy?: string;
  thaoTacHeThong?: string;
};

export type XuLyBuocWorkflowState = {
  currentStepName: string;
  records: Record<string, XuLyBuocRecord>;
};

const STORAGE_KEY = "qlqtdt_xu_ly_buoc";

const WORKFLOW_STEPS = [
  "Đề xuất mua sắm",
  "Tờ trình chủ trương",
  "Đăng tải yêu cầu báo giá",
  "Biên bản kiểm tra báo giá",
  "Tờ trình phê duyệt dự toán",
  "QĐ phê duyệt dự toán",
  "Tờ trình kế hoạch LCNT",
  "QĐ kế hoạch LCNT",
  "Đăng tải kế hoạch LCNT",
];

function isLegacyRecord(value: unknown): value is XuLyBuocRecord {
  return !!value && typeof value === "object" && "buocWorkflow" in value;
}

function nextStepName(stepName: string) {
  const idx = WORKFLOW_STEPS.indexOf(stepName);
  if (idx < 0) return stepName;
  return WORKFLOW_STEPS[Math.min(idx + 1, WORKFLOW_STEPS.length - 1)];
}

function emptyPendingRecord(base: XuLyBuocRecord, stepName: string): XuLyBuocRecord {
  return {
    goiThauId: base.goiThauId,
    tenGoiThau: base.tenGoiThau,
    buocWorkflow: stepName,
    nguoiXuLy: "",
    ngayXuLy: "",
    nguoiKyDuyet: "",
    ngayKyDuyet: "",
    ketQua: "Chờ xử lý",
    ghiChu: "",
    taiLieuDinhKem: [],
  };
}

function readAll(): Record<string, XuLyBuocWorkflowState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, XuLyBuocWorkflowState | XuLyBuocRecord>;
    const normalized: Record<string, XuLyBuocWorkflowState> = {};

    Object.entries(parsed).forEach(([goiThauId, value]) => {
      if (isLegacyRecord(value)) {
        const currentStepName =
          value.ketQua === "Duyệt" ? nextStepName(value.buocWorkflow) : value.buocWorkflow;
        normalized[goiThauId] = {
          currentStepName,
          records: {
            [value.buocWorkflow]: value,
            ...(currentStepName !== value.buocWorkflow
              ? { [currentStepName]: emptyPendingRecord(value, currentStepName) }
              : {}),
          },
        };
        return;
      }

      const currentRecord = value.records[value.currentStepName];
      if (currentRecord?.ketQua === "Duyệt") {
        const nextCurrentStepName = nextStepName(value.currentStepName);
        normalized[goiThauId] = {
          currentStepName: nextCurrentStepName,
          records: {
            ...value.records,
            [nextCurrentStepName]:
              value.records[nextCurrentStepName] ??
              emptyPendingRecord(currentRecord, nextCurrentStepName),
          },
        };
        return;
      }

      normalized[goiThauId] = value;
    });

    return normalized;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, XuLyBuocWorkflowState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getXuLyBuocState(goiThauId: string): XuLyBuocWorkflowState | null {
  return readAll()[goiThauId] ?? null;
}

export function getCurrentStepName(goiThauId: string, fallbackStepName: string) {
  return getXuLyBuocState(goiThauId)?.currentStepName || fallbackStepName;
}

export function getXuLyBuoc(goiThauId: string): XuLyBuocRecord | null {
  const state = getXuLyBuocState(goiThauId);
  if (!state) return null;
  return state.records[state.currentStepName] ?? null;
}

export function getXuLyBuocByStep(
  goiThauId: string,
  stepName: string,
): XuLyBuocRecord | null {
  return getXuLyBuocState(goiThauId)?.records[stepName] ?? null;
}

export function completeXuLyBuoc(
  record: XuLyBuocRecord,
  nextCurrentStepName: string,
) {
  const all = readAll();
  const current = all[record.goiThauId] ?? {
    currentStepName: record.buocWorkflow,
    records: {},
  };
  const nextRecord =
    current.records[nextCurrentStepName] ?? emptyPendingRecord(record, nextCurrentStepName);

  all[record.goiThauId] = {
    currentStepName: nextCurrentStepName,
    records: {
      ...current.records,
      [record.buocWorkflow]: record,
      [nextCurrentStepName]: nextRecord,
    },
  };
  writeAll(all);
}

export function getXuLyBuocHistory(goiThauId: string): XuLyBuocRecord[] {
  const state = getXuLyBuocState(goiThauId);
  if (!state) return [];

  return Object.values(state.records)
    .filter((record) => record.ketQua !== "Chờ xử lý")
    .sort((a, b) => (b.thoiGianXuLy ?? "").localeCompare(a.thoiGianXuLy ?? ""));
}
