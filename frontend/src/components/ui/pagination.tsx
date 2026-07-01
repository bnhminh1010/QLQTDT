import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  className?: string;
  onPageChange: (page: number) => void;
};

function buildPageItems(page: number, totalPages: number): Array<number | "..."> {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<Array<number | "...">>((acc, n, idx, arr) => {
      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(n);
      return acc;
    }, []);
}

function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  itemLabel = "kết quả",
  className,
  onPageChange,
}: PaginationProps) {
  if (totalItems <= pageSize || totalPages <= 1) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);
  const pageItems = buildPageItems(safePage, safeTotalPages);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3",
        className,
      )}
    >
      <span className="text-xs text-slate-400">
        Hiển thị {from}–{to} / {totalItems} {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i className="fa-solid fa-chevron-left text-xs" />
        </button>
        {pageItems.map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                safePage === item
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage === safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <i className="fa-solid fa-chevron-right text-xs" />
        </button>
      </div>
    </div>
  );
}

export { Pagination };
