export const DEFAULT_PARALLEL_BRANCH_LABEL_PREFIX = "Nhánh";
export const MAX_PARALLEL_BRANCH_LABEL_LENGTH = 100;

export function getDefaultParallelBranchLabel(index: number) {
  return `${DEFAULT_PARALLEL_BRANCH_LABEL_PREFIX} ${index + 1}`;
}

export function normalizeParallelBranchLabel(value?: string | null) {
  return (value ?? "").trim();
}

type ParallelBranchLabelSource =
  | string
  | {
      branchName?: string | null;
      tenNhanh?: string | null;
      name?: string | null;
    }
  | null
  | undefined;

export function resolveParallelBranchLabel(
  branchOrName: ParallelBranchLabelSource,
  index: number,
) {
  const branchName =
    typeof branchOrName === "string"
      ? branchOrName
      : branchOrName?.branchName ?? branchOrName?.tenNhanh ?? branchOrName?.name;
  const trimmed = normalizeParallelBranchLabel(branchName);
  return trimmed || getDefaultParallelBranchLabel(index);
}
