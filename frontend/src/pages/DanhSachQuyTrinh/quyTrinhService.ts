/* ─────────────────────────────────────────────────────────────────────────────
   Mock store cho Quy Trình (Workflow) — lưu trữ dữ liệu bằng localStorage
   Dùng chung cho trang Lập quy trình và Danh sách quy trình
───────────────────────────────────────────────────────────────────────────── */

export type LoaiBuoc =
  | "Bắt đầu"
  | "Thường"
  | "Ký duyệt"
  | "Đăng tải"
  | "Đánh giá/kiểm tra"
  | "Hợp đồng"
  | "Kết thúc";
export type TrangThaiBuoc =
  | "Chưa bắt đầu"
  | "Đang xử lý"
  | "Chờ ký duyệt"
  | "Hoàn thành";
export type DieuKienChuyen =
  | "Duyệt"
  | "Từ chối"
  | "Yêu cầu kiểm tra"
  | "Trả về";
export type LoaiThoiHan =
  | "Chỉ cảnh báo quá hạn"
  | "Bắt buộc hoàn thành trước hạn";
export type HanhDongChuyen =
  | "Hoàn thành / Duyệt"
  | "Không duyệt"
  | "Trả về"
  | "Yêu cầu bổ sung"
  | "Bỏ qua bước";
export type DieuKienKichHoat = "Luôn" | "Theo vai trò" | "Theo kết quả xử lý";
export type TrangThaiQT = "Đang hoạt động" | "Đã tắt";

export type DieuKienChuyenTiep = {
  id: string;
  hanhDong: HanhDongChuyen;
  buocChuyenDenId: string;
  dieuKienKichHoat: DieuKienKichHoat;
  ketQuaApDung?: string;
  vaiTroApDung?: string;
  batBuocGhiChu: boolean;
  batBuocUpload: boolean;
};

export type NhanhSongSong = {
  id: string;
  tenNhanh: string;
  donVi: string;
  vaiTro: string;
  thoiHanNgay: number;
  loaiThoiHan: LoaiThoiHan;
  buocDauTienId: string;
};

export const HINH_THUC_OPTIONS = [
  "Chỉ định thầu tự quyết định LCNT",
  "Chỉ định thầu rút gọn",
  "Chỉ định thầu thông thường",
  "Chào hàng cạnh tranh",
  "Đấu thầu rộng rãi",
  "Mua sắm trực tiếp",
  "Chào giá trực tuyến thông thường",
  "Chào giá trực tuyến rút gọn",
  "Mua sắm trực tuyến",
  "Đặt hàng",
] as const;

export type HinhThucQT = (typeof HINH_THUC_OPTIONS)[number];

export type QuyTrinhTemplateInfo = {
  soBuoc: number | string;
  apDung: string[];
  khongApDung?: string[];
  moTa: string;
  ghiChu?: string;
  steps: string[];
};

export const QUY_TRINH_TEMPLATE_INFO: Record<HinhThucQT, QuyTrinhTemplateInfo> = {
  "Chỉ định thầu tự quyết định LCNT": {
    soBuoc: 7,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho gói thầu hoặc nội dung mua sắm có giá trị không quá 50 triệu đồng. Hệ thống sẽ tự động sinh danh sách 7 bước theo quy trình chuẩn.",
    steps: [
      "Đề xuất mua sắm/sửa chữa",
      "Tờ trình chủ trương thực hiện gói thầu",
      "Đăng tải yêu cầu báo giá",
      "Biên bản kiểm tra báo giá",
      "Tờ trình LCNT",
      "Dự thảo Hợp đồng",
      "Hợp đồng",
    ],
  },
  "Chỉ định thầu rút gọn": {
    soBuoc: 14,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho các gói thầu đủ điều kiện chỉ định thầu rút gọn theo quy định. Hệ thống sẽ tự động sinh danh sách 14 bước theo quy trình chuẩn.",
    steps: [
      "Đề xuất mua sắm/sửa chữa",
      "Tờ trình chủ trương thực hiện gói thầu",
      "Đăng tải yêu cầu báo giá",
      "Biên bản kiểm tra báo giá",
      "Tờ trình phê duyệt dự toán gói thầu",
      "Quyết định phê duyệt dự toán gói thầu",
      "Tờ trình phê duyệt kế hoạch LCNT",
      "Quyết định phê duyệt kế hoạch LCNT",
      "Đăng tải kế hoạch LCNT",
      "Dự thảo Hợp đồng",
      "Quyết định phê duyệt kết quả LCNT",
      "Đăng tải kết quả LCNT của gói thầu",
      "Hợp đồng thực hiện gói thầu",
      "Quản lý hợp đồng",
    ],
  },
  "Chỉ định thầu thông thường": {
    soBuoc: 26,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng đối với gói thầu thuộc các trường hợp quy định. Hệ thống sẽ tự động sinh danh sách 26 bước theo quy trình chuẩn.",
    steps: [
      "Đề xuất mua sắm/sửa chữa",
      "Tờ trình chủ trương thực hiện gói thầu",
      "Đăng tải yêu cầu báo giá",
      "Biên bản kiểm tra các báo giá",
      "Tờ trình phê duyệt dự toán gói thầu",
      "Quyết định phê duyệt dự toán gói thầu",
      "Tờ trình phê duyệt kế hoạch LCNT",
      "Quyết định phê duyệt kế hoạch LCNT",
      "Đăng tải kế hoạch LCNT",
      "Quyết định thành lập tổ chuyên gia",
      "Lập hồ sơ yêu cầu",
      "Chủ đầu tư góp ý hồ sơ yêu cầu",
      "Tờ trình phê duyệt hồ sơ yêu cầu",
      "Quyết định thành lập tổ thẩm định",
      "Báo cáo thẩm định hồ sơ yêu cầu",
      "Quyết định phê duyệt hồ sơ yêu cầu",
      "Hồ sơ yêu cầu được phát hành cho các nhà thầu",
      "Nhà thầu chuẩn bị và nộp hồ sơ đề xuất",
      "Báo cáo đánh giá hồ sơ đề xuất",
      "Dự thảo hợp đồng",
      "Tờ trình phê duyệt kết quả LCNT",
      "Báo cáo thẩm định kết quả LCNT",
      "Quyết định phê duyệt kết quả LCNT",
      "Hợp đồng thực hiện gói thầu",
      "Đăng tải kết quả LCNT của gói thầu",
      "Quản lý hợp đồng",
    ],
  },
  "Chào hàng cạnh tranh": {
    soBuoc: 34,
    apDung: ["Hàng hóa", "Dịch vụ phi tư vấn", "Xây lắp"],
    khongApDung: ["Dịch vụ tư vấn"],
    moTa: "Áp dụng cho các gói thầu quy định của Luật Đấu Thầu và có giá gói thầu không quá 10 tỷ đồng. Hệ thống tự sinh các nhóm bước theo quy trình chuẩn, Admin chỉ cần chỉnh sửa nếu có yêu cầu đặc thù.",
    steps: [
  "Đề xuất mua sắm/sửa chữa",
  "Tờ trình chủ trương thực hiện gói thầu",
  "Đăng tải yêu cầu báo giá",
  "Biên bản kiểm tra các báo giá",
  "Tờ trình phê duyệt dự toán gói thầu",
  "Quyết định phê duyệt dự toán gói thầu",
  "Tờ trình phê duyệt kế hoạch LCNT",
  "Quyết định phê duyệt kế hoạch LCNT",
  "Đăng tải kế hoạch LCNT",
  "Quyết định thành lập tổ chuyên gia",
  "Thư mời quan tâm và nộp hồ sơ năng lực",
  "Báo giá và hồ sơ năng lực của đơn vị tư vấn LCNT",
  "Tờ trình nội bộ",
  "Dự thảo hợp đồng",
  "Quyết định phê duyệt kết quả LCNT",
  "Hợp đồng tư vấn LCNT",
  "Đăng tải kết quả LCNT gói thầu tư vấn LCNT",
  "Quyết định thành lập tổ chuyên gia tư vấn LCNT",
  "Lập Hồ sơ mời thầu",
  "Chủ đầu tư góp ý Hồ sơ mời thầu",
  "Tờ trình phê duyệt Hồ sơ mời thầu",
  "Quyết định phê duyệt Hồ sơ mời thầu",
  "Phát hành Hồ sơ mời thầu trên hệ thống mạng đấu thầu quốc gia",
  "Mở thầu Online",
  "Làm rõ hồ sơ dự thầu",
  "Báo cáo đánh giá hồ sơ dự thầu",
  "Dự thảo hợp đồng",
  "Tờ trình phê duyệt kết quả LCNT",
  "Quyết định phê duyệt kết quả LCNT",
  "Văn bản thông báo kết quả LCNT đến các nhà thầu tham dự thầu",
  "Đăng tải kết quả LCNT",
  "Thư mời hoàn thiện hợp đồng",
  "Hợp đồng giữa Chủ đầu tư và Nhà thầu",
  "Biên bản nghiệm thu sản phẩm theo hợp đồng"
    ],
  },
  "Đấu thầu rộng rãi": {
    soBuoc: 42,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho gói thầu được quy định. Hệ thống sẽ tự động sinh quy trình chuẩn với các bước từ lập dự toán đến ký kết hợp đồng.",
    steps: [
    "Đề xuất mua sắm/sửa chữa",
    "Tờ trình chủ trương thực hiện gói thầu",
    "Đăng tải yêu cầu báo giá",
    "Biên bản kiểm tra các báo giá",
    "Tờ trình phê duyệt dự toán gói thầu",
    "QĐ phê duyệt dự toán gói thầu",
    "QĐ thành lập tổ thẩm định kế hoạch LCNT",
    "Tờ trình phê duyệt kế hoạch LCNT",
    "Báo cáo thẩm định kế hoạch LCNT",
    "QĐ phê duyệt kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Quyết định thành lập tổ chuyên gia và tổ thẩm định",
    "Thư mời quan tâm và nộp hồ sơ năng lực",
    "Báo giá và hồ sơ năng lực của đơn vị tư vấn LCNT",
    "Tờ trình nội bộ",
    "Dự thảo hợp đồng",
    "Quyết định phê duyệt kết quả LCNT",
    "Hợp đồng tư vấn thẩm định",
    "Đăng tải kết quả LCNT gói thầu tư vấn thẩm định kết quả LCNT",
    "QĐ thành lập tổ chuyên gia tư vấn thẩm định",
    "Lập E-HSMT",
    "Chủ đầu tư góp ý E-HSMT",
    "Tờ trình phê duyệt E-HSMT",
    "Báo cáo thẩm định E-HSMT",
    "Quyết định phê duyệt E-HSMT",
    "Phát hành E-HSMT",
    "Mở thầu Online",
    "Làm rõ E-HSDT",
    "Báo cáo đánh giá E-HSDT",
    "Dự thảo hợp đồng",
    "Tờ trình phê duyệt kết quả LCNT",
    "Báo cáo thẩm định kết quả LCNT",
    "QĐ phê duyệt kết quả LCNT",
    "Văn bản thông báo kết quả LCNT đến các nhà thầu tham dự thầu",
    "Đăng tải kết quả LCNT",
    "Thư mời hoàn thiện hợp đồng",
    "Hợp đồng giữa CĐT và Nhà thầu",
    "Biên bản nghiệm thu sản phẩm theo hợp đồng",
    "Biên bản thanh lý hợp đồng",
    "Phụ lục 8a",
    "Biên bản quyết toán hợp đồng",
    "Quản lý hợp đồng"
    ],
  },
  "Mua sắm trực tiếp": {
    soBuoc: 38,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho các gói thầu theo quy định. Hệ thống sẽ tự động sinh quy trình ngắn gọn phù hợp.",
    steps: [
      "Hợp đồng với đơn vị đã trúng thầu trước đó",
    "Tờ trình chủ trương thực hiện gói thầu",
    "Biên bản khảo sát và tính toán khối lượng thực hiện",
    "Biên bản họp Tổ kiểm tra giá",
    "Văn bản đồng ý phê duyệt của Ban giám đốc",
    "Tờ trình phê duyệt dự toán gói thầu",
    "QĐ phê duyệt dự toán gói thầu",
    "Tờ trình phê duyệt kế hoạch LCNT",
    "QĐ phê duyệt kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Quyết định thành lập tổ chuyên gia",
    "Thư mời quan tâm và nộp hồ sơ năng lực",
    "Báo giá và hồ sơ năng lực của đơn vị tư vấn LCNT",
    "Tờ trình nội bộ",
    "Dự thảo hợp đồng",
    "Quyết định phê duyệt kết quả LCNT",
    "Hợp đồng tư vấn LCNT",
    "Đăng tải kết quả LCNT gói thầu tư vấn LCNT",
    "QĐ thành lập tổ chuyên gia tư vấn LCNT",
    "Lập hồ sơ yêu cầu",
    "Chủ đầu tư góp ý hồ sơ yêu cầu",
    "Tờ trình phê duyệt hồ sơ yêu cầu",
    "Quyết định phê duyệt hồ sơ yêu cầu",
    "Hồ sơ yêu cầu được phát hành cho các nhà thầu",
    "Mở hồ sơ đề xuất",
    "Báo cáo đánh giá hồ sơ đề xuất",
    "Dự thảo hợp đồng",
    "Tờ trình phê duyệt kết quả LCNT",
    "QĐ phê duyệt kết quả LCNT",
    "Văn bản thông báo kết quả LCNT",
    "Đăng tải kết quả LCNT",
    "Thư mời hoàn thiện hợp đồng",
    "Hợp đồng giữa CĐT và Nhà thầu",
    "Biên bản nghiệm thu sản phẩm theo hợp đồng",
    "Biên bản thanh lý hợp đồng",
    "Phụ lục 8a",
    "Biên bản quyết toán hợp đồng",
    "Quản lý hợp đồng"
    ],
  },
  "Chào giá trực tuyến thông thường": {
    soBuoc: 53,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho chào giá trực tuyến thông thường. Hệ thống sẽ tự sinh quy trình gồm các bước thông báo, tiếp nhận và phê duyệt kết quả.",
    steps: [
       "Đề xuất mua sắm/sửa chữa",
    "Tờ trình chủ trương thực hiện gói thầu",
    "Đăng tải yêu cầu báo giá",
    "Biên bản kiểm tra các báo giá",
    "Tờ trình phê duyệt dự toán gói thầu",
    "QĐ phê duyệt dự toán gói thầu",
    "QĐ thành lập tổ thẩm định kế hoạch LCNT",
    "Tờ trình phê duyệt kế hoạch LCNT",
    "Báo cáo thẩm định kế hoạch LCNT",
    "QĐ phê duyệt kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Quyết định thành lập tổ chuyên gia và tổ thẩm định",

    "Thư mời quan tâm và nộp hồ sơ năng lực",
    "Báo giá và hồ sơ năng lực của đơn vị tư vấn LCNT",
    "Tờ trình nội bộ",
    "Dự thảo hợp đồng",
    "Quyết định phê duyệt kết quả LCNT",
    "Hợp đồng tư vấn LCNT",
    "Đăng tải kết quả LCNT gói thầu tư vấn LCNT",
    "QĐ thành lập tổ chuyên gia tư vấn LCNT",

    "Thư mời quan tâm và nộp hồ sơ năng lực",
    "Báo giá và hồ sơ năng lực của đơn vị tư vấn LCNT",
    "Tờ trình nội bộ",
    "Dự thảo hợp đồng",
    "Quyết định phê duyệt kết quả LCNT",
    "Hợp đồng tư vấn thẩm định",
    "Đăng tải kết quả LCNT gói thầu tư vấn thẩm định kết quả LCNT",
    "QĐ thành lập tổ chuyên gia tư vấn thẩm định",

    "Lập E-HSMT",
    "Chủ đầu tư góp ý E-HSMT",
    "Tờ trình phê duyệt E-HSMT",
    "Báo cáo thẩm định E-HSMT",
    "Quyết định phê duyệt E-HSMT",
    "Phát hành E-HSMT",
    "Mở thầu Online",
    "Làm rõ E-HSDT",
    "Báo cáo đánh giá E-HSDT về yêu cầu kỹ thuật",
    "Thông báo mời tham gia chào giá trực tuyến",
    "Tham gia chào giá trực tuyến",
    "Báo cáo kết quả chào giá",
    "Dự thảo hợp đồng",
    "Tờ trình phê duyệt kết quả LCNT",
    "Báo cáo thẩm định kết quả LCNT",
    "QĐ phê duyệt kết quả LCNT",
    "Văn bản thông báo kết quả LCNT đến các nhà thầu tham dự thầu",
    "Đăng tải kết quả LCNT",
    "Thư mời hoàn thiện hợp đồng",
    "Hợp đồng giữa CĐT và Nhà thầu",

    "Biên bản nghiệm thu sản phẩm theo hợp đồng",
    "Biên bản thanh lý hợp đồng",
    "Phụ lục 8a",
    "Biên bản quyết toán hợp đồng",
    "Quản lý hợp đồng"
    ],
  },
  "Chào giá trực tuyến rút gọn": {
    soBuoc: 22,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho chào giá trực tuyến rút gọn. Hệ thống sẽ tự động tạo quy trình ngắn gọn khi điều kiện cho phép.",
    steps: [
    "Đề xuất mua sắm/sửa chữa",
    "Tờ trình chủ trương thực hiện gói thầu",
    "Lấy giá kế hoạch",
    "Biên bản kiểm tra các báo giá",
    "Tờ trình phê duyệt dự toán gói thầu",
    "QĐ phê duyệt dự toán gói thầu",
    "Tờ trình phê duyệt kế hoạch LCNT",
    "QĐ phê duyệt kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Lập thông báo mời thầu",
    "QĐ phê duyệt thông báo mời thầu",
    "Đăng tải thông báo mời thầu",
    "Tham gia chào giá trực tuyến",
    "Báo cáo kết quả chào giá",
    "Chấp thuận trao hợp đồng",
    "Tờ trình phê duyệt kết quả LCNT",
    "QĐ phê duyệt kết quả LCNT",
    "Văn bản thông báo kết quả LCNT đến các nhà thầu tham dự thầu",
    "Đăng tải kết quả LCNT",
    "Thư mời hoàn thiện hợp đồng",
    "Hợp đồng giữa CĐT và Nhà thầu",
    "Quản lý hợp đồng"
    ],
  },
  "Mua sắm trực tuyến": {
    soBuoc: 14,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho mua sắm trực tuyến. Hệ thống sẽ tự sinh quy trình gồm các bước lựa chọn hàng hoá và duyệt đơn hàng.",
    steps: [
    "Đề xuất mua sắm hàng hóa, dịch vụ",
    "Tờ trình chủ trương thực hiện gói thầu",
    "Tờ trình phê duyệt dự toán gói thầu",
    "QĐ phê duyệt dự toán gói thầu",
    "Tờ trình phê duyệt kế hoạch LCNT",
    "QĐ phê duyệt kế hoạch LCNT",
    "Đăng tải kế hoạch LCNT",
    "Đặt mua hàng hóa, dịch vụ",
    "Hệ thống mạng đấu thầu quốc gia thông báo cho nhà thầu xác nhận đơn hàng",
    "Hệ thống mạng đấu thầu quốc gia thông báo xác nhận đơn hàng",
    "Công khai kết quả mua sắm trực tuyến",
    "Dự thảo hợp đồng",
    "Hợp đồng thực hiện gói thầu",
    "Quản lý hợp đồng"
    ],
  },
  "Đặt hàng": {
    soBuoc: 15,
    apDung: ["Hàng hóa", "Dịch vụ tư vấn", "Dịch vụ phi tư vấn", "Xây lắp"],
    moTa: "Áp dụng cho đặt hàng. Hệ thống sẽ tự động sinh quy trình đơn giản để tạo và theo dõi đơn hàng.",
    steps: [
    "Đề xuất phương án đặt hàng",
    "Tờ trình chủ trương thực hiện phương án đặt hàng",
    "QĐ thành lập tổ chuyên gia",
    "Lập phương án đặt hàng",
    "Tờ trình phê duyệt phương án đặt hàng",
    "Quyết định phê duyệt phương án đặt hàng",
    "Gửi phương án đặt hàng cho nhà cung cấp",
    "Nhà cung cấp gửi hồ sơ năng lực và giá đề xuất",
    "Đánh giá hồ sơ năng lực",
    "Báo cáo đánh giá hồ sơ năng lực",
    "Thương thảo hợp đồng về giá đặt hàng",
    "Phê duyệt quyết định đặt hàng",
    "Hợp đồng thực hiện gói thầu",
    "Công khai thông tin kết quả đặt hàng",
    "Quản lý hợp đồng"
    ],
  },
};

export type Buoc = {
  id: string;
  /** Tên bước thực hiện */
  ten: string;
  /** Loại bước */
  loai: LoaiBuoc;
  /** Nhóm giai đoạn (tuỳ chọn) */
  nhomGiaiDoan?: string;
  /** Đơn vị phụ trách / soạn hồ sơ */
  donViPhuTrach: string;
  /** Vai trò người xử lý */
  vaiTroXuLy: string;
  /** Thời hạn xử lý — số ngày (cho phép 0 và thập phân) */
  slaNgay: number;
  /** Loại thời hạn: cảnh báo / bắt buộc */
  loaiThoiHan: LoaiThoiHan;
  /** Trạng thái mặc định khi bước bắt đầu */
  trangThaiMacDinh: TrangThaiBuoc;
  /** Có yêu cầu ký duyệt */
  coKyDuyet: boolean;
  /** Đơn vị kiểm tra/ký hồ sơ (khi coKyDuyet = true) */
  donViKyHoSo?: string;
  /** Vai trò ký duyệt (khi coKyDuyet = true) */
  vaiTroKyDuyet?: string;
  /** Số ngày ký duyệt */
  soNgayKyDuyet?: number;
  /** Bắt buộc ký trước khi chuyển bước */
  batBuocKyTruocChuyenBuoc: boolean;
  /** Bảng điều kiện chuyển tiếp */
  dieuKienChuyenTiep: DieuKienChuyenTiep[];
  /** Có tạo nhánh song song */
  coNhanhSongSong: boolean;
  /** Danh sách nhánh song song */
  nhanhList: NhanhSongSong[];
  /** Điều kiện hợp nhất nhánh */
  dieuKienHopNhat: "all" | "any" | "count";
  /** Số nhánh tối thiểu (khi dieuKienHopNhat = "count") */
  soNhanhHopNhatToiThieu: number;
  /** Bước tiếp theo sau khi tất cả nhánh hợp nhất */
  buocSauHopNhatId?: string;
  /** Ghi chú thêm */
  moTa: string;
  /** @deprecated dùng dieuKienChuyenTiep thay thế */
  dieuKienChuyen: DieuKienChuyen[];
  /** @deprecated dùng dieuKienChuyenTiep thay thế */
  buocTiepTheoId: string;
};

export type QuyTrinh = {
  id: string;
  /** Tên quy trình */
  ten: string;
  /** Hình thức đấu thầu áp dụng */
  hinhThuc: HinhThucQT;
  /** Danh sách các bước trong quy trình */
  buocList: Buoc[];
  /** Trạng thái quy trình */
  trangThai: TrangThaiQT;
  /** Ngày tạo ISO string */
  ngayTao: string;
};

/** Khóa lưu trong localStorage */
const KHOA_LUU = "qlqtdt_quy_trinh";

/** Đọc toàn bộ danh sách quy trình từ localStorage */
export function layDanhSachQuyTrinh(): QuyTrinh[] {
  try {
    const raw = localStorage.getItem(KHOA_LUU);
    return raw ? (JSON.parse(raw) as QuyTrinh[]) : [];
  } catch {
    return [];
  }
}

/** Lưu danh sách vào localStorage */
function luuDanhSach(list: QuyTrinh[]): void {
  localStorage.setItem(KHOA_LUU, JSON.stringify(list));
}

/** Thêm quy trình mới vào đầu danh sách */
export function themQuyTrinh(qt: QuyTrinh): void {
  const list = layDanhSachQuyTrinh();
  list.unshift(qt);
  luuDanhSach(list);
}

/** Cập nhật quy trình đã có */
export function capNhatQuyTrinh(qt: QuyTrinh): void {
  luuDanhSach(layDanhSachQuyTrinh().map((x) => (x.id === qt.id ? qt : x)));
}

/** Xóa quy trình theo ID */
export function xoaQuyTrinh(id: string): void {
  luuDanhSach(layDanhSachQuyTrinh().filter((x) => x.id !== id));
}

/** Tìm quy trình theo ID */
export function layQuyTrinhTheoId(id: string): QuyTrinh | undefined {
  return layDanhSachQuyTrinh().find((x) => x.id === id);
}

/** Sinh mã quy trình duy nhất */
export function sinhMaQuyTrinh(): string {
  return `QT${Date.now()}`;
}

// ─── Alias tương thích ngược (dùng trong các file cũ) ────────────────────────
export const getQuyTrinhList = layDanhSachQuyTrinh;
export const addQuyTrinh = themQuyTrinh;
export const updateQuyTrinh = capNhatQuyTrinh;
export const deleteQuyTrinh = xoaQuyTrinh;
export const getQuyTrinhById = layQuyTrinhTheoId;
export const generateQuyTrinhId = sinhMaQuyTrinh;
