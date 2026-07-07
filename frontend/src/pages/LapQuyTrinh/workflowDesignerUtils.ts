import type { ParallelGroupDraft, WorkflowStepDraft } from "./workflowDesignerTypes";

export function buildParallelBranchStepIdSet(parallelGroups: ParallelGroupDraft[]): Set<string> {
  return new Set(parallelGroups.flatMap((group) => group.branches.flatMap((branch) => branch.stepIds)));
}

export function getMainWorkflowSteps(
  steps: WorkflowStepDraft[],
  parallelGroups: ParallelGroupDraft[],
): WorkflowStepDraft[] {
  const branchStepIds = buildParallelBranchStepIdSet(parallelGroups);
  return steps.filter((step) => !step.nhanhId && !branchStepIds.has(step.id));
}
