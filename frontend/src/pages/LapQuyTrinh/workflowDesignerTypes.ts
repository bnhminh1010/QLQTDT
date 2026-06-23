/* ─────────────────────────────────────────────────────────────
   UI model types cho Workflow Designer
   Tách biệt khỏi backend DTO — mapper chịu trách nhiệm convert
───────────────────────────────────────────────────────────── */

/* ─── Loại bước UI ──────────────────────────────────────── */
export type LoaiBuocUI = "Bắt đầu" | "Thường" | "Kết thúc";

export const LOAI_BUOC_UI_VALUES: readonly LoaiBuocUI[] = [
  "Bắt đầu",
  "Thường",
  "Kết thúc",
] as const;

/* ─── Loại thời hạn UI ──────────────────────────────────── */
export type LoaiThoiHanUI = "Chỉ cảnh báo quá hạn" | "Bắt buộc hoàn thành trước hạn";

/* ─── Hành động chuyển ──────────────────────────────────── */
export type HanhDongUI = "Khi duyệt" | "Khi không duyệt";

/* ─── Điều kiện hợp nhất ────────────────────────────────── */
export type DieuKienHopNhatUI = "all" | "any" | "count";

/* ─── Hướng xử lý khi không duyệt ────────────────────────── */
export type HuongXuLyUI = "Trả về bước trước" | "Dừng quy trình";

/* ─── Context modal: thêm bước ở main flow hay trong nhánh ─ */
export type StepModalContext = {
  type: "main";
  afterStepId?: string;
} | {
  type: "branch";
  branchId: string;
};

/* ─── Step draft (UI model) ─────────────────────────────── */

export type WorkflowStepDraft = {
  id: string; // tạm (Date.now()) cho local, backend id khi đã sync
  backendId?: number; // real backend ID (sau generate/edit load)
  maBuoc: string;
  tenBuoc: string;
  loaiBuoc: LoaiBuocUI;
  thuTu: number;
  nhomGiaiDoan?: string;
  moTa?: string;

  // Đơn vị xử lý
  donViPhuTrach: string; // tên hiển thị
  vaiTroXuLy: string;
  slaNgay: number;

  // Thời hạn
  loaiThoiHan: LoaiThoiHanUI;

  // Ký duyệt
  coKyDuyet: boolean;
  donViKyHoSo?: string;
  vaiTroKyDuyet?: string;
  soNgayKyDuyet?: number;

  // Transition
  buocTiepTheoId: string; // step sau khi duyệt (theo thứ tự)
  huongXuLyKhongDuyet: HuongXuLyUI; // khi không duyệt
  batBuocGhiChu: boolean;
  batBuocTaiLieu: boolean;
  batBuocKyTruocChuyenBuoc: boolean;
  batBuocDungSLA: boolean;

  // Branch membership
  nhanhId?: string; // nếu step thuộc nhánh song song
};

/* ─── Branch draft ───────────────────────────────────────── */

export type ParallelBranchDraft = {
  id: string;
  backendId?: number;
  tenNhanh: string;
  stepIds: string[]; // step IDs trong nhánh
};

/* ─── Parallel group draft ──────────────────────────────── */

export type ParallelGroupDraft = {
  id: string;
  backendId?: number;
  buocTachNhanhId: string;
  dieuKienHopNhat: DieuKienHopNhatUI;
  soNhanhHopNhatToiThieu: number;
  buocSauHopNhatId: string;
  branches: ParallelBranchDraft[];
};

/* ─── Workflow draft (full UI state cho LapQuyTrinh) ────── */

export type WorkflowDraft = {
  workflowId?: number; // undefined nếu chưa generate
  maWorkflow?: string;
  tenWorkflow: string;
  loaiHinhDauThau: string;
  steps: WorkflowStepDraft[];
  parallelGroups: ParallelGroupDraft[];
  isFromTemplate: boolean;
};

/* ─── Template info cho card "Quy trình chuẩn" ────────────── */

export type TemplateInfo = {
  id: number;
  tenWorkflow: string;
  loaiHinhDauThau: string;
  soBuoc: number;
  phamViApDung?: string;
  moTaNgan?: string;
};
