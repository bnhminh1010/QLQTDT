export type VaiTro = string;
export type TenVaiTro = string;

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

// Fallback empty arrays — real data loaded from API by parent
export const PHONG_OPTIONS: string[] = [];
export const VAI_TRO_OPTIONS: string[] = [];

export type AuditEntry = {
  id: string;
  userId: string;
  hanhDong: string;
  nguoiThucHien: string;
  thoiGian: string;
};
