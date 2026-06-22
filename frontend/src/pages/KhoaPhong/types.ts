export type LoaiPhong =
  | "Khoa lâm sàng"
  | "Khoa cận lâm sàng"
  | "Phòng chức năng";
export type TrangThai = "Đang hoạt động" | "Ngưng hoạt động";

export type Phong = {
  id: string; // mã khoa/phòng — primary key
  ten: string;
  loai: LoaiPhong;
  truongKhoa: string;
  soNhanVien: number;
  soGoiThau: number;
  email: string;
  sdt: string;
  trangThai: TrangThai;
  donViCha: string; // rỗng nếu không có cha
  moTa: string;
};

export type PhongFormValues = {
  ma: string;
  ten: string;
  loai: LoaiPhong;
  truongKhoa: string;
  soNhanVien: number;
  email: string;
  sdt: string;
  trangThai: TrangThai;
  donViCha: string;
  moTa: string;
};
