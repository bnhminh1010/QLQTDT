export type VaiTro = "Admin" | "Quản lý" | "Nhân viên";
export type TrangThai = "Hoạt động" | "Bị khóa" | "Ngưng hoạt động";

export type User = {
  id: string;
  hoTen: string;
  username: string;
  email: string;
  sdt: string;
  phong: string;
  vaiTro: VaiTro;
  trangThai: TrangThai;
  ngayTao: string; // "DD/MM/YYYY"
};

export type UserAddFormValues = {
  hoTen: string;
  username: string;
  email: string;
  sdt: string;
  phong: string;
  vaiTro: VaiTro | "";
  trangThai: TrangThai;
  matKhau: string;
  xacNhanMatKhau: string;
};

export type UserEditFormValues = {
  hoTen: string;
  email: string;
  sdt: string;
  phong: string;
  vaiTro: VaiTro;
  trangThai: TrangThai;
};

export const PHONG_OPTIONS = [
  "Ban Giám đốc",
  "P.Kế hoạch",
  "P.HCQT",
  "Khoa Dược",
  "Khoa Nội",
  "Khoa Ngoại",
  "Khoa Xét nghiệm",
];

export const VAI_TRO_OPTIONS: VaiTro[] = ["Admin", "Quản lý", "Nhân viên"];
