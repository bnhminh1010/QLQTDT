/* ─────────────────────────────────────────────────────────────
   Mapper: Backend DTO → UI Draft
───────────────────────────────────────────────────────────── */
import type {
  WorkflowTemplatePreview,
  LoaiBuocValue,
  LoaiHanValue,
} from "@/services/workflowApi";
import type {
  WorkflowStepDraft,
  WorkflowDraft,
  LoaiBuocUI,
  LoaiThoiHanUI,
  DieuKienHopNhatUI,
  HuongXuLyUI,
  TemplateInfo,
} from "./workflowDesignerTypes";

/* ─── LoaiBuoc UI → Backend ─────────────────────────────── */
const loaiBuocUIMap: Record<LoaiBuocUI, LoaiBuocValue> = {
  "Bắt đầu": "BAT_DAU",
  "Thường": "THUC_HIEN",
  "Kết thúc": "KET_THUC",
};

/* ─── LoaiBuoc Backend → UI ─────────────────────────────── */
const loaiBuocBackendMap: Record<string, LoaiBuocUI> = {
  BAT_DAU: "Bắt đầu",
  THUC_HIEN: "Thường",
  KET_THUC: "Kết thúc",
  // legacy values
  APPROVAL: "Thường",
  REVIEW: "Thường",
  SIGN: "Thường",
};

export function mapLoaiBuocToUi(value: LoaiBuocValue): LoaiBuocUI {
  return loaiBuocBackendMap[value] ?? "Thường";
}

export function mapLoaiBuocToBackend(value: LoaiBuocUI): LoaiBuocValue {
  return loaiBuocUIMap[value];
}

/* ─── LoaiHan Backend → UI ──────────────────────────────── */
const loaiHanBackendMap: Record<string, LoaiThoiHanUI> = {
  CANH_BAO: "Chỉ cảnh báo quá hạn",
  BAT_BUOC: "Bắt buộc hoàn thành trước hạn",
};

export function mapLoaiHanToUi(value: LoaiHanValue): LoaiThoiHanUI {
  return loaiHanBackendMap[value] ?? "Chỉ cảnh báo quá hạn";
}

export function mapLoaiHanToBackend(value: LoaiThoiHanUI): LoaiHanValue {
  return value === "Bắt buộc hoàn thành trước hạn" ? "BAT_BUOC" : "CANH_BAO";
}

/* ─── DieuKienHopNhat Backend → UI ──────────────────────── */
const dieuKienHopNhatBackendMap: Record<string, DieuKienHopNhatUI> = {
  ALL: "all",
  ANY: "any",
  COUNT: "count",
};

export function mapDieuKienHopNhatToUi(value: string): DieuKienHopNhatUI {
  return dieuKienHopNhatBackendMap[value] ?? "all";
}

export function mapDieuKienHopNhatToBackend(value: DieuKienHopNhatUI): string {
  const map: Record<DieuKienHopNhatUI, string> = {
    all: "ALL",
    any: "ANY",
    count: "COUNT",
  };
  return map[value];
}

/* ─── HuongXuLy Backend → UI ────────────────────────────── */
const huongXuLyBackendMap: Record<string, HuongXuLyUI> = {
  TRA_VE_BUOC_TRUOC: "Trả về bước trước",
  DUNG_QUY_TRINH: "Dừng quy trình",
};

export function mapHuongXuLyToUi(value?: string): HuongXuLyUI {
  return huongXuLyBackendMap[value ?? ""] ?? "Trả về bước trước";
}

export function mapHuongXuLyToBackend(value: HuongXuLyUI): string {
  const map: Record<HuongXuLyUI, string> = {
    "Trả về bước trước": "TRA_VE_BUOC_TRUOC",
    "Dừng quy trình": "DUNG_QUY_TRINH",
  };
  return map[value];
}

/* ─── Preview → WorkflowDraft (sau generate) ────────────── */
let _draftCounter = 0;
function nextDraftId(): string {
  _draftCounter += 1;
  return `draft_${Date.now()}_${_draftCounter}`;
}

function buildBranchStepIds(steps: WorkflowStepDraft[], branchDraftId: string): string[] {
  return steps
    .filter((step) => step.nhanhId === branchDraftId)
    .sort((a, b) => a.thuTu - b.thuTu)
    .map((step) => step.id);
}

export function previewToWorkflowDraft(
  preview: WorkflowTemplatePreview,
  loaiHinh: string,
  options: { preserveBackendIds?: boolean } = {},
): WorkflowDraft {
  const preserveBackendIds = options.preserveBackendIds ?? true;
  const stepMap = new Map<number, string>(); // backend step id → draft id

  // First pass: build branch ID map
  const branchIdMap = new Map<number, { groupDraftId: string; branchDraftId: string }>();
  preview.parallelGroups.forEach((pg) => {
    const groupDraftId = nextDraftId();
    pg.branches.forEach((b) => {
      branchIdMap.set(b.id, { groupDraftId, branchDraftId: nextDraftId() });
    });
  });

  // Second pass: map steps with nhanhId
  const steps: WorkflowStepDraft[] = preview.steps.map((s) => {
    const draftId = nextDraftId();
    stepMap.set(s.id, draftId);

    return {
      id: draftId,
      backendId: preserveBackendIds ? s.id : undefined,
      maBuoc: s.maBuoc,
      tenBuoc: s.tenBuoc,
      loaiBuoc: mapLoaiBuocToUi(s.loaiBuoc),
      thuTu: s.thuTu,
      nhomGiaiDoan: s.nhomGiaiDoan ?? undefined,
      moTa: s.moTa ?? undefined,
      donViPhuTrach: String(s.donViXuLyId ?? ""),
      vaiTroXuLy: "",
      slaNgay: s.soNgayLapHoSo,
      loaiThoiHan: mapLoaiHanToUi(s.loaiHan),
      coKyDuyet: s.vaiTroKyDuyetId != null,
      donViKyHoSo: s.donViKyHoSoId != null ? String(s.donViKyHoSoId) : undefined,
      vaiTroKyDuyet: "",
      soNgayKyDuyet: s.soNgayXuLy > 0 ? s.soNgayXuLy : undefined,
      buocTiepTheoId: "",
      huongXuLyKhongDuyet: "Trả về bước trước",
      batBuocGhiChu: s.batBuocGhiChu,
      batBuocTaiLieu: s.batBuocTaiLieu,
      batBuocKyTruocChuyenBuoc: s.batBuocKyTruocChuyenBuoc,
      batBuocDungSLA: s.batBuocDungSLA,
      nhanhId: s.nhanhWorkflowId ? branchIdMap.get(s.nhanhWorkflowId)?.branchDraftId : undefined,
    };
  });

  // Third pass: populate branch stepIds and build parallelGroups
  const parallelGroups = preview.parallelGroups.map((pg) => {
    const groupDraftId = nextDraftId();
    const branches = pg.branches.map((b) => {
      const branchDraftId = branchIdMap.get(b.id)?.branchDraftId ?? nextDraftId();
      return {
        id: branchDraftId,
        backendId: preserveBackendIds ? b.id : undefined,
        tenNhanh: b.tenNhanh,
        stepIds: buildBranchStepIds(steps, branchDraftId),
      };
    });
    return {
      id: groupDraftId,
      backendId: preserveBackendIds ? pg.id : undefined,
      buocTachNhanhId: stepMap.get(pg.buocTachNhanhId) ?? String(pg.buocTachNhanhId),
      dieuKienHopNhat: mapDieuKienHopNhatToUi(pg.dieuKienHopNhat),
      soNhanhHopNhatToiThieu: pg.soNhanhHopNhatToiThieu ?? 2,
      buocSauHopNhatId: stepMap.get(pg.buocSauHopNhatId) ?? String(pg.buocSauHopNhatId),
      branches,
    };
  });

  return {
    workflowId: preview.id,
    tenWorkflow: preview.tenWorkflow,
    loaiHinhDauThau: loaiHinh,
    steps,
    parallelGroups,
    isFromTemplate: true,
  };
}

/* ─── Template Summary → TemplateInfo ───────────────────── */

export function templateSummaryToInfo(summary: {
  id: number;
  tenWorkflow: string;
  loaiHinhDauThau?: string;
  soBuoc: number;
}): TemplateInfo {
  return {
    id: summary.id,
    tenWorkflow: summary.tenWorkflow,
    loaiHinhDauThau: summary.loaiHinhDauThau ?? "",
    soBuoc: summary.soBuoc,
  };
}
