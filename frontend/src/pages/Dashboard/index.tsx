import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SelectField } from "@/components/ui/select";

/* ─ RBAC ─ */
const MOCK_CURRENT_ROLE = "Admin"; // "Admin" | "Quản lý" | "Nhân viên"
const CAN_CREATE =
  MOCK_CURRENT_ROLE === "Admin" || MOCK_CURRENT_ROLE === "Quản lý";
const CAN_APPROVE =
  MOCK_CURRENT_ROLE === "Admin" || MOCK_CURRENT_ROLE === "Quản lý";

type BadgeStatus = "Đang xử lý" | "Hoàn thành" | "Trễ hạn" | "Chờ duyệt";
type BarColor = "blue" | "green" | "red" | "amber";
type DotState = "done" | "warn" | "idle";
type StepStatus =
  | "Hoàn tất"
  | "Đang xử lý"
  | "Trễ hạn"
  | "Chờ ký duyệt"
  | "Chưa bắt đầu";
type WorkflowStep = {
  state: DotState;
  name: string;
  processor: string;
  status: StepStatus;
  sla: string;
  ngayXuLy?: string;
  nguoiKy?: string;
  ngayKy?: string;
  ketQua?: string;
  reason?: string;
};

type ParallelInfo = {
  title: string;
  condition: string;
  branches: {
    name: string;
    progress: string;
    status: string;
    currentStep: string;
    processor: string;
    steps: {
      name: string;
      state: "done" | "current" | "idle" | "skipped";
    }[];
  }[];
  mergeStatus: string;
  lockedStage: string;
};

const BADGE: Record<BadgeStatus, string> = {
  "Đang xử lý": "bg-blue-100 text-blue-700",
  "Hoàn thành": "bg-emerald-100 text-emerald-700",
  "Trễ hạn": "bg-red-100 text-red-600",
  "Chờ duyệt": "bg-amber-100 text-amber-700",
};
const BAR_COLOR: Record<BarColor, string> = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
};
const DOT_CLS: Record<DotState, string> = {
  done: "bg-emerald-500 text-white",
  warn: "bg-amber-500 text-white",
  idle: "bg-slate-200",
};

type TableRow = {
  code: string;
  name: string;
  unit: string;
  status: BadgeStatus;
  color: BarColor;
  pct: string;
  txt: string;
  nguonVon: string;
  ngayTao: string;
  hanHT: string;
  hinhThuc: string;
  overdueReason?: string;
  currentStep: string;
  currentProcessor: string;
  currentProcessDate: string;
  currentSigner: string;
  currentSignedDate: string;
  currentResult: string;
  progressStatus: "Đúng hạn" | "Sắp quá hạn" | "Quá hạn";
  steps: WorkflowStep[];
  parallelInfo?: ParallelInfo;
};

const TABLE_ROWS: TableRow[] = [
  {
    code: "GT2025-001",
    name: "Mua sắm thiết bị y tế khoa Nội",
    unit: "Khoa Nội",
    status: "Đang xử lý",
    color: "blue",
    pct: "35.7%",
    txt: "5/14",
    nguonVon: "Ngân sách BV",
    ngayTao: "10/01/2025",
    hanHT: "30/04/2025",
    hinhThuc: "Chỉ định thầu rút gọn",
    currentStep: "Tờ trình phê duyệt dự toán",
    currentProcessor: "K/p mua sắm",
    currentProcessDate: "10/04/2025",
    currentSigner: "Chưa cập nhật",
    currentSignedDate: "--",
    currentResult: "Chờ ký duyệt",
    progressStatus: "Đúng hạn",
    steps: [
      {
        state: "done",
        name: "1. Đề xuất mua sắm",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "08/01/2025",
      },
      {
        state: "done",
        name: "2. Tờ trình chủ trương",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "3 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "12/01/2025",
      },
      {
        state: "done",
        name: "3. Đăng tải yêu cầu báo giá",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "1 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "14/01/2025",
      },
      {
        state: "done",
        name: "4. Biên bản kiểm tra báo giá",
        processor: "Tổ kiểm tra giá",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "18/01/2025",
      },
      {
        state: "warn",
        name: "5. Tờ trình phê duyệt dự toán",
        processor: "K/p mua sắm",
        status: "Chờ ký duyệt",
        sla: "2 ngày",
        ngayXuLy: "10/04/2025",
        nguoiKy: "Chưa cập nhật",
        ngayKy: "--",
        ketQua: "Chờ ký duyệt",
      },
      {
        state: "idle",
        name: "6. QĐ phê duyệt dự toán",
        processor: "Giám đốc BV",
        status: "Chưa bắt đầu",
        sla: "1 ngày",
      },
    ],
  },
  {
    code: "GT2025-002",
    name: "Sửa chữa hệ thống điện tầng 3",
    unit: "P.HCQT",
    status: "Hoàn thành",
    color: "green",
    pct: "100%",
    txt: "7/7",
    nguonVon: "Tự chủ tài chính",
    ngayTao: "15/01/2025",
    hanHT: "28/02/2025",
    hinhThuc: "Chỉ định thầu tự quyết định",
    currentStep: "Hoàn tất",
    currentProcessor: "Ban giám đốc",
    currentProcessDate: "28/02/2025",
    currentSigner: "Trần Văn B",
    currentSignedDate: "28/02/2025",
    currentResult: "Hoàn tất",
    progressStatus: "Đúng hạn",
    steps: [
      {
        state: "done",
        name: "1. Đề xuất mua sắm",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "16/01/2025",
      },
      {
        state: "done",
        name: "2. Tờ trình chủ trương",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "3 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "18/01/2025",
      },
      {
        state: "done",
        name: "3. Đăng tải yêu cầu báo giá",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "1 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "20/01/2025",
      },
      {
        state: "done",
        name: "4. Biên bản kiểm tra báo giá",
        processor: "Tổ kiểm tra giá",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "24/01/2025",
      },
      {
        state: "done",
        name: "5. Tờ trình phê duyệt dự toán",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "26/01/2025",
      },
      {
        state: "done",
        name: "6. QĐ phê duyệt dự toán",
        processor: "Giám đốc BV",
        status: "Hoàn tất",
        sla: "1 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "28/01/2025",
      },
      {
        state: "done",
        name: "7. Hoàn tất",
        processor: "Ban giám đốc",
        status: "Hoàn tất",
        sla: "0 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "28/02/2025",
      },
    ],
  },
  {
    code: "GT2025-003",
    name: "Dịch vụ vệ sinh bệnh viện quý 3",
    unit: "P.HCQT",
    status: "Trễ hạn",
    color: "red",
    pct: "21.4%",
    txt: "3/14",
    nguonVon: "Tự chủ tài chính",
    ngayTao: "05/03/2025",
    hanHT: "29/03/2025",
    hinhThuc: "Chào hàng cạnh tranh",
    overdueReason:
      "Chậm tại bước 4. Biên bản kiểm tra báo giá: Tổ kiểm tra giá chưa hoàn tất xử lý hồ sơ báo giá.",
    currentStep: "Biên bản kiểm tra báo giá",
    currentProcessor: "Tổ kiểm tra giá",
    currentProcessDate: "20/03/2025",
    currentSigner: "Chưa cập nhật",
    currentSignedDate: "--",
    currentResult: "Đang xử lý",
    progressStatus: "Quá hạn",
    steps: [
      {
        state: "done",
        name: "1. Đề xuất mua sắm",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "08/03/2025",
      },
      {
        state: "done",
        name: "2. Tờ trình chủ trương",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "3 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "12/03/2025",
      },
      {
        state: "done",
        name: "3. Đăng tải yêu cầu báo giá",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "1 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "15/03/2025",
      },
      {
        state: "warn",
        name: "4. Biên bản kiểm tra báo giá",
        processor: "Tổ kiểm tra giá",
        status: "Đang xử lý",
        sla: "Quá hạn",
        ngayXuLy: "20/03/2025",
        nguoiKy: "Chưa cập nhật",
        ngayKy: "--",
        ketQua: "Đang xử lý",
        reason: "Quá hạn 21 ngày do chưa hoàn tất kiểm tra, đối chiếu báo giá.",
      },
      {
        state: "idle",
        name: "5. Tờ trình phê duyệt dự toán",
        processor: "K/p mua sắm",
        status: "Chờ ký duyệt",
        sla: "2 ngày",
        nguoiKy: "Chưa cập nhật",
        ngayKy: "--",
      },
    ],
  },
  {
    code: "GT2025-004",
    name: "Mua sắm thuốc điều trị ung thư",
    unit: "Khoa Dược",
    status: "Chờ duyệt",
    color: "amber",
    pct: "7.7%",
    txt: "2/26",
    nguonVon: "Ngân sách Nhà nước",
    ngayTao: "20/03/2025",
    hanHT: "30/06/2025",
    hinhThuc: "Đấu thầu rộng rãi",
    currentStep: "Tờ trình chủ trương",
    currentProcessor: "K/p mua sắm",
    currentProcessDate: "25/03/2025",
    currentSigner: "Chưa cập nhật",
    currentSignedDate: "--",
    currentResult: "Chờ ký duyệt",
    progressStatus: "Sắp quá hạn",
    steps: [
      {
        state: "done",
        name: "1. Đề xuất mua sắm",
        processor: "K/p mua sắm",
        status: "Hoàn tất",
        sla: "2 ngày",
        nguoiKy: "Trần Văn B",
        ngayKy: "22/03/2025",
      },
      {
        state: "warn",
        name: "2. Tờ trình chủ trương",
        processor: "K/p mua sắm",
        status: "Chờ ký duyệt",
        sla: "3 ngày",
        ngayXuLy: "25/03/2025",
        nguoiKy: "Chưa cập nhật",
        ngayKy: "--",
        ketQua: "Chờ ký duyệt",
      },
      {
        state: "idle",
        name: "3. Đăng tải yêu cầu báo giá",
        processor: "K/p mua sắm",
        status: "Chưa bắt đầu",
        sla: "1 ngày",
      },
      {
        state: "idle",
        name: "4. Biên bản kiểm tra báo giá",
        processor: "Tổ kiểm tra giá",
        status: "Chưa bắt đầu",
        sla: "2 ngày",
      },
    ],
  },
  {
    code: "GT2025-015",
    name: "Mua sắm thiết bị chẩn đoán hình ảnh",
    unit: "P.HCQT",
    status: "Đang xử lý",
    color: "blue",
    pct: "50%",
    txt: "18/36",
    nguonVon: "Ngân sách BV",
    ngayTao: "05/03/2025",
    hanHT: "20/04/2025",
    hinhThuc: "Chỉ định thầu rút gọn",
    currentStep: "Nhánh II: Tờ trình nội bộ / Nhánh III: Báo giá + Hồ sơ năng lực",
    currentProcessor: "Nguyễn Văn A / Trần Văn B",
    currentProcessDate: "19/03/2025",
    currentSigner: "Chưa cập nhật",
    currentSignedDate: "--",
    currentResult: "Đang xử lý",
    progressStatus: "Đúng hạn",
    parallelInfo: {
      title: "Nhánh song song tư vấn",
      condition:
        "Hai nhánh được thực hiện đồng thời. Sau khi cả hai nhánh hoàn thành hoặc đã bỏ qua, quy trình sẽ tiếp tục sang bước tiếp theo.",
      branches: [
        {
          name: "Nhánh II - Tư vấn lập HSMT",
          progress: "3/7",
          status: "Đang xử lý",
          currentStep: "Tờ trình nội bộ",
          processor: "Nguyễn Văn A",
          steps: [
            { name: "Thư mời quan tâm", state: "done" },
            { name: "Báo giá + Hồ sơ năng lực", state: "done" },
            { name: "Tờ trình nội bộ", state: "current" },
            { name: "Dự thảo hợp đồng", state: "idle" },
            { name: "Quyết định phê duyệt", state: "idle" },
            { name: "Hợp đồng tư vấn", state: "idle" },
            { name: "Đăng tải kết quả LCNT", state: "idle" },
          ],
        },
        {
          name: "Nhánh III - Tư vấn thẩm định HSMT",
          progress: "2/7",
          status: "Đang xử lý",
          currentStep: "Báo giá + Hồ sơ năng lực",
          processor: "Trần Văn B",
          steps: [
            { name: "Thư mời quan tâm", state: "done" },
            { name: "Báo giá + Hồ sơ năng lực", state: "current" },
            { name: "Tờ trình nội bộ", state: "idle" },
            { name: "Dự thảo hợp đồng", state: "idle" },
            { name: "Quyết định phê duyệt", state: "idle" },
            { name: "Hợp đồng tư vấn", state: "idle" },
            { name: "Đăng tải kết quả LCNT", state: "idle" },
          ],
        },
      ],
      mergeStatus:
        "Chưa đủ điều kiện chuyển sang bước tiếp theo vì Nhánh III vẫn đang xử lý",
      lockedStage: "Bước \"Lập Hồ sơ mời thầu\" sẽ được mở sau khi hai nhánh hoàn thành hoặc đã bỏ qua.",
    },
    steps: [
      { state: "done", name: "1. Đề xuất mua sắm", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "2. Tờ trình chủ trương", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "3. Đăng tải yêu cầu báo giá", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "4. Biên bản kiểm tra báo giá", processor: "Tổ kiểm tra giá", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "5. Tờ trình phê duyệt dự toán", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "6. Quyết định phê duyệt dự toán", processor: "Giám đốc BV", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "7. Quyết định thành lập tổ thẩm định", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "8. Tờ trình phê duyệt KHLCNT", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "9. Báo cáo thẩm định KHLCNT", processor: "Tổ thẩm định", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "10. Quyết định phê duyệt KHLCNT", processor: "Giám đốc BV", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "11. Đăng tải KHLCNT", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "done", name: "12. Quyết định thành lập Tổ chuyên gia & Tổ thẩm định", processor: "K/P mua sắm", status: "Hoàn tất", sla: "Hoàn thành" },
      { state: "idle", name: "Lập Hồ sơ mời thầu", processor: "K/P mua sắm", status: "Chưa bắt đầu", sla: "Đang khóa" },
      { state: "idle", name: "Chủ đầu tư góp ý Hồ sơ mời thầu", processor: "Chủ đầu tư", status: "Chưa bắt đầu", sla: "Đang khóa" },
      { state: "idle", name: "Tờ trình phê duyệt Hồ sơ mời thầu", processor: "K/P mua sắm", status: "Chưa bắt đầu", sla: "Đang khóa" },
      { state: "idle", name: "Báo cáo thẩm định Hồ sơ mời thầu", processor: "Tổ thẩm định", status: "Chưa bắt đầu", sla: "Đang khóa" },
      { state: "idle", name: "Quyết định phê duyệt Hồ sơ mời thầu", processor: "Giám đốc BV", status: "Chưa bắt đầu", sla: "Đang khóa" },
      { state: "idle", name: "Đăng tải Hồ sơ mời thầu", processor: "K/P mua sắm", status: "Chưa bắt đầu", sla: "Đang khóa" },
    ],
  },
];

const NOTIFICATIONS = [
  {
    id: 1,
    icon: "fa-triangle-exclamation",
    color: "text-red-500 bg-red-50",
    title: "GT2025-003 trễ hạn 21 ngày",
    time: "Vừa xong",
    read: false,
  },
  {
    id: 2,
    icon: "fa-circle-check",
    color: "text-emerald-500 bg-emerald-50",
    title: "GT2025-002 đã hoàn thành",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: 3,
    icon: "fa-file-lines",
    color: "text-blue-500 bg-blue-50",
    title: "GT2025-001 cần duyệt tờ trình",
    time: "5 giờ trước",
    read: true,
  },
  {
    id: 4,
    icon: "fa-bell",
    color: "text-amber-500 bg-amber-50",
    title: "GT2025-004 đang chờ phê duyệt",
    time: "Hôm qua",
    read: true,
  },
  {
    id: 5,
    icon: "fa-circle-info",
    color: "text-slate-500 bg-slate-100",
    title: "Hệ thống cập nhật v1.2.0",
    time: "2 ngày trước",
    read: true,
  },
];

const APPROVAL_ITEMS = [
  {
    code: "GT2025-001",
    color: "blue",
    icon: "fa-regular fa-file-lines",
    title: "Tờ trình phê duyệt dự toán",
    handler: "Giám đốc BV",
    unit: "Ban Giám đốc",
    sla: "Tình trạng tiến độ: Đúng hạn",
    status: "Chờ duyệt" as BadgeStatus,
    overdue: false,
  },
  {
    code: "GT2025-003",
    color: "orange",
    icon: "fa-solid fa-triangle-exclamation",
    title: "Biên bản kiểm tra báo giá",
    handler: "Tổ kiểm tra giá",
    unit: "Tổ kiểm tra giá",
    sla: "Tình trạng tiến độ: Quá hạn",
    status: "Trễ hạn" as BadgeStatus,
    overdue: true,
  },
  {
    code: "GT2025-004",
    color: "blue",
    icon: "fa-regular fa-file-lines",
    title: "Tờ trình chủ trương",
    handler: "Giám đốc BV",
    unit: "Ban Giám đốc",
    sla: "Tình trạng tiến độ: Sắp quá hạn",
    status: "Chờ duyệt" as BadgeStatus,
    overdue: false,
  },
];

function Badge({ label }: { label: BadgeStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[label] ?? "bg-slate-100 text-slate-600"}`}
    >
      {label}
    </span>
  );
}

function ProgBar({ color, pct }: { color: BarColor; pct: string }) {
  return (
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${BAR_COLOR[color]}`}
        style={{ width: pct }}
      />
    </div>
  );
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const idx = TABLE_ROWS.findIndex((row) => row.code === "GT2025-015");
    return idx >= 0 ? idx : 2;
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<BadgeStatus | "">("");
  const notifRef = useRef<HTMLDivElement>(null);

  const selected = TABLE_ROWS[selectedIdx];
  const unreadCount = notifs.filter((n) => !n.read).length;

  const filteredRows = TABLE_ROWS.filter((r) => {
    const matchSearch =
      !search ||
      r.code.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.unit.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  /* Close notification dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <i className="fa-solid fa-bell" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-[200] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    Thông báo
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() =>
                        setNotifs((prev) =>
                          prev.map((x) =>
                            x.id === n.id ? { ...x, read: true } : x,
                          ),
                        )
                      }
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm ${n.color}`}
                      >
                        <i className={`fa-solid ${n.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}
                        >
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {n.time}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {CAN_CREATE && (
            <button
              onClick={() => navigate("/tao-goi-thau")}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-plus text-xs" /> Tạo gói thầu
            </button>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* KPI */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              [
                "fa-box-archive",
                "gray",
                "TỔNG GÓI THẦU",
                "24",
                "năm 2025",
                "text-slate-800",
                "",
              ],
              [
                "fa-hourglass-half",
                "blue",
                "ĐANG XỬ LÝ",
                "8",
                "gói",
                "text-blue-600",
                "Đang xử lý",
              ],
              [
                "fa-triangle-exclamation",
                "red",
                "TRỄ HẠN",
                "3",
                "cần xử lý gấp",
                "text-red-500",
                "Trễ hạn",
              ],
              [
                "fa-circle-check",
                "green",
                "HOÀN THÀNH",
                "13",
                "gói",
                "text-emerald-600",
                "Hoàn thành",
              ],
            ].map(([icon, color, lbl, val, sub, valCls, targetStatus]) => (
              <button
                key={lbl}
                type="button"
                onClick={() => {
                  const status = targetStatus as BadgeStatus | "";
                  setFilterStatus(status);
                  setSearch("");
                  const firstMatch = status
                    ? TABLE_ROWS.findIndex((row) => row.status === status)
                    : 0;
                  if (firstMatch >= 0) setSelectedIdx(firstMatch);
                }}
                className={`bg-white rounded-2xl border p-4 flex items-center gap-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  filterStatus === targetStatus
                    ? "border-blue-400 ring-1 ring-blue-200"
                    : "border-slate-200"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg ${color === "gray" ? "bg-slate-100 text-slate-500" : color === "blue" ? "bg-blue-100 text-blue-600" : color === "red" ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-600"}`}
                >
                  <i className={`fa-solid ${icon}`} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wide">
                    {lbl}
                  </div>
                  <div className={`text-2xl font-extrabold ${valCls}`}>
                    {val}
                  </div>
                  <div className="text-xs text-slate-400">{sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">
                Gói thầu cần chú ý
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo mã, tên, đơn vị..."
                    className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-52"
                  />
                </div>
                <SelectField
                  value={filterStatus || "__all"}
                  onValueChange={(value) =>
                    setFilterStatus(value === "__all" ? "" : (value as BadgeStatus))
                  }
                  options={[
                    { value: "__all", label: "Tất cả trạng thái" },
                    { value: "Đang xử lý", label: "Đang xử lý" },
                    { value: "Hoàn thành", label: "Hoàn thành" },
                    { value: "Trễ hạn", label: "Trễ hạn" },
                    { value: "Chờ duyệt", label: "Chờ duyệt" },
                  ]}
                  triggerClassName="h-8 min-w-[150px] rounded-lg bg-white px-2 text-xs"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Mã gói</th>
                    <th className="px-5 py-3 text-left">Tên gói thầu</th>
                    <th className="px-5 py-3 text-left">Đơn vị</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-left w-40">Tiến độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-slate-400 text-sm"
                      >
                        Không tìm thấy gói thầu phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const idx = TABLE_ROWS.indexOf(row);
                      return (
                        <tr
                          key={row.code}
                          onClick={() => setSelectedIdx(idx)}
                          className={`cursor-pointer transition-colors ${row.status === "Trễ hạn" ? "bg-red-50/40" : ""} ${selectedIdx === idx ? "bg-blue-50" : "hover:bg-slate-50"}`}
                        >
                          <td className="px-5 py-3 font-mono text-xs text-blue-700 font-bold">
                            {row.code}
                          </td>
                          <td className="px-5 py-3 text-slate-800">
                            {row.name}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {row.unit}
                          </td>
                          <td className="px-5 py-3">
                            <Badge label={row.status} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <ProgBar color={row.color} pct={row.pct} />
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">
                              {row.txt}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* APPROVAL — only visible to Admin/Quản lý */}
          {CAN_APPROVE && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <span className="font-semibold text-slate-800 text-sm">
                  Bước cần phê duyệt hôm nay
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {APPROVAL_ITEMS.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      const idx = TABLE_ROWS.findIndex(
                        (row) => row.code === item.code,
                      );
                      if (idx >= 0) setSelectedIdx(idx);
                    }}
                    className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                      item.overdue ? "bg-red-50/30" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        item.color === "blue"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-orange-100 text-orange-500"
                      }`}
                    >
                      <i className={item.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800">
                        {item.title} – {item.code}
                      </div>
                      <div className="mt-1 grid gap-0.5 text-xs">
                        <div className="flex gap-1.5 text-slate-600">
                          <span className="text-slate-400">Người xử lý:</span>
                          <span className="font-medium">{item.handler}</span>
                        </div>
                        <div className="flex gap-1.5 text-slate-600">
                          <span className="text-slate-400">Đơn vị:</span>
                          <span className="font-medium">{item.unit}</span>
                        </div>
                        <div
                          className={`font-semibold ${
                            item.overdue ? "text-red-500" : "text-blue-600"
                          }`}
                        >
                          {item.sla}
                        </div>
                      </div>
                    </div>
                    <Badge label={item.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* DETAIL PANEL — dynamic based on selected row */}
        <aside className="w-[288px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <div className="font-mono text-xs font-bold text-blue-700 mb-1">
            {selected.code}
          </div>
          <div className="text-sm font-bold text-slate-900 mb-0.5">
            {selected.name}
          </div>
          <div className="text-xs text-slate-400 mb-3">{selected.unit}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {selected.hinhThuc}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[selected.status]}`}
            >
              {selected.status}
            </span>
          </div>
          {selected.overdueReason && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <div className="mb-1 flex items-center gap-1.5 font-semibold">
                <i className="fa-solid fa-circle-exclamation text-[10px]" />
                Lý do trễ hạn
              </div>
              <p className="leading-relaxed">{selected.overdueReason}</p>
            </div>
          )}

          {/* Progress */}
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Tiến độ quy trình</span>
            <span>
              {selected.txt} bước ({selected.pct})
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full ${BAR_COLOR[selected.color]}`}
              style={{ width: selected.pct }}
            />
          </div>

          {/* Meta */}
          <div className="space-y-2 mb-5">
            {(
              [
                ["Bước hiện tại", selected.currentStep, ""],
                ["Nguồn vốn", selected.nguonVon, ""],
                ["Ngày tạo", selected.ngayTao, ""],
                [
                  "Hạn hoàn thành",
                  selected.hanHT,
                  selected.status === "Trễ hạn" ? "text-red-500" : "",
                ],
              ] as [string, string, string][]
            ).map(([lbl, val, cls]) => (
              <div key={lbl} className="flex justify-between text-xs">
                <span className="text-slate-400">{lbl}</span>
                <span className={`font-semibold text-slate-800 ${cls}`}>
                  {val}
                </span>
              </div>
            ))}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 space-y-2">
              {[
                ["Người xử lý", selected.currentProcessor],
                ["Ngày xử lý", selected.currentProcessDate],
                ["Người ký", selected.currentSigner],
                ["Ngày ký", selected.currentSignedDate],
                ["Kết quả", selected.currentResult],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between gap-3 text-xs">
                  <span className="text-slate-400">{lbl}</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {val}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress status indicator */}
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-400">Tình trạng tiến độ</span>
              {selected.progressStatus === "Quá hạn" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold text-[11px]">
                  <i className="fa-solid fa-circle-exclamation text-[10px]" />{" "}
                  Quá hạn
                </span>
              ) : selected.progressStatus === "Đúng hạn" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-semibold text-[11px]">
                  <i className="fa-solid fa-circle-check text-[10px]" />{" "}
                  {selected.progressStatus}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-[11px]">
                  <i className="fa-solid fa-clock text-[10px]" />{" "}
                  {selected.progressStatus}
                </span>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
            CÁC BƯỚC QUY TRÌNH
          </div>
          <div className="space-y-3 mb-5">
            {selected.steps.map((step) => (
              <div key={step.name}>
                <div className="flex items-start gap-2.5 rounded-lg p-1.5 -m-1.5">
                  <Dot state={step.state} />
                  <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-800">
                    {step.name}
                  </div>
                  <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                    <div className="flex justify-between gap-2">
                      <span>Người xử lý</span>
                      <span className="font-medium text-slate-700 text-right">
                        {step.processor}
                      </span>
                    </div>
                    {step.nguoiKy && (
                      <div className="flex justify-between gap-2">
                        <span>Người ký</span>
                        <span className="font-medium text-slate-700 text-right">
                          {step.nguoiKy}
                        </span>
                      </div>
                    )}
                    {step.ngayKy && (
                      <div className="flex justify-between gap-2">
                        <span>Ngày ký</span>
                        <span className="font-medium text-slate-700 text-right">
                          {step.ngayKy}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span>Trạng thái</span>
                      <span
                        className={`font-semibold text-right ${
                          step.status === "Trễ hạn"
                            ? "text-red-600"
                            : step.status === "Hoàn tất"
                              ? "text-emerald-600"
                              : step.status === "Chờ ký duyệt"
                                ? "text-amber-600"
                                : "text-slate-600"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>Tình trạng tiến độ</span>
                      <span className="font-medium text-slate-700 text-right">
                        {step.sla}
                      </span>
                    </div>
                    {step.reason && (
                      <div className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-red-600">
                        {step.reason}
                      </div>
                    )}
                  </div>
                </div>
                </div>
                {selected.parallelInfo && step.name.includes("Tổ chuyên gia") && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs">
                    <div className="mb-2 flex items-center gap-2 font-bold text-blue-700">
                      <i className="fa-solid fa-code-branch text-[11px]" />
                      NHÁNH SONG SONG
                    </div>
                    <p className="mb-3 leading-relaxed text-slate-600">
                      {selected.parallelInfo.condition}
                    </p>
                    <div className="space-y-2">
                      {selected.parallelInfo.branches.map((branch) => (
                        <div key={branch.name} className="rounded-lg border border-white bg-white/80 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{branch.name}</span>
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{branch.progress} bước</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            Bước hiện tại: <span className="font-semibold text-slate-700">{branch.currentStep}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Người xử lý: <span className="font-semibold text-slate-700">{branch.processor}</span>
                          </div>
                          <div className="mt-1 text-[11px] font-semibold text-amber-700">{branch.status}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-lg bg-amber-50 px-2 py-2 text-[11px] font-semibold text-amber-700">
                      {selected.parallelInfo.mergeStatus}
                    </div>
                    <div className="mt-2 rounded-lg bg-slate-100 px-2 py-2 text-[11px] font-semibold text-slate-600">
                      {selected.parallelInfo.lockedStage}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate("/danh-sach-goi-thau")}
            className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2.5 transition-colors"
          >
            <i className="fa-solid fa-arrow-right text-xs" /> Xem chi tiết
          </button>
        </aside>
      </div>
    </>
  );
}
