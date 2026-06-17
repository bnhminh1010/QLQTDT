import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AddModal } from "./AddModal";
import { EditModal } from "./EditModal";
import { DeleteModal } from "./DeleteModal";
import {
  addQuyTrinh,
  getQuyTrinhById,
  getQuyTrinhList,
  type HinhThucQT,
  type LoaiBuoc,
  type TrangThaiBuoc,
} from "@/pages/DanhSachQuyTrinh/quyTrinhService";

/* ─ RBAC ─ */
const MOCK_CURRENT_ROLE = "Admin";
const DM_CAN_ADD = MOCK_CURRENT_ROLE === "Admin";
const DM_CAN_EDIT =
  MOCK_CURRENT_ROLE === "Admin" || MOCK_CURRENT_ROLE === "Quản lý";
const DM_CAN_DELETE = MOCK_CURRENT_ROLE === "Admin";
const DM_CAN_TOGGLE =
  MOCK_CURRENT_ROLE === "Admin" || MOCK_CURRENT_ROLE === "Quản lý";

type DotState = "done" | "warn" | "idle";
type StepRow = { state: DotState; ten: string; donVi: string; thoiHan: string };
type DanhMuc = {
  id: string;
  hinhThuc: string;
  badge: string;
  soGoi: number;
  active: boolean;
  steps: StepRow[];
};

const DOT_CLS: Record<DotState, string> = {
  done: "bg-emerald-500 text-white",
  warn: "bg-amber-500 text-white",
  idle: "bg-slate-200",
};

const INIT_DATA: DanhMuc[] = [
  {
    id: "CDT-RG",
    hinhThuc: "Chỉ định thầu rút gọn",
    badge: "bg-blue-100 text-blue-700",
    soGoi: 7,
    active: true,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "done",
        ten: "3. Đăng tải yêu cầu báo giá",
        donVi: "K/p mua sắm",
        thoiHan: "5 ngày",
      },
      {
        state: "warn",
        ten: "4. Biên bản kiểm tra báo giá",
        donVi: "Tổ kiểm tra giá",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "5. Tờ trình phê duyệt dự toán",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "6. QĐ phê duyệt dự toán",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "7. QĐ chỉ định nhà thầu",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
  {
    id: "CDT-TQD",
    hinhThuc: "Chỉ định thầu tự quyết định",
    badge: "bg-emerald-100 text-emerald-700",
    soGoi: 4,
    active: true,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "3. Lập hồ sơ mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "5 ngày",
      },
      {
        state: "idle",
        ten: "4. Phê duyệt hồ sơ mời thầu",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "5. QĐ chỉ định nhà thầu",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
  {
    id: "CHCT",
    hinhThuc: "Chào hàng cạnh tranh",
    badge: "bg-amber-100 text-amber-700",
    soGoi: 8,
    active: true,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "done",
        ten: "3. Đăng tải yêu cầu báo giá",
        donVi: "K/p mua sắm",
        thoiHan: "5 ngày",
      },
      {
        state: "warn",
        ten: "4. Biên bản kiểm tra báo giá",
        donVi: "Tổ kiểm tra giá",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "5. Tờ trình phê duyệt dự toán",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "6. QĐ phê duyệt dự toán",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "7. Tờ trình kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "8. QĐ kế hoạch LCNT",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "9. Đăng tải kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "10. Phát hành hồ sơ mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "11. Nộp hồ sơ dự thầu",
        donVi: "Nhà thầu",
        thoiHan: "5 ngày",
      },
      {
        state: "idle",
        ten: "12. Mở thầu & đánh giá HSDT",
        donVi: "Tổ chuyên gia",
        thoiHan: "5 ngày",
      },
      {
        state: "idle",
        ten: "13. Trình kết quả lựa chọn NT",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "14. QĐ phê duyệt kết quả đấu thầu",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
  {
    id: "DTRR",
    hinhThuc: "Đấu thầu rộng rãi",
    badge: "bg-purple-100 text-purple-700",
    soGoi: 5,
    active: true,
    steps: [
      {
        state: "done",
        ten: "1. Đề xuất mua sắm",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "done",
        ten: "2. Tờ trình chủ trương",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "3. Tờ trình phê duyệt dự toán",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "4. QĐ phê duyệt dự toán",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "5. Tờ trình kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "6. QĐ kế hoạch LCNT",
        donVi: "Giám đốc BV",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "7. Đăng tải kế hoạch LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "8. Lập hồ sơ mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "7 ngày",
      },
      {
        state: "idle",
        ten: "9. Phê duyệt HSMT",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "10. Đăng tải mời thầu",
        donVi: "K/p mua sắm",
        thoiHan: "10 ngày",
      },
      {
        state: "idle",
        ten: "11. Nộp HSDT",
        donVi: "Nhà thầu",
        thoiHan: "15 ngày",
      },
      {
        state: "idle",
        ten: "12. Mở thầu",
        donVi: "Tổ chuyên gia",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "13. Đánh giá HSDT",
        donVi: "Tổ chuyên gia",
        thoiHan: "10 ngày",
      },
      {
        state: "idle",
        ten: "14. Trình kết quả lựa chọn NT",
        donVi: "K/p mua sắm",
        thoiHan: "2 ngày",
      },
      {
        state: "idle",
        ten: "15. QĐ phê duyệt kết quả",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
      {
        state: "idle",
        ten: "16. Đăng tải kết quả LCNT",
        donVi: "K/p mua sắm",
        thoiHan: "1 ngày",
      },
      {
        state: "idle",
        ten: "17. Ký kết hợp đồng",
        donVi: "Giám đốc BV",
        thoiHan: "3 ngày",
      },
    ],
  },
];

function Dot({ state }: { state: DotState }) {
  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${DOT_CLS[state]}`}
    >
      {state === "done" && <i className="fa-solid fa-check" />}
      {state === "warn" && <i className="fa-solid fa-triangle-exclamation" />}
    </div>
  );
}

type DMAuditEntry = {
  id: string;
  dmId: string;
  hanhDong: string;
  nguoiThucHien: string;
  thoiGian: string;
};

const INITIAL_DM_AUDIT: DMAuditEntry[] = [
  {
    id: "1",
    dmId: "CDT-RG",
    hanhDong: "Tạo hình thức đấu thầu",
    nguoiThucHien: "Admin",
    thoiGian: "01/01/2025 08:00",
  },
  {
    id: "2",
    dmId: "CDT-RG",
    hanhDong: "Đổi màu nhãn sang xanh dương",
    nguoiThucHien: "Admin",
    thoiGian: "02/01/2025 09:15",
  },
  {
    id: "3",
    dmId: "DTRR",
    hanhDong: "Cập nhật tên hình thức đấu thầu",
    nguoiThucHien: "Admin",
    thoiGian: "15/01/2025 09:30",
  },
  {
    id: "4",
    dmId: "CHCT",
    hanhDong: "Mở lại hoạt động",
    nguoiThucHien: "Admin",
    thoiGian: "20/01/2025 14:00",
  },
];

export default function DanhMucThucHien() {
  const navigate = useNavigate();
  const [items, setItems] = useState<DanhMuc[]>(INIT_DATA);
  const [selected, setSelected] = useState<DanhMuc>(INIT_DATA[0]);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [sortField, setSortField] = useState<
    "hinhThuc" | "soGoi" | "steps" | ""
  >("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanhMuc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DanhMuc | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "history">("info");
  const [auditLog, setAuditLog] = useState<DMAuditEntry[]>(INITIAL_DM_AUDIT);

  function addDMAudit(dmId: string, hanhDong: string) {
    setAuditLog((prev) => [
      {
        id: Date.now().toString(),
        dmId,
        hanhDong,
        nguoiThucHien: MOCK_CURRENT_ROLE,
        thoiGian: new Date().toLocaleString("vi-VN"),
      },
      ...prev,
    ]);
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  const filtered = items
    .filter((d) => {
      const matchSearch =
        !search ||
        d.hinhThuc.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase());
      const matchActive =
        filterActive === "" || String(d.active) === filterActive;
      return matchSearch && matchActive;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let cmp = 0;
      if (sortField === "hinhThuc")
        cmp = a.hinhThuc.localeCompare(b.hinhThuc, "vi");
      else if (sortField === "soGoi") cmp = a.soGoi - b.soGoi;
      else if (sortField === "steps") cmp = a.steps.length - b.steps.length;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selItem = items.find((d) => d.id === selected.id) ?? items[0];
  const doneCount = selItem.steps.filter((s) => s.state === "done").length;
  const pct =
    selItem.steps.length > 0
      ? Math.round((doneCount / selItem.steps.length) * 100)
      : 0;

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field)
      return <i className="fa-solid fa-sort text-slate-300 ml-1 text-[10px]" />;
    return sortDir === "asc" ? (
      <i className="fa-solid fa-sort-up text-blue-500 ml-1 text-[10px]" />
    ) : (
      <i className="fa-solid fa-sort-down text-blue-500 ml-1 text-[10px]" />
    );
  }

  function onAdd(values: { id: string; hinhThuc: string; badge: string }) {
    const newItem: DanhMuc = {
      id: values.id.trim().toUpperCase(),
      hinhThuc: values.hinhThuc.trim(),
      badge: values.badge,
      soGoi: 0,
      active: true,
      steps: [],
    };
    setItems((prev) => [...prev, newItem]);
    addDMAudit(newItem.id, `Tạo hình thức đấu thầu "${newItem.hinhThuc}"`);
    setAddOpen(false);
    toast.success(`Đã thêm danh mục "${newItem.hinhThuc}"`);
  }

  function onEdit(values: { id: string; hinhThuc: string; badge: string }) {
    if (!editTarget) return;
    const nextId = values.id.trim().toUpperCase();
    const nextName = values.hinhThuc.trim();
    const changes: string[] = [];
    if (editTarget.id !== nextId)
      changes.push(`Cập nhật mã từ ${editTarget.id} sang ${nextId}`);
    if (editTarget.hinhThuc !== nextName) changes.push("Cập nhật tên");
    if (editTarget.badge !== values.badge) changes.push("Đổi màu nhãn");

    setItems((prev) =>
      prev.map((d) =>
        d.id === editTarget.id
          ? { ...d, id: nextId, hinhThuc: nextName, badge: values.badge }
          : d,
      ),
    );
    if (editTarget.id !== nextId) {
      setAuditLog((prev) =>
        prev.map((entry) =>
          entry.dmId === editTarget.id ? { ...entry, dmId: nextId } : entry,
        ),
      );
    }
    addDMAudit(
      nextId,
      changes.length > 0 ? changes.join("; ") : "Cập nhật danh mục",
    );
    if (selected.id === editTarget.id)
      setSelected((s) => ({
        ...s,
        id: nextId,
        hinhThuc: nextName,
        badge: values.badge,
      }));
    setEditTarget(null);
    toast.success("Đã cập nhật danh mục");
  }

  function toggleActive(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const item = items.find((d) => d.id === id);
    if (!item) return;
    if (item.active && item.soGoi > 0) {
      toast.error(
        `Không thể ẩn danh mục đang có ${item.soGoi} gói thầu. Vui lòng kết thúc các gói thầu trước.`,
      );
      return;
    }
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: !d.active } : d)),
    );
    addDMAudit(
      id,
      `${item.active ? "Tắt hoạt động" : "Mở lại hoạt động"} hình thức "${item.hinhThuc}"`,
    );
    toast.success(item.active ? "Đã tắt hoạt động" : "Đã mở lại hoạt động");
  }

  function doDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.soGoi > 0) {
      toast.error(
        `Không thể xóa danh mục đang có ${deleteTarget.soGoi} gói thầu.`,
      );
      setDeleteTarget(null);
      return;
    }
    setItems((prev) => {
      const next = prev.filter((d) => d.id !== deleteTarget.id);
      if (selected.id === deleteTarget.id && next.length > 0)
        setSelected(next[0]);
      return next;
    });
    addDMAudit(deleteTarget.id, `Xóa danh mục "${deleteTarget.hinhThuc}"`);
    toast.success(`Đã xóa danh mục "${deleteTarget.hinhThuc}"`);
    setDeleteTarget(null);
  }

  function requestDelete(item: DanhMuc, e: React.MouseEvent) {
    e.stopPropagation();
    if (item.soGoi > 0) {
      toast.error(
        "Không thể xóa hình thức đấu thầu đang được sử dụng bởi các gói thầu.",
      );
      return;
    }
    setDeleteTarget(item);
  }

  function goEditQuyTrinh() {
    const match = getQuyTrinhList().find(
      (qt) => qt.hinhThuc === selItem.hinhThuc,
    );
    if (match) {
      navigate(`/lap-quy-trinh?id=${encodeURIComponent(match.id)}`);
      return;
    }

    const generatedId = `QT-DM-${selItem.id}`;
    const existingGenerated = getQuyTrinhById(generatedId);
    if (!existingGenerated) {
      const buocIds = selItem.steps.map(
        (_, index) => `${generatedId}-B${index + 1}`,
      );
      addQuyTrinh({
        id: generatedId,
        ten: `Quy trình ${selItem.hinhThuc}`,
        hinhThuc: selItem.hinhThuc as HinhThucQT,
        trangThai: "Đang hoạt động",
        ngayTao: new Date().toISOString(),
        buocList: selItem.steps.map((step, index) => ({
          id: buocIds[index],
          ten: step.ten.replace(/^\d+\.\s*/, ""),
          loai: (index === 0
            ? "Bắt đầu"
            : index === selItem.steps.length - 1
              ? "Kết thúc"
              : "Thường") as LoaiBuoc,
          donViPhuTrach: step.donVi,
          vaiTroXuLy: step.donVi,
          slaNgay: parseInt(step.thoiHan.replace(/[^\d]/g, ""), 10) || 1,
          trangThaiMacDinh: (step.state === "done"
            ? "Hoàn tất"
            : step.state === "warn"
              ? "Chờ duyệt"
              : "Đang xử lý") as TrangThaiBuoc,
          dieuKienChuyen: ["Duyệt"],
          buocTiepTheoId: buocIds[index + 1] ?? "",
          moTa: "",
        })),
      });
    }
    navigate(`/lap-quy-trinh?id=${encodeURIComponent(generatedId)}`);
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh mục thực hiện
        </h1>
        <div className="flex items-center gap-3">
          {DM_CAN_ADD && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-plus text-xs" /> Thêm hình thức đấu thầu
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {items.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className={`bg-white rounded-2xl border p-4 text-left transition-all ${
                  selItem.id === d.id
                    ? "border-blue-400 ring-1 ring-blue-300"
                    : "border-slate-200 hover:border-slate-300"
                } ${!d.active ? "opacity-50" : ""}`}
              >
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${d.badge}`}
                >
                  {d.hinhThuc}
                </span>
                <div className="text-2xl font-extrabold text-slate-800">
                  {d.soGoi}
                </div>
                <div className="text-xs text-slate-400">
                  gói thầu · {d.steps.length} bước
                </div>
              </button>
            ))}
          </div>

          {/* SEARCH + TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">
                Danh sách hình thức đấu thầu
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Tìm hình thức, mã..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                  />
                </div>
                <select
                  value={filterActive}
                  onChange={(e) => {
                    setFilterActive(e.target.value as "" | "true" | "false");
                    setPage(1);
                  }}
                  className="border border-slate-200 rounded-lg text-xs px-2 py-1.5 bg-white focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Đã ẩn</option>
                </select>
                {(search || filterActive) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilterActive("");
                      setPage(1);
                    }}
                    className="text-xs text-slate-400 hover:text-red-500"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th
                      className="px-5 py-3 text-left cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => toggleSort("hinhThuc")}
                    >
                      Hình thức <SortIcon field="hinhThuc" />
                    </th>
                    <th
                      className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => toggleSort("steps")}
                    >
                      Số bước <SortIcon field="steps" />
                    </th>
                    <th
                      className="px-5 py-3 text-center cursor-pointer hover:text-slate-600 select-none"
                      onClick={() => toggleSort("soGoi")}
                    >
                      Số gói đang thực hiện <SortIcon field="soGoi" />
                    </th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-slate-400 text-sm"
                      >
                        Không tìm thấy danh mục phù hợp
                      </td>
                    </tr>
                  ) : (
                    paginated.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => setSelected(d)}
                        className={`cursor-pointer transition-colors ${
                          selItem.id === d.id
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.badge} ${!d.active ? "opacity-50" : ""}`}
                          >
                            {d.hinhThuc}
                          </span>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {d.id}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center font-semibold text-slate-700">
                          {d.steps.length}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.soGoi > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}
                          >
                            {d.soGoi} gói
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {d.active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <i className="fa-solid fa-circle-check" /> Đang
                              hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                              <i className="fa-solid fa-eye-slash" /> Đã ẩn
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {DM_CAN_EDIT && (
                              <button
                                title="Chỉnh sửa"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditTarget(d);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <i className="fa-solid fa-pen text-xs" />
                              </button>
                            )}
                            {DM_CAN_TOGGLE && (
                              <button
                                title={
                                  d.active ? "Ẩn danh mục" : "Hiện danh mục"
                                }
                                onClick={(e) => toggleActive(d.id, e)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                                  d.active
                                    ? "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                    : "text-amber-500 hover:text-slate-400 hover:bg-slate-100"
                                }`}
                              >
                                <i
                                  className={`fa-solid ${d.active ? "fa-eye-slash" : "fa-eye"} text-xs`}
                                />
                              </button>
                            )}
                            {DM_CAN_DELETE && (
                              <button
                                title={
                                  d.soGoi > 0
                                    ? `Không thể xóa (${d.soGoi} gói)`
                                    : "Xóa danh mục"
                                }
                                onClick={(e) => requestDelete(d, e)}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${d.soGoi > 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                              >
                                <i className="fa-solid fa-trash text-xs" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-xs text-slate-400">
                  Hiển thị{" "}
                  {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} /{" "}
                  {filtered.length} danh mục
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <i className="fa-solid fa-chevron-left text-xs" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
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

        {/* DETAIL PANEL */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto hidden xl:block">
          {/* Header */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-start justify-between mb-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${selItem.badge}`}
              >
                {selItem.hinhThuc}
              </span>
              {DM_CAN_EDIT && (
                <button
                  title="Sửa hình thức"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(selItem);
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-pen text-[10px]" /> Sửa hình thức
                </button>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {selItem.id}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {selItem.steps.length} bước quy trình
            </div>

            <div className="flex justify-between text-xs text-slate-600 mb-1.5 mt-3">
              <span>Hoàn thành mẫu</span>
              <span>
                {doneCount}/{selItem.steps.length} ({pct}%)
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(["info", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  detailTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab === "info" ? "Thông tin" : "Lịch sử"}
              </button>
            ))}
          </div>

          {detailTab === "info" ? (
            <div className="p-5">
              <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
                CÁC BƯỚC QUY TRÌNH
              </div>
              <div className="space-y-3">
                {selItem.steps.map((s) => (
                  <div key={s.ten} className="flex items-start gap-2.5">
                    <Dot state={s.state} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-800">
                        {s.ten}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {s.donVi}
                        </span>
                        <span className="text-[10px] text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">
                          {s.thoiHan}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {selItem.steps.length === 0 && (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có bước nào.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={goEditQuyTrinh}
                className="mt-5 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors"
              >
                <i className="fa-solid fa-diagram-project text-xs" /> Chỉnh sửa
                quy trình
              </button>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-[11px] font-bold text-slate-400 tracking-wide uppercase mb-3">
                Lịch sử thao tác
              </p>
              {auditLog.filter((a) => a.dmId === selItem.id).length === 0 ? (
                <div className="text-center py-8">
                  <i className="fa-solid fa-clock-rotate-left text-3xl text-slate-200" />
                  <p className="text-xs text-slate-400 mt-2">Chưa có lịch sử</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLog
                    .filter((a) => a.dmId === selItem.id)
                    .map((a) => (
                      <div key={a.id} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="fa-solid fa-clock-rotate-left text-blue-500 text-[10px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 font-medium">
                            {a.hanhDong}
                          </p>
                          <div className="mt-0.5 space-y-0.5 text-[11px] text-slate-400">
                            <p>Thời gian: {a.thoiGian}</p>
                            <p>Người thực hiện: {a.nguoiThucHien}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* MODAL THÊM */}
      {addOpen && (
        <AddModal
          existingItems={items}
          onSave={onAdd}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* MODAL CHỈNH SỬA */}
      {editTarget && (
        <EditModal
          defaultValues={{
            id: editTarget.id,
            hinhThuc: editTarget.hinhThuc,
            badge: editTarget.badge,
          }}
          existingItems={items}
          onSave={onEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {deleteTarget && (
        <DeleteModal
          tenDanhMuc={deleteTarget.hinhThuc}
          onConfirm={doDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
