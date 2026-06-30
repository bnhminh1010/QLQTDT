import { useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  formatWorkflowKetQua,
  getParallelGroups,
  getWorkflowDesignSteps,
  getWorkflowState,
  type BuocWorkflowDto,
  type ParallelGroupDto,
  type WorkflowStateDto,
  type WorkflowStepStateDto,
} from "@/services/workflowApi";

type TenderSummary = {
  internalId: number;
  maGoiThau: string;
  tenGoiThau: string;
};

type GraphNodeStatus = "DONE" | "CURRENT" | "PENDING" | "SKIPPED" | "REJECTED" | "OVERDUE" | "STOPPED";

type WorkflowGraphNodeData = {
  label: string;
  code?: string;
  status: GraphNodeStatus;
  statusLabel: string;
  branchName?: string;
  roleLabel?: string;
  runtime?: WorkflowStepStateDto;
};

type GraphNode = Node<WorkflowGraphNodeData, "workflowStep">;

const NODE_WIDTH = 210;
const MAIN_Y = 190;
const X_GAP = 260;
const BRANCH_Y_START = 40;
const BRANCH_Y_GAP = 145;

const STATUS_STYLES: Record<GraphNodeStatus, { cls: string; dot: string; label: string }> = {
  DONE: {
    cls: "border-emerald-300 bg-emerald-50 text-emerald-900",
    dot: "bg-emerald-500",
    label: "Hoàn tất",
  },
  CURRENT: {
    cls: "border-amber-400 bg-amber-50 text-amber-950 shadow-[0_0_0_3px_rgba(245,158,11,0.12)]",
    dot: "bg-amber-500",
    label: "Bước hiện tại",
  },
  PENDING: {
    cls: "border-slate-200 bg-white text-slate-700",
    dot: "bg-slate-300",
    label: "Chưa mở",
  },
  SKIPPED: {
    cls: "border-slate-300 bg-slate-50 text-slate-500",
    dot: "bg-slate-400",
    label: "Bỏ qua",
  },
  REJECTED: {
    cls: "border-red-300 bg-red-50 text-red-900",
    dot: "bg-red-500",
    label: "Không duyệt",
  },
  OVERDUE: {
    cls: "border-red-400 bg-red-50 text-red-900 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
    dot: "bg-red-500",
    label: "Quá hạn",
  },
  STOPPED: {
    cls: "border-rose-300 bg-rose-50 text-rose-900",
    dot: "bg-rose-500",
    label: "Dừng",
  },
};

const STATUS_LABELS: Record<string, string> = {
  CHUA_THUC_HIEN: "Chưa thực hiện",
  DANG_XU_LY: "Đang xử lý",
  CHO_XU_LY: "Chờ xử lý",
  CHO_DUYET: "Chờ duyệt",
  CHO_KY_DUYET: "Chờ ký duyệt",
  HOAN_TAT: "Hoàn tất",
  BO_QUA: "Bỏ qua",
  KHONG_DUYET: "Không duyệt",
  DUNG_QUY_TRINH: "Dừng quy trình",
};

function WorkflowStepNode({ data, selected }: NodeProps<GraphNode>) {
  const style = STATUS_STYLES[data.status] ?? STATUS_STYLES.PENDING;
  return (
    <div
      className={`w-[210px] rounded-lg border px-3 py-2 text-left transition-shadow ${
        style.cls
      } ${selected ? "ring-2 ring-blue-400" : ""}`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-slate-400" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold">{data.label}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            <span>{data.statusLabel}</span>
          </div>
        </div>
        {data.code && <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{data.code}</span>}
      </div>
      {data.branchName && (
        <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
          <i className="fa-solid fa-code-branch text-[9px]" />
          <span className="truncate">{data.branchName}</span>
        </div>
      )}
      {data.roleLabel && <div className="mt-1 truncate text-[10px] text-slate-500">{data.roleLabel}</div>}
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-slate-400" />
    </div>
  );
}

const nodeTypes = { workflowStep: WorkflowStepNode };

function normalizeStatus(value?: string) {
  return (value || "").trim().toUpperCase();
}

function resolveNodeStatus(runtime: WorkflowStepStateDto | undefined, state: WorkflowStateDto): GraphNodeStatus {
  if (!runtime) return "PENDING";
  if (runtime.quaHan || normalizeStatus(runtime.tinhTrangTienDo) === "QUA_HAN") return "OVERDUE";

  const status = normalizeStatus(runtime.trangThai);
  const result = normalizeStatus(runtime.ketQua);
  if (status === "HOAN_TAT" && result === "KHONG_DUYET") return "REJECTED";
  if (status === "BO_QUA" || result === "BO_QUA") return "SKIPPED";
  if (status === "KHONG_DUYET" || result === "KHONG_DUYET") return "REJECTED";
  if (status === "DUNG_QUY_TRINH") return "STOPPED";
  if (state.currentSteps?.some((step) => step.stepInstanceId === runtime.id || step.buocWorkflowId === runtime.buocWorkflowId)) {
    return "CURRENT";
  }
  if (status === "HOAN_TAT") return "DONE";
  if (status === "DANG_XU_LY" || status === "CHO_DUYET" || status === "CHO_XU_LY" || status === "CHO_KY_DUYET") return "CURRENT";
  return "PENDING";
}

function getStatusLabel(runtime: WorkflowStepStateDto | undefined, status: GraphNodeStatus) {
  if (!runtime) return STATUS_STYLES[status].label;
  const raw = normalizeStatus(runtime.trangThai);
  const result = formatWorkflowKetQua(runtime.ketQua);
  if (result) return result;
  return STATUS_LABELS[raw] ?? STATUS_STYLES[status].label;
}

function buildWorkflowGraph(
  state: WorkflowStateDto,
  designSteps: BuocWorkflowDto[],
  parallelGroups: ParallelGroupDto[],
): { nodes: GraphNode[]; edges: Edge[] } {
  const runtimeByStep = new Map<number, WorkflowStepStateDto>();
  for (const step of state.steps ?? []) {
    if (!runtimeByStep.has(step.buocWorkflowId)) runtimeByStep.set(step.buocWorkflowId, step);
  }

  const sourceSteps = designSteps.length > 0
    ? [...designSteps].sort((a, b) => a.thuTu - b.thuTu)
    : [...(state.steps ?? [])]
      .sort((a, b) => new Date(a.ngayBatDau || "").getTime() - new Date(b.ngayBatDau || "").getTime())
      .map((step, index) => ({
        id: step.buocWorkflowId,
        maBuoc: String(index + 1),
        tenBuoc: step.tenBuoc,
        loaiBuoc: "THUC_HIEN",
        thuTu: index + 1,
        soNgayLapHoSo: 0,
        soNgayXuLy: 0,
        loaiHan: "CANH_BAO",
        laBuocJoin: false,
        batBuocGhiChu: false,
        batBuocTaiLieu: false,
        batBuocKyTruocChuyenBuoc: false,
        batBuocDungSLA: false,
        choPhepTuChoi: false,
        choPhepBoQua: false,
        nhanhWorkflowId: step.nhanhWorkflowId,
      } satisfies BuocWorkflowDto));

  const branchStepIds = new Set<number>();
  for (const group of parallelGroups) {
    for (const branch of group.branches ?? []) {
      for (const step of sourceSteps) {
        if (step.nhanhWorkflowId === branch.id) branchStepIds.add(step.id);
      }
      branchStepIds.add(branch.buocDauTienId);
    }
  }

  const mainSteps = sourceSteps.filter((step) => !branchStepIds.has(step.id));
  const mainIndexById = new Map(mainSteps.map((step, index) => [step.id, index]));
  const nodes: GraphNode[] = [];
  const edges: Edge[] = [];

  const pushNode = (step: BuocWorkflowDto, x: number, y: number, branchName?: string) => {
    const runtime = runtimeByStep.get(step.id);
    const status = resolveNodeStatus(runtime, state);
    nodes.push({
      id: String(step.id),
      type: "workflowStep",
      position: { x, y },
      data: {
        label: step.tenBuoc,
        code: step.maBuoc,
        status,
        statusLabel: getStatusLabel(runtime, status),
        branchName,
        runtime,
        roleLabel: runtime?.tenDonViXuLy || runtime?.tenVaiTroXuLy || undefined,
      },
      draggable: false,
    });
  };

  mainSteps.forEach((step, index) => pushNode(step, index * X_GAP, MAIN_Y));

  const groupBySplitId = new Map(parallelGroups.map((group) => [group.buocTachNhanhId, group]));
  const mergeStepIds = new Set(parallelGroups.map((group) => group.buocSauHopNhatId));

  for (const group of parallelGroups) {
    const splitIndex = mainIndexById.get(group.buocTachNhanhId) ?? 0;
    const mergeIndex = mainIndexById.get(group.buocSauHopNhatId) ?? splitIndex + 2;
    const spanStartX = (splitIndex * X_GAP) + X_GAP;
    const spanWidth = Math.max((mergeIndex - splitIndex - 1) * X_GAP, X_GAP);

    group.branches?.forEach((branch, branchIndex) => {
      const branchSteps = sourceSteps
        .filter((step) => step.nhanhWorkflowId === branch.id || step.id === branch.buocDauTienId)
        .sort((a, b) => a.thuTu - b.thuTu);
      const y = BRANCH_Y_START + branchIndex * BRANCH_Y_GAP;
      const stepGap = branchSteps.length > 1 ? Math.min(X_GAP, spanWidth / Math.max(branchSteps.length - 1, 1)) : 0;

      branchSteps.forEach((step, stepIndex) => {
        const x = spanStartX + stepIndex * stepGap;
        pushNode(step, x, y, branch.tenNhanh);
        if (stepIndex > 0) {
          edges.push(makeEdge(branchSteps[stepIndex - 1].id, step.id, "branch"));
        }
      });

      const firstStep = branchSteps[0];
      const lastStep = branchSteps[branchSteps.length - 1];
      if (firstStep) edges.push(makeEdge(group.buocTachNhanhId, firstStep.id, "branch"));
      if (lastStep) edges.push(makeEdge(lastStep.id, group.buocSauHopNhatId, "branch"));
    });
  }

  mainSteps.forEach((step, index) => {
    const next = mainSteps[index + 1];
    if (!next) return;
    if (groupBySplitId.has(step.id)) return;
    if (mergeStepIds.has(next.id) && parallelGroups.some((group) => group.buocTachNhanhId === step.id)) return;
    edges.push(makeEdge(step.id, next.id, "main"));
  });

  return { nodes, edges };
}

function makeEdge(source: number, target: number, kind: "main" | "branch"): Edge {
  return {
    id: `${kind}-${source}-${target}`,
    source: String(source),
    target: String(target),
    type: "smoothstep",
    animated: kind === "branch",
    style: {
      stroke: kind === "branch" ? "#a855f7" : "#94a3b8",
      strokeWidth: kind === "branch" ? 2 : 1.5,
    },
  };
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

export function WorkflowGraphModal({
  tender,
  onClose,
}: {
  tender: TenderSummary | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<WorkflowStateDto | null>(null);
  const [designSteps, setDesignSteps] = useState<BuocWorkflowDto[]>([]);
  const [parallelGroups, setParallelGroups] = useState<ParallelGroupDto[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowGraphNodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tender) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setState(null);
    setDesignSteps([]);
    setParallelGroups([]);
    setSelectedNode(null);

    (async () => {
      try {
        const workflowState = await getWorkflowState(tender.internalId);
        if (cancelled) return;
        setState(workflowState);

        const workflowId = workflowState.workflowId;
        if (workflowId) {
          const [steps, groups] = await Promise.all([
            getWorkflowDesignSteps(workflowId).catch(() => [] as BuocWorkflowDto[]),
            getParallelGroups(workflowId).catch(() => [] as ParallelGroupDto[]),
          ]);
          if (cancelled) return;
          setDesignSteps(steps);
          setParallelGroups(groups);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.response?.data?.error || "Không thể tải graph quy trình.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tender]);

  const graph = useMemo(() => {
    if (!state) return { nodes: [] as GraphNode[], edges: [] as Edge[] };
    return buildWorkflowGraph(state, designSteps, parallelGroups);
  }, [state, designSteps, parallelGroups]);

  if (!tender) return null;

  const selectedRuntime = selectedNode?.runtime;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-5">
      <div className="flex h-[86vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-blue-600">{tender.maGoiThau}</div>
            <h2 className="text-lg font-bold text-slate-900">{tender.tenGoiThau}</h2>
            <p className="text-xs text-slate-500">{state?.workflowTen || "Graph quy trình gói thầu"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            title="Đóng"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
          <div className="relative min-h-0 bg-slate-50">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                <i className="fa-solid fa-circle-notch fa-spin mr-2" /> Đang tải graph quy trình...
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-red-500">{error}</div>
            ) : graph.nodes.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">Gói thầu chưa có dữ liệu quy trình.</div>
            ) : (
              <ReactFlow
                nodes={graph.nodes}
                edges={graph.edges}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                onNodeClick={(_, node) => setSelectedNode(node.data as WorkflowGraphNodeData)}
                minZoom={0.35}
                maxZoom={1.4}
              >
                <Background gap={18} size={1} color="#dbe3ef" />
                <Controls showInteractive={false} />
                <MiniMap pannable zoomable nodeStrokeWidth={3} />
              </ReactFlow>
            )}
          </div>

          <aside className="border-l border-slate-200 bg-white p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Chi tiết bước</div>
            {!selectedNode ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                Chọn một node trên graph để xem người xử lý, kết quả và ghi chú.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-sm font-bold text-slate-900">{selectedNode.label}</div>
                  <div className="mt-1 text-xs text-slate-500">{selectedNode.statusLabel}</div>
                  {selectedNode.branchName && (
                    <div className="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                      {selectedNode.branchName}
                    </div>
                  )}
                </div>

                {[
                  ["Người xử lý", selectedRuntime?.tenNguoiXuLy],
                  ["Ngày xử lý", formatDate(selectedRuntime?.ngayXuLy)],
                  ["Người ký duyệt", selectedRuntime?.tenNguoiKyDuyet],
                  ["Ngày ký duyệt", formatDate(selectedRuntime?.ngayKyDuyet)],
                  ["Hạn xử lý", formatDate(selectedRuntime?.hanXuLy)],
                  ["Đơn vị/Vai trò", selectedRuntime?.tenDonViXuLy || selectedRuntime?.tenVaiTroXuLy],
                  ["Kết quả", formatWorkflowKetQua(selectedRuntime?.ketQua) || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-slate-400">{label}</span>
                    <span className="max-w-[180px] text-right font-semibold text-slate-700">{value || "—"}</span>
                  </div>
                ))}

                {(selectedRuntime?.ghiChu || selectedRuntime?.lyDoKhongDuyet) && (
                  <div className="rounded-lg bg-slate-50 p-3 text-xs">
                    {selectedRuntime?.ghiChu && (
                      <div>
                        <div className="mb-1 font-semibold text-slate-500">Ghi chú</div>
                        <div className="whitespace-pre-wrap text-slate-700">{selectedRuntime.ghiChu}</div>
                      </div>
                    )}
                    {selectedRuntime?.lyDoKhongDuyet && (
                      <div className={selectedRuntime.ghiChu ? "mt-3" : ""}>
                        <div className="mb-1 font-semibold text-red-500">Lý do không duyệt</div>
                        <div className="whitespace-pre-wrap text-red-700">{selectedRuntime.lyDoKhongDuyet}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
