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

// Legacy mock functions — all data now comes from backend WorkflowEngine API.
// Stubs retained for backward compatibility.

export function getXuLyBuoc(_goiThauId: string): XuLyBuocRecord | null {
  return null;
}

export function getXuLyBuocByStep(_goiThauId: string, _stepName: string): XuLyBuocRecord | null {
  return null;
}

export function getXuLyBuocHistory(_goiThauId: string): XuLyBuocRecord[] {
  return [];
}
