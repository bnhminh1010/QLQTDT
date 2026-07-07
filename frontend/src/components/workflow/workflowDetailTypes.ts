export type WorkflowDotState = "done" | "warn" | "idle" | "skipped";
export type WorkflowStepDocumentCounts = {
  processing: number;
  approval: number;
};

export type WorkflowParallelBranchStepState = "done" | "current" | "idle" | "skipped";

export type WorkflowParallelBranch = {
  name: string;
  branchId?: number;
  parallelGroupId?: number;
  backendId?: number;
  progress: string;
  status: string;
  currentStep: string;
  processor: string;
  ghiChu?: string;
  ghiChuNguon?: "USER" | "SYSTEM";
  canSkipBranch?: boolean;
  steps: WorkflowParallelBranchStep[];
};

export type WorkflowParallelInfo = {
  title: string;
  condition: string;
  mergeCondition?: "ALL" | "ANY" | "COUNT" | "SKIP_ALL";
  branches: WorkflowParallelBranch[];
  mergeStatus: string;
  lockedStage: string;
};

export type WorkflowDetailStep = {
  state: WorkflowDotState;
  ten: string;
  donVi: string;
  donViKyDuyet?: string;
  processingUnitName?: string;
  processingRoleName?: string;
  approvalUnitName?: string;
  approvalRoleName?: string;
  backendId?: number;
  workflowStepInstanceId?: number;
  buocWorkflowId?: number;
  current?: boolean;
  isCurrent?: boolean;
  nguoiXuLy?: string;
  ngayXuLy?: string;
  nguoiKy?: string;
  ngayKy?: string;
  ketQua?: string;
  ghiChu?: string;
  ghiChuNguon?: "USER" | "SYSTEM";
  lyDoKhongDuyet?: string;
  lyDoQuaHanXuLyHoSo?: string;
  lyDoQuaHanKyDuyet?: string;
  soNgayQuaHanXuLyHoSo?: number;
  soNgayQuaHanKyDuyet?: number;
  slaText?: string;
  parallelInfo?: WorkflowParallelInfo;
};

export type WorkflowParallelBranchStep = Omit<WorkflowDetailStep, "parallelInfo"> & {
  documentCounts?: WorkflowStepDocumentCounts;
};

export type WorkflowDetailInfo = {
  buocHienTai: string;
  nguoiXuLy: string;
  donViXuLy: string;
  sla: string;
  lyDoTreHan?: string;
  steps: WorkflowDetailStep[];
};
