export type KetQuaXuLy = "Chờ xử lý" | "Duyệt" | "Không duyệt";

export type XuLyBuocRecord = {
  goiThauId: string;
  tenGoiThau: string;
  buocWorkflow: string;
  nguoiXuLy: string;
  ngayXuLy: string;
  nguoiKyDuyet: string;
  ngayKyDuyet: string;
  ketQua: KetQuaXuLy;
  ghiChu: string;
  lyDoKhongDuyet?: string;
  taiLieuDinhKem: string[];
  thoiGianXuLy?: string;
  thaoTacHeThong?: string;
};

const STORAGE_KEY = "qlqtdt_xu_ly_buoc";

function readAll(): Record<string, XuLyBuocRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, XuLyBuocRecord>) : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, XuLyBuocRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getXuLyBuoc(goiThauId: string): XuLyBuocRecord | null {
  return readAll()[goiThauId] ?? null;
}

export function saveXuLyBuoc(record: XuLyBuocRecord) {
  const all = readAll();
  all[record.goiThauId] = record;
  writeAll(all);
}

export function getXuLyBuocHistory(goiThauId: string): XuLyBuocRecord[] {
  const record = getXuLyBuoc(goiThauId);
  return record && record.ketQua !== "Chờ xử lý" ? [record] : [];
}
