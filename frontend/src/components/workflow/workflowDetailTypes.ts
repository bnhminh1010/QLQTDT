export type WorkflowDotState = "done" | "warn" | "idle";

export type WorkflowParallelBranchStepState = "done" | "current" | "idle" | "skipped";

export type WorkflowParallelBranchStep = {
  name: string;
  backendId?: number;
  state: WorkflowParallelBranchStepState;
  ghiChu?: string;
};

export type WorkflowParallelBranch = {
  name: string;
  backendId?: number;
  progress: string;
  status: string;
  currentStep: string;
  processor: string;
  ghiChu?: string;
  steps: WorkflowParallelBranchStep[];
};

export type WorkflowParallelInfo = {
  title: string;
  condition: string;
  branches: WorkflowParallelBranch[];
  mergeStatus: string;
  lockedStage: string;
};

export type WorkflowDetailStep = {
  state: WorkflowDotState;
  ten: string;
  donVi: string;
  backendId?: number;
  buocWorkflowId?: number;
  current?: boolean;
  isCurrent?: boolean;
  nguoiXuLy?: string;
  ngayXuLy?: string;
  nguoiKy?: string;
  ngayKy?: string;
  ketQua?: string;
  ghiChu?: string;
  lyDoKhongDuyet?: string;
  slaText?: string;
  parallelInfo?: WorkflowParallelInfo;
};

export type WorkflowDetailInfo = {
  buocHienTai: string;
  nguoiXuLy: string;
  donViXuLy: string;
  sla: string;
  lyDoTreHan?: string;
  steps: WorkflowDetailStep[];
};
