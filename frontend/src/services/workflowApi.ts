/* ─────────────────────────────────────────────────────────────
   Workflow API — runtime + config
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse } from "./types";

/* ─── Workflow Design-time ──────────────────────────────── */

export type WorkflowItem = {
  id: number;
  maWorkflow: string;
  tenWorkflow: string;
  hinhThucId?: number;
  trangThaiHoatDong: boolean;
};

export async function getWorkflows(search?: string): Promise<WorkflowItem[]> {
  const res = await http.get<ApiResponse<WorkflowItem[]>>("/workflows", {
    params: { search },
  });
  return res.data;
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

export async function getWorkflowState(goiThauId: number): Promise<WorkflowStateDto> {
  const res = await http.get<ApiResponse<WorkflowStateDto>>(`/goi-thau/${goiThauId}/workflow`);
  return res.data;
}

export async function getWorkflowSteps(goiThauId: number): Promise<WorkflowStepStateDto[]> {
  const res = await http.get<ApiResponse<WorkflowStepStateDto[]>>(`/goi-thau/${goiThauId}/steps`);
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
