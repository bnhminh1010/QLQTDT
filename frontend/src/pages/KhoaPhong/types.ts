export type TrangThai = "Đang hoạt động" | "Ngưng hoạt động";

export type Phong = {
  id: string;
  ten: string;
  ma: string;
  trangThai: TrangThai;
};

export type PhongFormValues = {
  ma: string;
  ten: string;
  trangThai: TrangThai;
};
