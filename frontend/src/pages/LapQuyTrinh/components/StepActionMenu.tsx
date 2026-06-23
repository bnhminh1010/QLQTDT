import { useState, useRef, useEffect } from "react";

interface Props {
  onInsertAfter: () => void;
  onCreateParallel: () => void;
  onClone: () => void;
  onDelete: () => void;
}

export default function StepActionMenu({
  onInsertAfter,
  onCreateParallel,
  onClone,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <i className="fa-solid fa-ellipsis-vertical text-xs" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-200 py-1 min-w-[180px]">
          <button
            onClick={() => { setOpen(false); onInsertAfter(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            <i className="fa-solid fa-plus text-[10px] text-blue-500" />
            Thêm bước sau
          </button>
          <button
            onClick={() => { setOpen(false); onCreateParallel(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            <i className="fa-solid fa-code-branch text-[10px] text-purple-500" />
            Tạo nhánh song song
          </button>
          <button
            onClick={() => { setOpen(false); onClone(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
          >
            <i className="fa-solid fa-copy text-[10px] text-cyan-500" />
            Nhân bản bước
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
          >
            <i className="fa-solid fa-trash text-[10px]" />
            Xóa bước
          </button>
        </div>
      )}
    </div>
  );
}
