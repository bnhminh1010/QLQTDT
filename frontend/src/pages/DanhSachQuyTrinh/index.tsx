import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import { getWorkflows } from "@/services/workflowApi";
import http from "@/util/http";

const HT_BADGE: Record<string, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};

const PAGE_SIZE = 10;

type SortField = "ten" | "ngayTao" | "buocList" | "";
type SortDir = "asc" | "desc";

type LocalQuyTrinh = {
  id: string;
  ten: string;
  hinhThuc: string;
  buocList: any[];
  trangThai: string;
  ngayTao: string;
};

export default function DanhSachQuyTrinh() {
  const navigate = useNavigate();
  const [list, setList] = useState<LocalQuyTrinh[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<LocalQuyTrinh | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterHT, setFilterHT] = useState("");
  const [sortField, setSortField] = useState<SortField>("");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const workflows = await getWorkflows();
      const mapped: LocalQuyTrinh[] = workflows.map((w) => ({
        id: String(w.id),
        ten: w.tenWorkflow,
        hinhThuc: '',
        buocList: [],
        trangThai: w.trangThaiHoatDong ? 'Đang hoạt động' : 'Đã tắt',
        ngayTao: '',
      }));
      setList(mapped);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleToggle(qt: LocalQuyTrinh) {
    const updated: LocalQuyTrinh = {
      ...qt,
      trangThai: qt.trangThai === "Đang hoạt động" ? "Đã tắt" : "Đang hoạt động",
    };
    setList((prev) => prev.map((x) => (x.id === qt.id ? updated : x)));
    toast.success(
      updated.trangThai === "Đang hoạt động"
        ? "Đã kích hoạt quy trình"
        : "Đã tắt quy trình",
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const id = parseInt(deleteTarget.id);
    if (!isNaN(id)) {
      http.del(`/workflows/${id}`).catch(() => {});
    }
    setList((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast.success(`Đã xóa quy trình "${deleteTarget.ten}"`);
    setDeleteTarget(null);
  }

  /* ── Filter + Sort ── */
  const filtered = list
    .filter((qt) => {
      const matchSearch =
        !search ||
        qt.ten.toLowerCase().includes(search.toLowerCase()) ||
        qt.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !filterStatus || qt.trangThai === filterStatus;
      const matchHT = !filterHT || qt.hinhThuc === filterHT;
      return matchSearch && matchStatus && matchHT;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let cmp = 0;
      if (sortField === "ten") cmp = a.ten.localeCompare(b.ten, "vi");
      else if (sortField === "ngayTao")
        cmp = new Date(a.ngayTao).getTime() - new Date(b.ngayTao).getTime();
      else if (sortField === "buocList")
        cmp = a.buocList.length - b.buocList.length;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
    return sortDir === "asc" ? (
      <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
    ) : (
      <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />
    );
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh sách quy trình
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            title="Tải lại"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i
              className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => navigate("/lap-quy-trinh")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus text-xs" /> Tạo quy trình
          </button>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tên, mã quy trình..."
              className="pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
            />
          </div>
          <SelectField
            value={filterStatus || "__all"}
            onValueChange={(value) => {
              setFilterStatus(value === "__all" ? "" : value);
              setPage(1);
            }}
            options={[
              { value: "__all", label: "Tất cả trạng thái" },
              { value: "Đang hoạt động", label: "Đang hoạt động" },
              { value: "Đã tắt", label: "Đã tắt" },
            ]}
            triggerClassName="h-9 min-w-[160px] rounded-xl bg-white text-xs"
          />
          <SelectField
            value={filterHT || "__all"}
            onValueChange={(value) => {
              setFilterHT(value === "__all" ? "" : value);
              setPage(1);
            }}
            options={[
              { value: "__all", label: "Tất cả hình thức" },
              ...Object.keys(HT_BADGE).map((ht) => ({ value: ht, label: ht })),
            ]}
            triggerClassName="h-9 min-w-[190px] rounded-xl bg-white text-xs"
          />
          {(search || filterStatus || filterHT) && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatus("");
                setFilterHT("");
                setPage(1);
              }}
              className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
            >
              <i className="fa-solid fa-xmark" /> Xóa lọc
            </button>
          )}
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} quy trình
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && list.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <i className="fa-solid fa-diagram-project text-4xl text-slate-200" />
              <p className="text-sm font-medium text-slate-500">
                Chưa có quy trình nào
              </p>
              <button
                onClick={() => navigate("/lap-quy-trinh")}
                className="mt-2 h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus" /> Tạo quy trình đầu tiên
              </button>
            </div>
          )}

          {/* No results after filter */}
          {!loading && list.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
              <i className="fa-solid fa-magnifying-glass text-3xl text-slate-200" />
              <p className="text-sm">Không tìm thấy quy trình phù hợp</p>
            </div>
          )}

          {/* Table */}
          {!loading && paginated.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th
                      className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => toggleSort("ten")}
                    >
                      Tên quy trình <SortIcon field="ten" />
                    </th>
                    <th className="px-5 py-3 text-left">Hình thức</th>
                    <th
                      className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => toggleSort("buocList")}
                    >
                      Số bước <SortIcon field="buocList" />
                    </th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th
                      className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => toggleSort("ngayTao")}
                    >
                      Ngày tạo <SortIcon field="ngayTao" />
                    </th>
                    <th className="px-5 py-3 text-left">Tóm tắt luồng</th>
                    <th className="px-5 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((qt) => (
                    <tr
                      key={qt.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800">
                          {qt.ten}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {qt.id}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${HT_BADGE[qt.hinhThuc] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {qt.hinhThuc}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {qt.buocList.length}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          bước
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${qt.trangThai === "Đang hoạt động" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {qt.trangThai}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(qt.ngayTao).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-3 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                          {qt.buocList.slice(0, 4).map((b, i) => (
                            <span
                              key={b.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                b.loai === "Bắt đầu"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : b.loai === "Kết thúc"
                                    ? "bg-red-50 text-red-500"
                                    : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {i + 1}.{" "}
                              {b.ten.length > 12
                                ? b.ten.slice(0, 12) + "…"
                                : b.ten}
                            </span>
                          ))}
                          {qt.buocList.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              +{qt.buocList.length - 4}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Chỉnh sửa"
                            onClick={() =>
                              navigate(`/lap-quy-trinh?id=${qt.id}`)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <i className="fa-solid fa-pen text-xs" />
                          </button>
                          <button
                            title={
                              qt.trangThai === "Đang hoạt động"
                                ? "Tắt quy trình"
                                : "Kích hoạt"
                            }
                            onClick={() => handleToggle(qt)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${qt.trangThai === "Đang hoạt động" ? "text-slate-500 hover:bg-slate-100" : "text-emerald-500 hover:bg-emerald-50"}`}
                          >
                            <i
                              className={`fa-solid ${qt.trangThai === "Đang hoạt động" ? "fa-toggle-on" : "fa-toggle-off"} text-xs`}
                            />
                          </button>
                          <button
                            title="Xóa"
                            onClick={() => setDeleteTarget(qt)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <i className="fa-solid fa-trash text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-xs text-slate-400">
                Hiển thị{" "}
                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} /{" "}
                {filtered.length} quy trình
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-left text-xs" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (n) =>
                      n === 1 || n === totalPages || Math.abs(n - page) <= 1,
                  )
                  .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                    if (idx > 0 && n - (arr[idx - 1] as number) > 1)
                      acc.push("…");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((n, i) =>
                    n === "…" ? (
                      <span
                        key={`e${i}`}
                        className="px-1 text-slate-400 text-xs"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {n}
                      </button>
                    ),
                  )}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-right text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Xóa quy trình
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bạn có chắc muốn xóa quy trình "
                  <strong>{deleteTarget.ten}</strong>"? Hành động này không thể
                  hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
