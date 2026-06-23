import { useState } from "react";
import { searchStepLibrary } from "../stepLibrary";
import type { StepLibraryEntry } from "../stepLibrary";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: StepLibraryEntry) => void;
}

export default function StepLibraryModal({ open, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const results = searchStepLibrary(query);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 my-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Thư viện bước
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bước... Đề xuất mua sắm, Lập HSMT, Mở thầu, Hợp đồng..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto space-y-1">
          {results.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Không tìm thấy bước phù hợp
            </p>
          ) : (
            results.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  onSelect(entry);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <p className="text-sm font-medium text-slate-800">
                  {entry.tenBuoc}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {entry.donViPhuTrach} · {entry.slaNgay} ngày
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
