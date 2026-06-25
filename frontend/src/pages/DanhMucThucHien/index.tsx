import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SelectField } from "@/components/ui/select";
import { AddModal } from "./AddModal";
import { EditModal } from "./EditModal";
import { DeleteModal } from "./DeleteModal";
import { getAllHinhThuc, createHinhThuc, updateHinhThuc, deleteHinhThuc } from "@/services/hinhThauApi";
import type { HinhThucDauThau } from "@/services/hinhThauApi";
import { getWorkflowTemplates, previewWorkflowTemplate, getWorkflows } from "@/services/workflowApi";
import http from "@/util/http";

/* ─ Typical steps per loại hình (informational only) ──── */
type DotState = "done" | "warn" | "idle";
type StepRow = { state: DotState; ten: string; donVi: string; thoiHan: string };

const DEFAULT_STEPS: Record<string, StepRow[]> = {
  "Chỉ định thầu tự quyết định LCNT": [
    { state: "done", ten: "1. Đề xuất mua sắm", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "done", ten: "2. Tờ trình chủ trương", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "3. Lập hồ sơ mời thầu", donVi: "K/p mua sắm", thoiHan: "5 ngày" },
    { state: "idle", ten: "4. Phê duyệt hồ sơ mời thầu", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "5. QĐ chỉ định nhà thầu", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
  ],
  "Chỉ định thầu rút gọn": [
    { state: "done", ten: "1. Đề xuất mua sắm", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "done", ten: "2. Tờ trình chủ trương", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "done", ten: "3. Đăng tải yêu cầu báo giá", donVi: "K/p mua sắm", thoiHan: "5 ngày" },
    { state: "warn", ten: "4. Biên bản kiểm tra báo giá", donVi: "Tổ kiểm tra giá", thoiHan: "3 ngày" },
    { state: "idle", ten: "5. Tờ trình phê duyệt dự toán", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "6. QĐ phê duyệt dự toán", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "7. QĐ chỉ định nhà thầu", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
  ],
  "Chỉ định thầu tự quyết định": [
    { state: "done", ten: "1. Đề xuất mua sắm", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "done", ten: "2. Tờ trình chủ trương", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "3. Lập hồ sơ mời thầu", donVi: "K/p mua sắm", thoiHan: "5 ngày" },
    { state: "idle", ten: "4. Phê duyệt hồ sơ mời thầu", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "5. QĐ chỉ định nhà thầu", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
  ],
  "Chỉ định thầu thông thường": [
    { state: "idle", ten: "1. Đề xuất mua sắm", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "idle", ten: "2. Tờ trình chủ trương", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "3. Lập hồ sơ yêu cầu", donVi: "K/p mua sắm", thoiHan: "5 ngày" },
    { state: "idle", ten: "4. Thẩm định hồ sơ yêu cầu", donVi: "Tổ thẩm định", thoiHan: "3 ngày" },
    { state: "idle", ten: "5. Phê duyệt hồ sơ yêu cầu", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "6. Đánh giá hồ sơ đề xuất", donVi: "Tổ chuyên gia", thoiHan: "5 ngày" },
    { state: "idle", ten: "7. Phê duyệt kết quả lựa chọn NT", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
  ],
  "Chào hàng cạnh tranh": [
    { state: "done", ten: "1. Đề xuất mua sắm", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "done", ten: "2. Tờ trình chủ trương", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "done", ten: "3. Đăng tải yêu cầu báo giá", donVi: "K/p mua sắm", thoiHan: "5 ngày" },
    { state: "warn", ten: "4. Biên bản kiểm tra báo giá", donVi: "Tổ kiểm tra giá", thoiHan: "3 ngày" },
    { state: "idle", ten: "5. Tờ trình phê duyệt dự toán", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "6. QĐ phê duyệt dự toán", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "7. Tờ trình kế hoạch LCNT", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "idle", ten: "8. QĐ kế hoạch LCNT", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "9. Đăng tải kế hoạch LCNT", donVi: "K/p mua sắm", thoiHan: "1 ngày" },
    { state: "idle", ten: "10. Phát hành hồ sơ mời thầu", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "idle", ten: "11. Nộp hồ sơ dự thầu", donVi: "Nhà thầu", thoiHan: "5 ngày" },
    { state: "idle", ten: "12. Mở thầu & đánh giá HSDT", donVi: "Tổ chuyên gia", thoiHan: "5 ngày" },
    { state: "idle", ten: "13. Trình kết quả lựa chọn NT", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "14. QĐ phê duyệt kết quả đấu thầu", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
  ],
  "Đấu thầu rộng rãi": [
    { state: "done", ten: "1. Đề xuất mua sắm", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "done", ten: "2. Tờ trình chủ trương", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "3. Tờ trình phê duyệt dự toán", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "idle", ten: "4. QĐ phê duyệt dự toán", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "5. Tờ trình kế hoạch LCNT", donVi: "K/p mua sắm", thoiHan: "3 ngày" },
    { state: "idle", ten: "6. QĐ kế hoạch LCNT", donVi: "Giám đốc BV", thoiHan: "2 ngày" },
    { state: "idle", ten: "7. Đăng tải kế hoạch LCNT", donVi: "K/p mua sắm", thoiHan: "1 ngày" },
    { state: "idle", ten: "8. Lập hồ sơ mời thầu", donVi: "K/p mua sắm", thoiHan: "7 ngày" },
    { state: "idle", ten: "9. Phê duyệt HSMT", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
    { state: "idle", ten: "10. Đăng tải mời thầu", donVi: "K/p mua sắm", thoiHan: "10 ngày" },
    { state: "idle", ten: "11. Nộp HSDT", donVi: "Nhà thầu", thoiHan: "15 ngày" },
    { state: "idle", ten: "12. Mở thầu", donVi: "Tổ chuyên gia", thoiHan: "1 ngày" },
    { state: "idle", ten: "13. Đánh giá HSDT", donVi: "Tổ chuyên gia", thoiHan: "10 ngày" },
    { state: "idle", ten: "14. Trình kết quả lựa chọn NT", donVi: "K/p mua sắm", thoiHan: "2 ngày" },
    { state: "idle", ten: "15. QĐ phê duyệt kết quả", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
    { state: "idle", ten: "16. Đăng tải kết quả LCNT", donVi: "K/p mua sắm", thoiHan: "1 ngày" },
    { state: "idle", ten: "17. Ký kết hợp đồng", donVi: "Giám đốc BV", thoiHan: "3 ngày" },
  ],
};

const HT_BADGE: Record<string, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu tự quyết định LCNT": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
  "Mua sắm trực tiếp": "bg-cyan-100 text-cyan-700",
  "Chào giá trực tuyến thông thường": "bg-indigo-100 text-indigo-700",
  "Chào giá trực tuyến rút gọn": "bg-indigo-100 text-indigo-700",
  "Mua sắm trực tuyến": "bg-teal-100 text-teal-700",
  "Đặt hàng": "bg-orange-100 text-orange-700",
};

type DanhMuc = {
  id: number;
  maHinhThuc: string;
  ten: string;
  badge: string;
  soGoi: number;
  active: boolean;
  steps: { state: DotState; ten: string; donVi: string; thoiHan: string }[];
};

function Dot({ state }: { state: DotState }) {
  const dotCls: Record<DotState, string> = {
    done: "bg-emerald-500 text-white",
    warn: "bg-amber-500 text-white",
    idle: "bg-slate-200",
  };
  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${dotCls[state]}`}>
      {state === "done" && <i className="fa-solid fa-check" />}
      {state === "warn" && <i className="fa-solid fa-triangle-exclamation" />}
    </div>
  );
}

function mapToDanhMuc(item: HinhThucDauThau): DanhMuc {
  const steps = DEFAULT_STEPS[item.tenHinhThuc] ?? [];
  return {
    id: item.id,
    maHinhThuc: item.maHinhThuc,
    ten: item.tenHinhThuc,
    badge: HT_BADGE[item.tenHinhThuc] ?? "bg-slate-100 text-slate-600",
    soGoi: item.soGoi,
    active: item.trangThaiHoatDong,
    steps,
  };
}

export default function DanhMucThucHien() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DanhMuc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DanhMuc | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [sortField, setSortField] = useState<"ten" | "steps" | "soGoi" | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanhMuc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DanhMuc | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "history">("info");
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<StepRow[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllHinhThuc();
      const mapped = data.map(mapToDanhMuc);
      setItems(mapped);
    } catch {
      toast.error("Không thể tải danh mục thực hiện");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Load template steps khi chọn item
  async function handleSelectItem(item: DanhMuc) {
    setSelected(item);
    setSelectedSteps([]);
    setLoadingSteps(true);
    try {
      const templates = await getWorkflowTemplates(item.ten);
      if (templates.length > 0) {
        const preview = await previewWorkflowTemplate(templates[0].id);
        setSelectedSteps(preview.steps.map((s, i) => ({
          state: "idle" as DotState,
          ten: `${i + 1}. ${s.tenBuoc}`,
          donVi: String(s.donViXuLyId ?? "—"),
          thoiHan: `${s.soNgayLapHoSo} ngày`,
        })));
      }
    } catch { /* fallback về DEFAULT_STEPS */ }
    setLoadingSteps(false);
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = items
    .filter((d) => {
      const matchSearch = !search || d.ten.toLowerCase().includes(search.toLowerCase()) || d.maHinhThuc.toLowerCase().includes(search.toLowerCase());
      const matchActive = filterActive === "" || String(d.active) === filterActive;
      return matchSearch && matchActive;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let cmp = 0;
      if (sortField === "ten") cmp = a.ten.localeCompare(b.ten, "vi");
      else if (sortField === "soGoi") cmp = a.soGoi - b.soGoi;
      else if (sortField === "steps") cmp = a.steps.length - b.steps.length;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selItem = selected ?? null;
  const doneCount = selItem?.steps.filter((s) => s.state === "done").length ?? 0;
  const pct = selItem && selItem.steps.length > 0 ? Math.round((doneCount / selItem.steps.length) * 100) : 0;

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
    return sortDir === "asc"
      ? <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
      : <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />;
  }

  async function onAdd(values: { id: string; hinhThuc: string; badge: string }) {
    try {
      await createHinhThuc({ maHinhThuc: values.id.trim().toUpperCase(), tenHinhThuc: values.hinhThuc.trim() });
      toast.success(`Đã thêm danh mục "${values.hinhThuc}"`);
      setAddOpen(false);
      reload();
    } catch { toast.error("Thêm danh mục thất bại"); }
  }

  async function onEdit(values: { id: string; hinhThuc: string; badge: string }) {
    if (!editTarget) return;
    try {
      await updateHinhThuc(editTarget.id, { tenHinhThuc: values.hinhThuc.trim() });
      toast.success("Đã cập nhật danh mục");
      setEditTarget(null);
      reload();
    } catch { toast.error("Cập nhật thất bại"); }
  }

  function toggleActive(item: DanhMuc, e: React.MouseEvent) {
    e.stopPropagation();
    updateHinhThuc(item.id, { trangThaiHoatDong: !item.active }).then(() => {
      reload();
    }).catch(() => toast.error("Cập nhật thất bại"));
  }

  async function doDelete() {
    if (!deleteTarget) return;
    try {
      await deleteHinhThuc(deleteTarget.id);
      toast.success(`Đã xóa danh mục "${deleteTarget.ten}"`);
      setDeleteTarget(null);
      reload();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        "Xóa thất bại";
      toast.error(message);
    }
  }

  function requestDelete(item: DanhMuc, e: React.MouseEvent) {
    e.stopPropagation();
    if (item.soGoi > 0) {
      toast.error("Không thể xóa hình thức đấu thầu đang được sử dụng bởi các gói thầu.");
      return;
    }
    setDeleteTarget(item);
  }

  async function goEditQuyTrinh() {
    if (!selItem) return;
    try {
      const workflows = await getWorkflows(selItem.ten);
      const related = workflows.filter((w) =>
        w.hinhThucId === selItem.id || w.loaiHinhDauThau === selItem.ten
      );
      const workflow =
        related.find((w) => w.laQuyTrinhChuan) ??
        related.find((w) => w.trangThaiHoatDong) ??
        related[0];

      if (workflow) {
        navigate(`/lap-quy-trinh?id=${workflow.id}`);
        return;
      }
      toast.info("Hình thức này chưa có quy trình để mở.");
    } catch {
      toast.error("Không thể tải quy trình của hình thức này.");
    }
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Danh mục thực hiện</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <i className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus text-xs" /> Thêm hình thức đấu thầu
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SUMMARY CARDS */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl mr-2" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <i className="fa-solid fa-table-list text-4xl text-slate-200 mb-3" />
              <p className="text-sm font-medium text-slate-500">Chưa có hình thức đấu thầu nào</p>
            </div>
          ) : (
            <>
              {/* TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">Danh sách hình thức đấu thầu</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                      <input type="text" placeholder="Tìm hình thức, mã..." value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                      />
                    </div>
                    <SelectField
                      value={filterActive || "__all"}
                      onValueChange={(value) => { setFilterActive(value === "__all" ? "" : (value as "true" | "false")); setPage(1); }}
                      options={[
                        { value: "__all", label: "Tất cả trạng thái" },
                        { value: "true", label: "Đang hoạt động" },
                        { value: "false", label: "Đã ẩn" },
                      ]}
                      triggerClassName="h-8 min-w-[150px] rounded-lg bg-white px-2 text-xs"
                    />
                    {(search || filterActive) && (
                      <button onClick={() => { setSearch(""); setFilterActive(""); setPage(1); }}
                        className="text-xs text-slate-400 hover:text-red-500"><i className="fa-solid fa-xmark" /></button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                        <th className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("ten")}>
                          Hình thức <SortIcon field="ten" />
                        </th>
                        <th className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("steps")}>
                          Số bước <SortIcon field="steps" />
                        </th>
                        <th className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("soGoi")}>
                          Số gói đang thực hiện <SortIcon field="soGoi" />
                        </th>
                        <th className="px-5 py-3 text-left">Trạng thái</th>
                        <th className="px-5 py-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginated.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">Không tìm thấy danh mục phù hợp</td></tr>
                      ) : (
                        paginated.map((d) => (
                          <tr key={d.id} onClick={() => handleSelectItem(d)}
                            className={`cursor-pointer transition-colors ${selItem?.id === d.id ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                            <td className="px-5 py-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.badge} ${!d.active ? "opacity-50" : ""}`}>
                                {d.ten}
                              </span>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{d.maHinhThuc}</div>
                            </td>
                            <td className="px-5 py-3 text-center font-semibold text-slate-700">{d.steps.length}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.soGoi > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                                {d.soGoi} gói
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {d.active ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                  <i className="fa-solid fa-circle-check" /> Đang hoạt động
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                  <i className="fa-solid fa-eye-slash" /> Đã ẩn
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button title="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); setEditTarget(d); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                  <i className="fa-solid fa-pen text-xs" />
                                </button>
                                <button title={d.active ? "Ẩn danh mục" : "Hiện danh mục"}
                                  onClick={(e) => toggleActive(d, e)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${d.active ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50" : "text-amber-500 hover:text-slate-400 hover:bg-slate-100"}`}>
                                  <i className={`fa-solid ${d.active ? "fa-eye-slash" : "fa-eye"} text-xs`} />
                                </button>
                                <button title={d.soGoi > 0 ? `Không thể xóa (${d.soGoi} gói)` : "Xóa danh mục"}
                                  onClick={(e) => requestDelete(d, e)}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${d.soGoi > 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
                                  <i className="fa-solid fa-trash text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-400">
                      Hiển thị {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} danh mục
                    </span>
                    <div className="flex items-center gap-1">
                      <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                        <i className="fa-solid fa-chevron-left text-xs" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button key={n} onClick={() => setPage(n)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold ${page === n ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{n}</button>
                      ))}
                      <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                        <i className="fa-solid fa-chevron-right text-xs" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* DETAIL PANEL */}
        {selItem && (
          <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto hidden xl:block">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-start justify-between mb-1">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${selItem.badge}`}>{selItem.ten}</span>
                <button title="Sửa hình thức" onClick={(e) => { e.stopPropagation(); setEditTarget(selItem); }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <i className="fa-solid fa-pen text-[10px]" /> Sửa hình thức
                </button>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">{selItem.maHinhThuc}</div>
              <div className="text-xs text-slate-400 mt-1">{selItem.steps.length} bước quy trình</div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5 mt-3">
                <span>Hoàn thành mẫu</span>
                <span>{doneCount}/{selItem.steps.length} ({pct}%)</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="flex border-b border-slate-100">
              {(["info", "history"] as const).map((tab) => (
                <button key={tab} onClick={() => setDetailTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${detailTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>
                  {tab === "info" ? "Thông tin" : "Lịch sử"}
                </button>
              ))}
            </div>

            {detailTab === "info" && (
              <div className="p-5">
                <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">CÁC BƯỚC QUY TRÌNH</div>
                <div className="space-y-3">
                  {selectedSteps.length === 0 && !loadingSteps && <p className="text-xs text-slate-400 italic">Chưa có bước cấu hình.</p>}
                  {loadingSteps && <p className="text-xs text-slate-400 italic">Đang tải...</p>}
                  {(selectedSteps.length > 0 ? selectedSteps : selItem.steps).map((s: any) => (
                    <div key={s.ten} className="flex items-start gap-2.5">
                      <Dot state={s.state || "idle"} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-800">{s.ten}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400">{s.donVi}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[11px] text-slate-400">{s.thoiHan}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={goEditQuyTrinh}
                  className="mt-5 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors">
                  <i className="fa-solid fa-diagram-project text-xs" /> Đi tới quy trình
                </button>
              </div>
            )}
            {detailTab === "history" && (
              <AuditLogView
                hinhThucId={selItem.id}
                hinhThucMa={selItem.maHinhThuc}
                hinhThucTen={selItem.ten}
              />
            )}
          </aside>
        )}
      </div>

      {addOpen && <AddModal existingItems={items.map((d) => ({ id: d.maHinhThuc, hinhThuc: d.ten }))} onSave={onAdd} onClose={() => setAddOpen(false)} />}
      {editTarget && (
        <EditModal
          defaultValues={{ id: editTarget.maHinhThuc, hinhThuc: editTarget.ten, badge: editTarget.badge }}
          existingItems={items.map((d) => ({ id: d.maHinhThuc, hinhThuc: d.ten }))}
          onSave={onEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && <DeleteModal tenDanhMuc={deleteTarget.ten} onConfirm={doDelete} onClose={() => setDeleteTarget(null)} />}
    </>
  );
}

/* ─── Audit Log component ─── */
function AuditLogView({
  hinhThucId,
  hinhThucMa,
  hinhThucTen,
}: {
  hinhThucId: number;
  hinhThucMa: string;
  hinhThucTen: string;
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    http.get<any>("/audit-log", { params: { page: 1, pageSize: 200 } })
      .then((res: any) => {
        const items = res?.data?.items ?? res?.items ?? [];
        const list = Array.isArray(items) ? items : [];
        setLogs(list.filter((l: any) => isHinhThucAuditLog(l, hinhThucId, hinhThucMa, hinhThucTen)));
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [hinhThucId, hinhThucMa, hinhThucTen]);
  if (loading) return <div className="p-5 text-center text-xs text-slate-400">Đang tải...</div>;
  if (logs.length === 0) return (
    <div className="p-5 text-center">
      <i className="fa-solid fa-clock-rotate-left text-3xl text-slate-200" />
      <p className="text-xs text-slate-400 mt-2">Chưa có lịch sử</p>
    </div>
  );
  return (
    <div className="p-5 space-y-3">
      {logs.map((l: any) => (
        <div key={l.id ?? l.idCongKhai} className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <i className="fa-solid fa-clock-rotate-left text-blue-500 text-[10px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-700 font-medium">{l.hanhDong}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{formatAuditDetail(l.moTaChiTiet)}</p>
            <div className="mt-0.5 space-y-0.5 text-[11px] text-slate-400">
              <p>Thời gian: {l.thoiGianThucHien ? new Date(l.thoiGianThucHien).toLocaleString("vi-VN") : "—"}</p>
              <p>Người thực hiện: {l.nguoiThucHienId ?? "—"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function isHinhThucAuditLog(log: any, id: number, ma: string, ten: string) {
  const raw = String(log?.moTaChiTiet ?? "");
  if (!raw) return false;

  try {
    const detail = JSON.parse(raw);
    const table = detail._bang ?? detail.tableName;
    const recordId = Number(detail._banGhiId ?? detail.recordId);
    if (table === "HinhThucDauThau" && recordId === id) return true;
  } catch {
    // Bản ghi cũ có thể là text hoặc JSON thiếu metadata.
  }

  const lower = raw.toLowerCase();
  const knownKeys = ["TenHinhThuc", "MaHinhThuc", "HanMucToiDa", "tenHinhThuc", "maHinhThuc", "hanMucToiDa"];
  return lower.includes(ma.toLowerCase()) ||
    lower.includes(ten.toLowerCase()) ||
    knownKeys.some((key) => lower.includes(key.toLowerCase()));
}

function formatAuditDetail(raw?: string): string {
  if (!raw) return "Không có mô tả chi tiết";

  try {
    const detail = JSON.parse(raw);
    if (!detail || typeof detail !== "object") return String(raw);

    const labels: Record<string, string> = {
      TenHinhThuc: "Tên hình thức",
      tenHinhThuc: "Tên hình thức",
      MaHinhThuc: "Mã hình thức",
      maHinhThuc: "Mã hình thức",
      HanMucToiDa: "Hạn mức tối đa",
      hanMucToiDa: "Hạn mức tối đa",
      TrangThaiHoatDong: "Trạng thái",
      trangThaiHoatDong: "Trạng thái",
    };

    const parts = Object.entries(detail)
      .filter(([key]) => !key.startsWith("_"))
      .map(([key, value]) => {
        const label = labels[key] ?? key;
        if (value && typeof value === "object" && "cu" in value && "moi" in value) {
          const change = value as { cu?: unknown; moi?: unknown };
          return `${label}: ${formatAuditValue(change.cu)} → ${formatAuditValue(change.moi)}`;
        }
        return `${label}: ${formatAuditValue(value)}`;
      });

    return parts.length > 0 ? parts.join("; ") : "Không có mô tả chi tiết";
  } catch {
    return raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
  }
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}
