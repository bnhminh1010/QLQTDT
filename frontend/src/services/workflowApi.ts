/* ─────────────────────────────────────────────────────────────
   Workflow API — runtime + config
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse, PagedResult } from "./types";

/* ─── Shared Types ──────────────────────────────────────── */

export type WorkflowItem = {
  id: number;
  maWorkflow: string;
  tenWorkflow: string;
  hinhThucId?: number;
  trangThaiHoatDong: boolean;
  loaiHinhDauThau?: string;
  laQuyTrinhChuan?: boolean;
  soBuoc: number;
  ngayTao: string;
};

export type LoaiBuocValue = "BAT_DAU" | "THUC_HIEN" | "KET_THUC" | "KY_DUYET" | "DANG_TAI" | "DANH_GIA" | "HOP_DONG" | string;
export type LoaiHanValue = "CANH_BAO" | "BAT_BUOC";
export type DieuKienKichHoatValue = "LUON" | "THEO_KET_QUA" | "THEO_VAI_TRO";
export type HanhDongValue = "DUYET" | "KHONG_DUYET" | "TRA_VE" | "YEU_CAU_BO_SUNG" | "BO_QUA" | string;
export type DieuKienHopNhatValue = "ALL" | "ANY" | "COUNT";
export type HuongXuLyValue = "TRA_VE_BUOC_TRUOC" | "DUNG_QUY_TRINH";

/* ─── Workflow Design-time ──────────────────────────────── */

export async function getWorkflowsPaged(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<WorkflowItem>> {
  const res = await http.get<ApiResponse<PagedResult<WorkflowItem>>>("/workflows", {
    params,
  });
  return res.data;
}

export async function getWorkflows(search?: string): Promise<WorkflowItem[]> {
  const pageSize = 100;
  const firstPage = await getWorkflowsPaged({ search, page: 1, pageSize });
  const items = [...(firstPage.items ?? [])];
  const total = firstPage.total ?? items.length;
  const totalPages = Math.ceil(total / pageSize);

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await getWorkflowsPaged({ search, page, pageSize });
    items.push(...(result.items ?? []));
  }

  return items;
}

export type WorkflowCreateRequest = {
  tenWorkflow: string;
  hinhThucId: number;
  loaiHinhDauThau?: string;
};

export type WorkflowCreateResponse = {
  id: number;
  tenWorkflow: string;
};

export async function createWorkflow(request: WorkflowCreateRequest): Promise<WorkflowCreateResponse> {
  const res = await http.post<ApiResponse<WorkflowCreateResponse>>("/workflows", request);
  return res.data;
}

export type WorkflowDesignStepRequest = {
  id: string;
  maBuoc: string;
  tenBuoc: string;
  loaiBuoc: LoaiBuocValue;
  thuTu: number;
  vaiTroXuLyHoSoId?: number;
  soNgayLapHoSo: number;
  vaiTroKyDuyetId?: number;
  soNgayXuLy: number;
  loaiHan: LoaiHanValue;
  nhomSongSong?: string;
  laBuocJoin: boolean;
  nhomGiaiDoan?: string;
  moTa?: string;
  donViXuLyId?: number;
  donViKyHoSoId?: number;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  batBuocKyTruocChuyenBuoc: boolean;
  batBuocDungSLA: boolean;
  nhanhId?: string;
  choPhepTuChoi: boolean;
  choPhepBoQua: boolean;
};

export type WorkflowDesignBranchRequest = {
  id: string;
  maNhanh: string;
  tenNhanh: string;
  thuTu: number;
  donViXuLyId?: number;
  vaiTroXuLyId?: number;
  thoiHanNgay: number;
  loaiHan: LoaiHanValue;
  stepIds: string[];
};

export type WorkflowDesignParallelGroupRequest = {
  id: string;
  buocTachNhanhId: string;
  tenNhom: string;
  dieuKienHopNhat: string;
  soNhanhHopNhatToiThieu?: number;
  buocSauHopNhatId: string;
  branches: WorkflowDesignBranchRequest[];
};

export type WorkflowDesignSaveRequest = {
  tenWorkflow: string;
  hinhThucId: number;
  loaiHinhDauThau?: string;
  steps: WorkflowDesignStepRequest[];
  parallelGroups: WorkflowDesignParallelGroupRequest[];
};

export async function createWorkflowFromDesign(request: WorkflowDesignSaveRequest): Promise<WorkflowCreateResponse> {
  const res = await http.post<ApiResponse<WorkflowCreateResponse>>("/workflows/from-design", request);
  return res.data;
}

export async function getWorkflowById(id: number): Promise<WorkflowItem> {
  const res = await http.get<ApiResponse<WorkflowItem>>(`/workflows/${id}`);
  return res.data;
}

/* ─── Workflow Template Types ────────────────────────────── */

export type WorkflowTemplateSummary = {
  id: number;
  maWorkflow: string;
  tenWorkflow: string;
  loaiHinhDauThau?: string;
  moTaNgan?: string;
  soBuoc: number;
};

export type BuocWorkflowDto = {
  id: number;
  maBuoc: string;
  tenBuoc: string;
  loaiBuoc: LoaiBuocValue;
  thuTu: number;
  vaiTroXuLyHoSoId?: number;
  soNgayLapHoSo: number;
  vaiTroKyDuyetId?: number;
  soNgayXuLy: number;
  loaiHan: LoaiHanValue;
  nhomSongSong?: string;
  laBuocJoin: boolean;
  nhomGiaiDoan?: string;
  moTa?: string;
  donViXuLyId?: number;
  donViKyHoSoId?: number;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  batBuocKyTruocChuyenBuoc: boolean;
  batBuocDungSLA: boolean;
  nhanhWorkflowId?: number;
  choPhepTuChoi: boolean;
  choPhepBoQua: boolean;
};

export type ChuyenTiepWorkflowDto = {
  id: number;
  tuBuocId: number;
  denBuocId: number;
  hanhDong: HanhDongValue;
  dieuKien?: string;
  dieuKienKichHoat: DieuKienKichHoatValue;
  ketQuaApDung?: string;
  vaiTroApDungId?: number;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  huongXuLyKhongDuyet?: HuongXuLyValue;
};

export type ParallelBranchDto = {
  id: number;
  nhomNhanhWorkflowId: number;
  maNhanh: string;
  tenNhanh: string;
  thuTu: number;
  donViXuLyId?: number;
  vaiTroXuLyId?: number;
  thoiHanNgay: number;
  loaiHan: LoaiHanValue;
  buocDauTienId: number;
};

export type ParallelGroupDto = {
  id: number;
  workflowId: number;
  buocTachNhanhId: number;
  tenNhom: string;
  dieuKienHopNhat: DieuKienHopNhatValue;
  soNhanhHopNhatToiThieu?: number;
  buocSauHopNhatId: number;
  branches: ParallelBranchDto[];
};

export type WorkflowTemplatePreview = {
  id: number;
  tenWorkflow: string;
  loaiHinhDauThau?: string;
  steps: BuocWorkflowDto[];
  transitions: ChuyenTiepWorkflowDto[];
  parallelGroups: ParallelGroupDto[];
};

export type GenerateWorkflowFromTemplateRequest = {
  templateWorkflowId: number;
  tenWorkflow: string;
  loaiHinhDauThau?: string;
};

/* ─── Workflow Template APIs ──────────────────────────── */

export async function getWorkflowTemplates(loaiHinh?: string): Promise<WorkflowTemplateSummary[]> {
  const res = await http.get<ApiResponse<WorkflowTemplateSummary[]>>("/workflow-templates", {
    params: loaiHinh ? { loaiHinh } : undefined,
  });
  return res.data;
}

export async function previewWorkflowTemplate(templateId: number): Promise<WorkflowTemplatePreview> {
  const res = await http.get<ApiResponse<WorkflowTemplatePreview>>(`/workflow-templates/${templateId}/preview`);
  return res.data;
}

export async function generateWorkflowFromTemplate(
  request: GenerateWorkflowFromTemplateRequest
): Promise<WorkflowTemplatePreview> {
  const res = await http.post<ApiResponse<WorkflowTemplatePreview>>(
    "/workflows/generate-from-template",
    request
  );
  return res.data;
}

/* ─── Workflow Step (Design-time) APIs ──────────────────── */

export type StepCreateRequest = {
  maBuoc: string;
  tenBuoc: string;
  loaiBuoc: LoaiBuocValue;
  thuTu: number;
  vaiTroXuLyHoSoId?: number;
  soNgayLapHoSo: number;
  vaiTroKyDuyetId?: number;
  soNgayXuLy: number;
  loaiHan: LoaiHanValue;
  nhomSongSong?: string;
  laBuocJoin: boolean;
  nhomGiaiDoan?: string;
  moTa?: string;
  donViXuLyId?: number;
  donViKyHoSoId?: number;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  batBuocKyTruocChuyenBuoc: boolean;
  batBuocDungSLA: boolean;
  nhanhWorkflowId?: number;
  choPhepTuChoi: boolean;
  choPhepBoQua: boolean;
};

export type StepUpdateRequest = {
  tenBuoc?: string;
  loaiBuoc?: LoaiBuocValue;
  thuTu?: number;
  vaiTroXuLyHoSoId?: number | null;
  soNgayLapHoSo?: number;
  vaiTroKyDuyetId?: number | null;
  soNgayXuLy?: number;
  loaiHan?: LoaiHanValue;
  nhomGiaiDoan?: string | null;
  moTa?: string | null;
  donViXuLyId?: number | null;
  donViKyHoSoId?: number | null;
  batBuocGhiChu?: boolean;
  batBuocTaiLieu?: boolean;
  batBuocKyTruocChuyenBuoc?: boolean;
  batBuocDungSLA?: boolean;
  nhanhWorkflowId?: number | null;
  choPhepTuChoi?: boolean;
  choPhepBoQua?: boolean;
};

export type InsertStepAfterRequest = {
  maBuoc: string;
  tenBuoc: string;
  loaiBuoc: LoaiBuocValue;
  vaiTroXuLyHoSoId?: number;
  soNgayLapHoSo: number;
  vaiTroKyDuyetId?: number;
  soNgayXuLy: number;
  loaiHan: LoaiHanValue;
  createDefaultTransition: boolean;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  batBuocKyTruocChuyenBuoc: boolean;
  batBuocDungSLA: boolean;
  donViXuLyId?: number;
  donViKyHoSoId?: number;
};

export type CloneStepRequest = {
  maBuocMoi: string;
  tenBuocMoi: string;
};

export type StepOrderDto = {
  id: number;
  thuTu: number;
};

export type ReorderStepsRequest = {
  steps: StepOrderDto[];
};

export async function getWorkflowDesignSteps(workflowId: number): Promise<BuocWorkflowDto[]> {
  const res = await http.get<ApiResponse<BuocWorkflowDto[]>>(`/workflows/${workflowId}/steps`);
  return res.data;
}

export async function createWorkflowStep(
  workflowId: number,
  request: StepCreateRequest
): Promise<BuocWorkflowDto> {
  const res = await http.post<ApiResponse<BuocWorkflowDto>>(`/workflows/${workflowId}/steps`, request);
  return res.data;
}

export async function updateWorkflowStep(
  stepId: number,
  request: StepUpdateRequest
): Promise<void> {
  await http.put(`/workflows/steps/${stepId}`, request);
}

export async function deleteWorkflowStep(stepId: number): Promise<void> {
  await http.del(`/workflows/steps/${stepId}`);
}

export async function insertStepAfter(
  workflowId: number,
  stepId: number,
  request: InsertStepAfterRequest
): Promise<BuocWorkflowDto> {
  const res = await http.post<ApiResponse<BuocWorkflowDto>>(
    `/workflows/${workflowId}/steps/${stepId}/insert-after`,
    request
  );
  return res.data;
}

export async function cloneWorkflowStep(
  workflowId: number,
  stepId: number,
  request: CloneStepRequest
): Promise<BuocWorkflowDto> {
  const res = await http.post<ApiResponse<BuocWorkflowDto>>(
    `/workflows/${workflowId}/steps/${stepId}/clone`,
    request
  );
  return res.data;
}

export async function reorderWorkflowSteps(
  workflowId: number,
  request: ReorderStepsRequest
): Promise<void> {
  await http.post(`/workflows/${workflowId}/steps/reorder`, request);
}

/* ─── Workflow Transition APIs ──────────────────────────── */

export type TransitionCreateRequest = {
  tuBuocId: number;
  denBuocId: number;
  hanhDong: HanhDongValue;
  dieuKien?: string;
  dieuKienKichHoat: DieuKienKichHoatValue;
  ketQuaApDung?: string;
  vaiTroApDungId?: number;
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  huongXuLyKhongDuyet?: HuongXuLyValue;
};

export async function getWorkflowTransitions(workflowId: number): Promise<ChuyenTiepWorkflowDto[]> {
  const res = await http.get<ApiResponse<ChuyenTiepWorkflowDto[]>>(`/workflows/${workflowId}/transitions`);
  return res.data;
}

export async function createWorkflowTransition(
  workflowId: number,
  request: TransitionCreateRequest
): Promise<ChuyenTiepWorkflowDto> {
  const res = await http.post<ApiResponse<ChuyenTiepWorkflowDto>>(`/workflows/${workflowId}/transitions`, request);
  return res.data;
}

/* ─── Parallel Group & Branch APIs ────────────────────────── */

export type ParallelGroupCreateRequest = {
  buocTachNhanhId: number;
  tenNhom: string;
  dieuKienHopNhat: DieuKienHopNhatValue;
  soNhanhHopNhatToiThieu?: number;
  buocSauHopNhatId: number;
};

export type ParallelGroupUpdateRequest = {
  tenNhom?: string;
  dieuKienHopNhat?: DieuKienHopNhatValue;
  soNhanhHopNhatToiThieu?: number | null;
  buocSauHopNhatId?: number;
};

export type ParallelBranchCreateRequest = {
  maNhanh: string;
  tenNhanh: string;
  thuTu: number;
  donViXuLyId?: number;
  vaiTroXuLyId?: number;
  thoiHanNgay: number;
  loaiHan: LoaiHanValue;
  buocDauTienId: number;
};

export type ParallelBranchUpdateRequest = {
  tenNhanh?: string;
  thuTu?: number;
  donViXuLyId?: number | null;
  vaiTroXuLyId?: number | null;
  thoiHanNgay?: number;
  loaiHan?: LoaiHanValue;
  buocDauTienId?: number;
};

export async function getParallelGroups(workflowId: number): Promise<ParallelGroupDto[]> {
  const res = await http.get<ApiResponse<ParallelGroupDto[]>>(`/workflows/${workflowId}/parallel-groups`);
  return res.data;
}

export async function createParallelGroup(
  workflowId: number,
  request: ParallelGroupCreateRequest
): Promise<ParallelGroupDto> {
  const res = await http.post<ApiResponse<ParallelGroupDto>>(`/workflows/${workflowId}/parallel-groups`, request);
  return res.data;
}

export async function updateParallelGroup(
  workflowId: number,
  groupId: number,
  request: ParallelGroupUpdateRequest
): Promise<void> {
  await http.put(`/workflows/${workflowId}/parallel-groups/${groupId}`, request);
}

export async function deleteParallelGroup(
  workflowId: number,
  groupId: number
): Promise<void> {
  await http.del(`/workflows/${workflowId}/parallel-groups/${groupId}`);
}

export async function createParallelBranch(
  groupId: number,
  request: ParallelBranchCreateRequest
): Promise<ParallelBranchDto> {
  const res = await http.post<ApiResponse<ParallelBranchDto>>(`/parallel-groups/${groupId}/branches`, request);
  return res.data;
}

export async function updateParallelBranch(
  branchId: number,
  request: ParallelBranchUpdateRequest
): Promise<void> {
  await http.put(`/parallel-branches/${branchId}`, request);
}

export async function deleteParallelBranch(branchId: number): Promise<void> {
  await http.del(`/parallel-branches/${branchId}`);
}

/* ─── Workflow Runtime ──────────────────────────────────── */

export type WorkflowStateDto = {
  workflowInstanceId?: number;
  workflowTen?: string;
  workflowTrangThai: string;
  buocHienTaiId?: number;
  tenBuocHienTai?: string;
  phaHienTai?: string;
  ngayBatDau: string;
  soBuocHoanThanh: number;
  tongSoBuoc: number;
  tinhTrangTienDo?: string;
  currentSteps: CurrentStepDto[];
  steps: WorkflowStepStateDto[];
};

export type CurrentStepDto = {
  stepInstanceId: number;
  buocWorkflowId: number;
  tenBuoc: string;
  trangThai: string;
  phaHienTai: string;
  tenNhanh?: string;
  hanXuLy?: string;
  tinhTrangTienDo?: string;
};

export type WorkflowStepStateDto = {
  id: number;
  tenBuoc: string;
  trangThai: string;
  phaHienTai?: string;
  ngayBatDau: string;
  ngayHoanThanh?: string;
  tenNguoiXuLy?: string;
  ngayXuLy?: string;
  tenNguoiKyDuyet?: string;
  ngayKyDuyet?: string;
  ketQua?: string;
  lyDoKhongDuyet?: string;
  tenVaiTroXuLy?: string;
  tenVaiTroKyDuyet?: string;
  hanXuLy?: string;
  quaHan?: boolean;
  tinhTrangTienDo?: string;
  rowVersion?: string;
};

export type ProcessStepRequest = {
  hanhDong: string;
  ghiChu?: string;
  nguoiDuocGiaoId?: number;
  rowVersion?: string;
  workflowStepInstanceId?: number;
  nguoiXuLyId?: number;
  ngayXuLy?: string;
  nguoiKyDuyetId?: number;
  ngayKyDuyet?: string;
  taiLieuDinhKem?: string;
  // UI-provided display fields (optional)
  nguoiXuLy?: string;
  nguoiKyDuyet?: string;
  ketQua?: string;
};

export type ProcessStepResponse = {
  currentStepId?: number;
  tenBuocHienTai?: string;
  newStepId?: number;
  tenBuocMoi?: string;
  workflowTrangThai: string;
  goiThauTrangThai?: string;
  hanhDong: string;
  message: string;
  newRowVersion?: string;
  isSplit: boolean;
  isMerge: boolean;
  isAwaitingMerge: boolean;
  activeStepIds: number[];
  tongSoNhanh?: number;
  soNhanhHoanThanh?: number;
  phaHienTai?: string;
  choKyDuyet: boolean;
};

const WORKFLOW_KET_QUA_LABEL: Record<string, string> = {
  DUYET: "Duyệt",
  KHONG_DUYET: "Không duyệt",
  TRA_VE: "Trả về",
  BO_QUA: "Bỏ qua",
  CHO_XU_LY: "Chờ xử lý",
  CHO_DUYET: "Chờ duyệt",
  CHO_KY_DUYET: "Chờ ký duyệt",
};

export function formatWorkflowKetQua(value?: string | null): string {
  if (!value) return "";
  return WORKFLOW_KET_QUA_LABEL[value] ?? value;
}

export async function getWorkflowState(goiThauId: number): Promise<WorkflowStateDto> {
  const res = await http.get<ApiResponse<WorkflowStateDto>>(`/goi-thau/${goiThauId}/workflow`);
  return res.data;
}

export async function getWorkflowSteps(goiThauId: number): Promise<WorkflowStepStateDto[]> {
  const res = await http.get<ApiResponse<WorkflowStepStateDto[]>>(`/goi-thau/${goiThauId}/steps`);
  return res.data;
}

export async function getWorkflowStepDetail(
  goiThauId: number,
  stepId: number
): Promise<WorkflowStepStateDto> {
  const res = await http.get<ApiResponse<WorkflowStepStateDto>>(`/goi-thau/${goiThauId}/steps/${stepId}`);
  return res.data;
}

export async function processStep(
  goiThauId: number,
  request: ProcessStepRequest
): Promise<ProcessStepResponse> {
  const res = await http.post<ApiResponse<ProcessStepResponse>>(
    `/goi-thau/${goiThauId}/process-step`,
    request
  );
  return res.data;
}

export async function startWorkflow(
  goiThauId: number,
  workflowId: number
): Promise<any> {
  const res = await http.post<ApiResponse<any>>(`/goi-thau/${goiThauId}/start-workflow`, {
    workflowId,
    autoSuggest: false,
  });
  return res.data;
}

export async function getLichSuTrangThai(goiThauId: number): Promise<any[]> {
  const res = await http.get<ApiResponse<any[]>>(`/goi-thau/${goiThauId}/lich-su-trang-thai`);
  return res.data;
}
