import type { ReactNode } from "react";
import { normalizeWorkflowText } from "./workflowDetailUtils";
import WorkflowStepsPanel from "./WorkflowStepsPanel";
import type { WorkflowDetailStep } from "./workflowDetailTypes";

type DetailRow = {
  label: string;
  value: string;
  valueClassName?: string;
};

type DetailBadge = {
  label: string;
  className: string;
};

type DetailAlert = {
  title: string;
  description: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

type DetailFooterAction = {
  label: string;
  onClick: () => void;
  className?: string;
};

type Props = {
  code: string;
  title: string;
  subtitle?: string;
  badges: DetailBadge[];
  progressLabel?: string;
  progressValue?: string;
  progressBarClassName?: string;
  metaRows: DetailRow[];
  noteTags?: string[];
  noteTagsLabel?: string;
  noteTagsClassName?: string;
  alert?: DetailAlert;
  stepInfoRows?: DetailRow[];
  stepInfoTitle?: string;
  stepsTitle?: string;
  steps: WorkflowDetailStep[];
  stepsLoading?: boolean;
  stepsEmptyMessage?: string;
  onCurrentStepAction?: (step: WorkflowDetailStep) => void;
  canShowCurrentStepAction?: (step: WorkflowDetailStep) => boolean;
  currentStepActionLabel?: string;
  currentStepActionTooltip?: (step: WorkflowDetailStep) => string;
  onUpdateCurrentStep?: (step: WorkflowDetailStep) => void;
  canUpdateCurrentStep?: (step: WorkflowDetailStep) => boolean;
  onBranchStepClick?: Parameters<typeof WorkflowStepsPanel>[0]["onBranchStepClick"];
  onBranchCurrentStepAction?: Parameters<typeof WorkflowStepsPanel>[0]["onBranchCurrentStepAction"];
  onBranchSkip?: Parameters<typeof WorkflowStepsPanel>[0]["onBranchSkip"];
  actions?: ReactNode;
  footerAction?: DetailFooterAction;
};

function Row({ label, value, valueClassName }: DetailRow) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`max-w-[150px] text-right font-semibold ${valueClassName ?? "text-slate-800"}`}>
        {normalizeWorkflowText(value)}
      </span>
    </div>
  );
}

export default function GoiThauDetailPanel({
  code,
  title,
  subtitle,
  badges,
  progressLabel,
  progressValue,
  progressBarClassName = "bg-blue-500",
  metaRows,
  noteTags,
  noteTagsLabel = "ĐƠN VỊ THEO DÕI",
  noteTagsClassName = "bg-sky-50 text-sky-700 border border-sky-200",
  alert,
  stepInfoRows,
  stepInfoTitle = "THÔNG TIN BƯỚC HIỆN TẠI",
  stepsTitle = "CÁC BƯỚC QUY TRÌNH",
  steps,
  stepsLoading = false,
  stepsEmptyMessage = "Chua co du lieu buoc quy trinh tu backend.",
  onCurrentStepAction,
  canShowCurrentStepAction,
  currentStepActionLabel,
  currentStepActionTooltip,
  onUpdateCurrentStep,
  canUpdateCurrentStep,
  onBranchStepClick,
  onBranchCurrentStepAction,
  onBranchSkip,
  actions = null,
  footerAction,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="font-mono text-xs font-bold text-blue-700 mb-1">{code}</div>
      <div className="text-sm font-bold text-slate-900 mb-0.5">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mb-3">{subtitle}</div>}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {badges.map((badge) => (
          <span
            key={`${badge.label}-${badge.className}`}
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      {alert && (
        <div className={`mb-4 rounded-xl px-3 py-2.5 text-xs ${alert.className ?? "border border-red-200 bg-red-50 text-red-700"}`}>
          <div className={`mb-1 flex items-center gap-1.5 font-semibold ${alert.titleClassName ?? ""}`}>
            <i className="fa-solid fa-circle-exclamation text-[10px]" />
            {alert.title}
          </div>
          <p className={`leading-relaxed ${alert.descriptionClassName ?? ""}`}>{alert.description}</p>
        </div>
      )}

      {progressLabel && progressValue && (
        <>
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Tiến độ quy trình</span>
            <span>{progressLabel} bước ({progressValue})</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div className={`h-full rounded-full ${progressBarClassName}`} style={{ width: progressValue }} />
          </div>
        </>
      )}

      <div className="space-y-2 mb-5">
        {metaRows.map((row) => (
          <Row key={row.label} {...row} />
        ))}

        {noteTags && noteTags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold tracking-wide">{noteTagsLabel}</span>
            <div className="flex flex-wrap gap-1">
              {noteTags.map((item) => (
                <span
                  key={item}
                  className={`${noteTagsClassName} text-[10px] px-1.5 py-0.5 rounded-full`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {stepInfoRows && stepInfoRows.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400">
              {stepInfoTitle}
            </p>
            <div className="space-y-2 text-xs">
              {stepInfoRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <span className="text-slate-400">{row.label}</span>
                  <span className={`text-right font-semibold ${row.valueClassName ?? "text-slate-800"}`}>
                    {normalizeWorkflowText(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">{stepsTitle}</div>
      <WorkflowStepsPanel
        loading={stepsLoading}
        steps={steps}
        emptyMessage={stepsEmptyMessage}
        onCurrentStepAction={onCurrentStepAction ?? onUpdateCurrentStep}
        onUpdateCurrentStep={onUpdateCurrentStep}
        canShowCurrentStepAction={canShowCurrentStepAction ?? canUpdateCurrentStep}
        canUpdateCurrentStep={canUpdateCurrentStep}
        currentStepActionLabel={currentStepActionLabel}
        currentStepActionTooltip={currentStepActionTooltip}
        onBranchStepClick={onBranchStepClick}
        onBranchCurrentStepAction={onBranchCurrentStepAction}
        onBranchSkip={onBranchSkip}
      />

      {actions && <div className="border-t border-slate-100 pt-4">{actions}</div>}

      {footerAction && (
        <button
          type="button"
          onClick={footerAction.onClick}
          className={footerAction.className ?? "w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors"}
        >
          <i className="fa-solid fa-arrow-right text-xs" />
          {footerAction.label}
        </button>
      )}
    </div>
  );
}
