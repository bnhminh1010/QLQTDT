import { useEffect, useRef, useState } from "react";
import type { TaiLieuDto, DocumentPhase } from "@/services/fileApi";
import { downloadTaiLieuFile, getTaiLieuFiles, openTaiLieuFile } from "@/services/fileApi";
import type {
  WorkflowDetailStep,
  WorkflowParallelBranchStep,
} from "./workflowDetailTypes";
import WorkflowParallelGroupCard from "./WorkflowParallelGroupCard";
import WorkflowStepItem from "./WorkflowStepItem";
import { normalizeWorkflowText } from "./workflowDetailUtils";

type Props = {
  loading?: boolean;
  goiThauId?: number | null;
  steps: WorkflowDetailStep[];
  emptyMessage?: string;
  enableAutoFocusCurrentStep?: boolean;
  onCurrentStepAction?: (step: WorkflowDetailStep) => void;
  onUpdateCurrentStep?: (step: WorkflowDetailStep) => void;
  canShowCurrentStepAction?: (step: WorkflowDetailStep) => boolean;
  canUpdateCurrentStep?: (step: WorkflowDetailStep) => boolean;
  currentStepActionLabel?: string;
  currentStepActionTooltip?: (step: WorkflowDetailStep) => string;
  onBranchStepClick?: (step: WorkflowParallelBranchStep) => void;
  onBranchCurrentStepAction?: (branch: NonNullable<WorkflowDetailStep["parallelInfo"]>["branches"][number]) => void;
  onBranchSkip?: (branch: NonNullable<WorkflowDetailStep["parallelInfo"]>["branches"][number]) => void;
  focusStepId?: number | null;
  documentRefreshKey?: string | number;
};

type DocumentPanelState = {
  stepId: number;
  stepName: string;
  phase: DocumentPhase;
  title: string;
};

function getStepInstanceId(step?: WorkflowDetailStep | WorkflowParallelBranchStep | null) {
  return step?.workflowStepInstanceId ?? step?.backendId ?? null;
}

function formatUploadDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getFileTypeLabel(file: TaiLieuDto) {
  const ext = file.tenFile.split(".").pop()?.trim().toUpperCase();
  if (ext) return ext;
  if (file.contentType) {
    const shortType = file.contentType.split("/").pop()?.trim().toUpperCase();
    if (shortType) return shortType;
  }
  return "FILE";
}

function getFileUploaderLabel(file: TaiLieuDto) {
  return normalizeWorkflowText(file.nguoiUploadTen || (file.nguoiUploadId ? `Người dùng #${file.nguoiUploadId}` : "Hệ thống"));
}

function getPhaseLabel(phase: DocumentPhase) {
  return phase === "Processing" ? "Tài liệu xử lý" : "Tài liệu ký duyệt";
}

export default function WorkflowStepsPanel({
  loading = false,
  goiThauId,
  steps,
  emptyMessage = "Chưa có dữ liệu bước quy trình từ backend.",
  enableAutoFocusCurrentStep = false,
  onCurrentStepAction,
  onUpdateCurrentStep,
  canShowCurrentStepAction,
  canUpdateCurrentStep,
  currentStepActionLabel = "Cập nhật",
  currentStepActionTooltip,
  onBranchStepClick,
  onBranchCurrentStepAction,
  onBranchSkip,
  focusStepId,
  documentRefreshKey,
}: Props) {
  const currentStepAction = onCurrentStepAction ?? onUpdateCurrentStep;
  const canShowCurrentStepActionResolved = canShowCurrentStepAction ?? canUpdateCurrentStep;
  const stepContainerRefs = useRef(new Map<number, HTMLDetailsElement>());
  const stepAnchorRefs = useRef(new Map<number, HTMLElement>());
  const [documentCache, setDocumentCache] = useState<Record<number, TaiLieuDto[]>>({});
  const [documentsLoadingStepIds, setDocumentsLoadingStepIds] = useState<Record<number, true>>({});
  const [documentsDeniedStepIds, setDocumentsDeniedStepIds] = useState<Record<number, true>>({});
  const [documentPanel, setDocumentPanel] = useState<DocumentPanelState | null>(null);
  const currentStepId = getStepInstanceId(steps.find((step) => step.current ?? step.isCurrent)) ?? null;
  const resolvedFocusStepId = enableAutoFocusCurrentStep ? (focusStepId ?? currentStepId) : null;
  const stepIdentityKey = steps
    .map((step) => [
      getStepInstanceId(step) ?? step.ten,
      step.parallelInfo?.branches
        .flatMap((branch) => branch.steps.map((branchStep) => getStepInstanceId(branchStep) ?? branchStep.ten))
        .join(",") ?? "",
    ].join(":"))
    .join("|");
  const stepIds = steps.flatMap((step) => {
    const stepId = getStepInstanceId(step);
    const branchStepIds = step.parallelInfo?.branches.flatMap((branch) =>
      branch.steps
        .map((branchStep) => getStepInstanceId(branchStep))
        .filter((branchStepId): branchStepId is number => typeof branchStepId === "number"),
    ) ?? [];
    return stepId != null ? [stepId, ...branchStepIds] : branchStepIds;
  });

  useEffect(() => {
    setDocumentCache({});
    setDocumentsLoadingStepIds({});
    setDocumentsDeniedStepIds({});
    setDocumentPanel(null);
  }, [goiThauId]);

  useEffect(() => {
    setDocumentCache({});
    setDocumentsLoadingStepIds({});
    setDocumentsDeniedStepIds({});
  }, [goiThauId, stepIdentityKey, documentRefreshKey]);

  useEffect(() => {
    if (!goiThauId || stepIds.length === 0) return;

    let cancelled = false;
    const uniqueStepIds = Array.from(new Set(stepIds));
    setDocumentsLoadingStepIds((prev) => ({
      ...prev,
      ...Object.fromEntries(uniqueStepIds.map((stepId) => [stepId, true])),
    }));

    void Promise.all(
      uniqueStepIds.map(async (stepId) => {
        try {
          const items = await getTaiLieuFiles(
            { goiThauId, workflowStepInstanceId: stepId },
            { skipAuthToast: true },
          );
          return { stepId, items, denied: false };
        } catch (error) {
          const status = typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
          return { stepId, items: [] as TaiLieuDto[], denied: status === 403 };
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setDocumentCache((prev) => ({
        ...prev,
        ...Object.fromEntries(results.map(({ stepId, items }) => [stepId, items])),
      }));
      setDocumentsDeniedStepIds((prev) => {
        const next = { ...prev };
        results.forEach(({ stepId, denied }) => {
          if (denied) next[stepId] = true;
          else delete next[stepId];
        });
        return next;
      });
    }).finally(() => {
      if (cancelled) return;
      setDocumentsLoadingStepIds((prev) => {
        const next = { ...prev };
        uniqueStepIds.forEach((stepId) => delete next[stepId]);
        return next;
      });
    });

    return () => { cancelled = true; };
  }, [goiThauId, stepIdentityKey, documentRefreshKey]);

  function registerContainerRef(stepIds: number[]) {
    return (element: HTMLDetailsElement | null) => {
      stepIds.forEach((stepId) => {
        if (element) {
          stepContainerRefs.current.set(stepId, element);
        } else {
          stepContainerRefs.current.delete(stepId);
        }
      });
    };
  }

  function registerAnchorRef(stepId: number) {
    return (element: HTMLElement | null) => {
      if (element) {
        stepAnchorRefs.current.set(stepId, element);
      } else {
        stepAnchorRefs.current.delete(stepId);
      }
    };
  }

  function getStepDocuments(stepId?: number, phase?: DocumentPhase) {
    if (!stepId) return [];
    const cachedDocuments = documentCache[stepId] ?? [];
    return cachedDocuments.filter((file) => {
      if (file.workflowStepInstanceId !== stepId) return false;
      const normalizedPhase = file.documentPhase ?? "Processing";
      if (phase && normalizedPhase !== phase) return false;
      return true;
    });
  }

  function openDocumentPanel(step: WorkflowDetailStep, phase: DocumentPhase) {
    const stepId = getStepInstanceId(step);
    if (stepId == null) return;
    const title = `${step.ten} - ${getPhaseLabel(phase)}`;
    setDocumentPanel({
      stepId,
      stepName: step.ten,
      phase,
      title,
    });

    if (!goiThauId || documentCache[stepId] || documentsLoadingStepIds[stepId] || documentsDeniedStepIds[stepId]) {
      return;
    }

    setDocumentsLoadingStepIds((prev) => ({ ...prev, [stepId]: true }));
    void getTaiLieuFiles(
      {
        goiThauId,
        workflowStepInstanceId: stepId,
      },
      { skipAuthToast: true },
    )
      .then((items) => {
        setDocumentCache((prev) => ({ ...prev, [stepId]: items }));
        setDocumentsDeniedStepIds((prev) => {
          if (!prev[stepId]) return prev;
          const next = { ...prev };
          delete next[stepId];
          return next;
        });
      })
      .catch((error) => {
        const status = typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
        setDocumentCache((prev) => ({ ...prev, [stepId]: [] }));
        if (status === 403) {
          setDocumentsDeniedStepIds((prev) => ({ ...prev, [stepId]: true }));
        }
      })
      .finally(() => {
        setDocumentsLoadingStepIds((prev) => {
          if (!prev[stepId]) return prev;
          const next = { ...prev };
          delete next[stepId];
          return next;
        });
      });
  }

  useEffect(() => {
    if (resolvedFocusStepId == null) {
      return;
    }

    const container = stepContainerRefs.current.get(resolvedFocusStepId);
    if (container && !container.open) {
      container.open = true;
    }

    const frame = window.requestAnimationFrame(() => {
      const anchor = stepAnchorRefs.current.get(resolvedFocusStepId) ?? container;
      anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [enableAutoFocusCurrentStep, resolvedFocusStepId, stepIdentityKey]);

  const documentItems = documentPanel
    ? getStepDocuments(documentPanel.stepId, documentPanel.phase)
    : [];
  const currentDocumentStepId = documentPanel?.stepId ?? null;
  const documentsPermissionDenied = currentDocumentStepId != null && documentsDeniedStepIds[currentDocumentStepId] === true;
  const documentsLoading = currentDocumentStepId != null && documentsLoadingStepIds[currentDocumentStepId] === true;

  return (
    <div className="space-y-3 mb-5">
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          <i className="fa-solid fa-circle-notch fa-spin mr-1" />
          Đang tải các bước quy trình...
        </div>
      ) : steps.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        steps.map((step) => {
          const stepId = getStepInstanceId(step);
          const processingText = normalizeWorkflowText(step.processingUnitName || step.processingRoleName || step.donVi);
          const approvalText = normalizeWorkflowText(step.approvalUnitName || step.approvalRoleName, "");
          const approvalSnippet = approvalText && (
            <span className="sr-only">Đơn vị/Vai trò ký duyệt: {approvalText}</span>
          );
          void approvalSnippet;
          const nestedBranchStepIds = step.parallelInfo?.branches.flatMap((branch) =>
            branch.steps
              .map((branchStep) => getStepInstanceId(branchStep))
              .filter((branchStepId): branchStepId is number => typeof branchStepId === "number"),
          ) ?? [];
          const stepIdsInContainer = stepId != null ? [stepId, ...nestedBranchStepIds] : nestedBranchStepIds;
          const processingDocs = getStepDocuments(stepId ?? undefined, "Processing");
          const approvalDocs = getStepDocuments(stepId ?? undefined, "Approval");
          const isDocumentPanelStep = documentPanel?.stepId === stepId;
          const stepDocumentsPermissionDenied = isDocumentPanelStep && documentsPermissionDenied;
          const stepDocumentsLoading = isDocumentPanelStep && documentsLoading;
          // isCurrentStep && currentStepAction && canShowAction
          const canShowAction = !canShowCurrentStepActionResolved || canShowCurrentStepActionResolved(step);

          return (
            <div key={stepId ?? step.ten} className="space-y-2">
              <WorkflowStepItem
                step={step}
                processingText={processingText}
                approvalText={approvalText}
                documentCounts={{
                  processing: processingDocs.length,
                  approval: approvalDocs.length,
                }}
                documentsLoading={stepDocumentsLoading}
                documentsPermissionDenied={stepDocumentsPermissionDenied}
                onViewDocuments={(_, phase, targetStep) => {
                  if (targetStep) {
                    openDocumentPanel(targetStep as WorkflowDetailStep, phase);
                  }
                }}
                onCurrentStepAction={currentStepAction}
                canShowCurrentStepAction={() => canShowAction}
                currentStepActionLabel={currentStepActionLabel}
                currentStepActionTooltip={currentStepActionTooltip}
                registerDetailsRef={registerContainerRef(stepIdsInContainer)}
                registerSummaryRef={stepId != null ? registerAnchorRef(stepId) : undefined}
                focusStepId={resolvedFocusStepId}
              />

              {step.parallelInfo && (
                <WorkflowParallelGroupCard
                  parallelInfo={step.parallelInfo}
                  focusStepId={resolvedFocusStepId}
                  onBranchSkip={onBranchSkip}
                  renderBranchStep={(branch, branchStep) => {
                    const branchStepId = getStepInstanceId(branchStep);
                    const branchProcessingText = normalizeWorkflowText(
                      branchStep.processingUnitName || branchStep.processingRoleName || branchStep.donVi,
                    );
                    const branchApprovalText = normalizeWorkflowText(
                      branchStep.approvalUnitName || branchStep.approvalRoleName,
                      "",
                    );
                    const branchProcessingDocs = getStepDocuments(branchStepId ?? undefined, "Processing");
                    const branchApprovalDocs = getStepDocuments(branchStepId ?? undefined, "Approval");
                    const branchIsDocumentPanelStep = documentPanel?.stepId === branchStepId;
                    const branchDocumentsPermissionDenied = branchIsDocumentPanelStep && documentsPermissionDenied;
                    const branchDocumentsLoading = branchIsDocumentPanelStep && documentsLoading;

                    return (
                      <WorkflowStepItem
                        key={branchStepId ?? branchStep.ten}
                        step={branchStep}
                        processingText={branchProcessingText}
                        approvalText={branchApprovalText}
                        documentCounts={{
                          processing: branchProcessingDocs.length,
                          approval: branchApprovalDocs.length,
                        }}
                        documentsLoading={branchDocumentsLoading}
                        documentsPermissionDenied={branchDocumentsPermissionDenied}
                        onViewDocuments={(_, phase, targetStep) => {
                          if (targetStep) {
                            openDocumentPanel(targetStep as WorkflowDetailStep, phase);
                          }
                        }}
                        onCurrentStepAction={onBranchCurrentStepAction ? () => onBranchCurrentStepAction(branch) : undefined}
                        currentStepActionLabel={currentStepActionLabel}
                        currentStepActionTooltip={onBranchCurrentStepAction ? () => "Cập nhật bước hiện tại" : undefined}
                        onSecondaryAction={onBranchStepClick ? () => onBranchStepClick(branchStep) : undefined}
                        secondaryActionLabel="Xem"
                        secondaryActionTooltip={() => "Xem chi tiết bước"}
                        registerSummaryRef={branchStepId != null ? registerAnchorRef(branchStepId) : undefined}
                        focusStepId={resolvedFocusStepId}
                        variant="branch"
                      />
                    );
                  }}
                />
              )}
            </div>
          );
        })
      )}

      {documentPanel && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={() => setDocumentPanel(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold tracking-wide text-slate-400">TÀI LIỆU THEO BƯỚC</p>
                <h3 className="text-sm font-bold text-slate-900">{documentPanel.title}</h3>
                <p className="text-xs text-slate-500">{documentItems.length} file</p>
              </div>
              <button
                type="button"
                onClick={() => setDocumentPanel(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              {documentsPermissionDenied ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-10 text-center text-sm text-amber-700">
                  Không có quyền xem tài liệu.
                </div>
              ) : documentsLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  <i className="fa-solid fa-circle-notch fa-spin mr-2" />
                  Đang tải tài liệu...
                </div>
              ) : documentItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                  Chưa có tài liệu cho giai đoạn này.
                </div>
              ) : (
                <div className="space-y-2">
                  {documentItems.map((file) => (
                    <div key={file.id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-slate-800">{file.tenFile}</div>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span>Loại file: <strong className="text-slate-700">{getFileTypeLabel(file)}</strong></span>
                            <span>Người upload: <strong className="text-slate-700">{getFileUploaderLabel(file)}</strong></span>
                            <span>Ngày upload: <strong className="text-slate-700">{formatUploadDate(file.ngayTao)}</strong></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openTaiLieuFile(file.id)}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadTaiLieuFile(file.id, file.tenFile)}
                            className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Tải xuống
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
