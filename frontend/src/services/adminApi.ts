/* ─────────────────────────────────────────────────────────────
   Người dùng + Khoa phòng API
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse, PagedResult } from "./types";

/* ─── Người dùng ────────────────────────────────────────── */

export type NguoiDung = {
  id: number;
  idCongKhai: string;
  hoTen: string;
  email: string;
  tenDangNhap: string;
  soDienThoai?: string;
  trangThaiHoatDong: boolean;
};

export type CreateNguoiDungRequest = {
  hoTen: string;
  email: string;
  tenDangNhap: string;
  matKhau: string;
  soDienThoai?: string;
  khoaPhongId?: number;
  vaiTroId?: number;
};

export async function getUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PagedResult<NguoiDung>> {
  const res = await http.get<any>("/admin/users", { params });
  // Backend trả AdminUserListDto trực tiếp: { data: [...], totalCount, page, pageSize }
  return {
    items: res?.data ?? res?.items ?? [],
    total: res?.totalCount ?? res?.total ?? 0,
    page: res?.page ?? 1,
    pageSize: res?.pageSize ?? 10,
  };
}

export async function createUser(data: CreateNguoiDungRequest): Promise<NguoiDung> {
  const res = await http.post<ApiResponse<NguoiDung>>("/admin/users", data);
  return res.data;
}

export async function updateUser(id: number, data: Partial<CreateNguoiDungRequest>): Promise<NguoiDung> {
  const res = await http.put<ApiResponse<NguoiDung>>(`/admin/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await http.del(`/admin/users/${id}`);
}

export type UserAuditLog = {
  id: number;
  hanhDong: string;
  moTaChiTiet: string;
  thoiGianThucHien: string;
  nguoiThucHienId: number;
};

export async function getUserAuditLogs(userId: number): Promise<UserAuditLog[]> {
  const res = await http.get<ApiResponse<UserAuditLog[]>>(`/admin/users/${userId}/audit-log`);
  return res.data ?? [];
}

/* ─── Khoa phòng ────────────────────────────────────────── */

export type KhoaPhong = {
  id: number;
  idCongKhai: string;
  tenKhoaPhong: string;
  maKhoaPhong?: string;
  trangThaiHoatDong: boolean;
};

export async function getKhoaPhongs(): Promise<KhoaPhong[]> {
  const res = await http.get<ApiResponse<KhoaPhong[]>>("/khoa-phong");
  return res.data;
}

/* ─── Vai trò (Roles) ───────────────────────────────────── */

export type RoleItem = {
  id: number;
  maVaiTro: string;
  tenVaiTro: string;
  moTa?: string;
};

export type UserRoleAssign = {
  khoaPhongId: number;
  vaiTroId: number;
  laChinh?: boolean;
};

export type UserRoleInfo = {
  id: number;
  vaiTroId: number;
  tenVaiTro: string;
  maVaiTro: string;
  khoaPhongId?: number;
  tenKhoaPhong?: string;
  laChinh: boolean;
};

export async function getAllRoles(): Promise<RoleItem[]> {
  const res = await http.get<RoleItem[] | ApiResponse<RoleItem[]>>("/vai-tro");
  // Backend VaiTroController returns List<VaiTro> directly (no ApiResponse wrapper)
  return Array.isArray(res) ? res : (res as ApiResponse<RoleItem[]>).data ?? [];
}

export async function getUserRoles(userId: number): Promise<UserRoleInfo[]> {
  const res = await http.get<ApiResponse<UserRoleInfo[]>>(`/users/${userId}/roles`);
  return res.data ?? [];
}

export async function assignUserRole(userId: number, data: UserRoleAssign): Promise<void> {
  await http.post(`/users/${userId}/assign-role`, data);
}

export async function removeUserRole(assignmentId: number): Promise<void> {
  await http.del(`/users/roles/${assignmentId}`);
}

export async function createKhoaPhong(data: { tenKhoaPhong: string; maKhoaPhong?: string }): Promise<KhoaPhong> {
  const res = await http.post<ApiResponse<KhoaPhong>>("/khoa-phong", data);
  return res.data;
}

export async function updateKhoaPhong(id: number, data: { tenKhoaPhong?: string; maKhoaPhong?: string }): Promise<KhoaPhong> {
  const res = await http.put<ApiResponse<KhoaPhong>>(`/khoa-phong/${id}`, data);
  return res.data;
}

export async function deleteKhoaPhong(id: number): Promise<void> {
  await http.del(`/khoa-phong/${id}`);
}
