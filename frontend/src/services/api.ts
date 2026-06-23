/* ─────────────────────────────────────────────────────────────
   Core API service — login, logout, current user, refresh
───────────────────────────────────────────────────────────── */
import http from "@/util/http";

/* ─── Auth ──────────────────────────────────────────────── */

export type LoginRequest = {
  tenDangNhap: string;
  matKhau: string;
};

export type LoginUserDto = {
  idCongKhai: string;
  tenDangNhap: string;
  hoTen: string;
  email: string;
  trangThaiHoatDong: boolean;
  ngayTao: string;
  ngayDangNhapCuoi?: string;
  ngayCapNhat?: string;
  avatarUrl?: string;
  soDienThoai?: string;
  roles: { khoaPhongId?: number; tenKhoaPhong?: string; maKhoaPhong?: string; vaiTroId: number; tenVaiTro: string; laChinh: boolean }[];
  quyen: string[];
};

export type LoginResponse = {
  message: string;
  user: LoginUserDto;
  token: string;
  refreshToken?: string;
};

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", data);
  return res;
}

export async function getCurrentUserApi(): Promise<LoginUserDto> {
  const res = await http.get<LoginUserDto>("/auth/me");
  return res;
}

export async function sendProfileChangeRequest(data: {
  hoTen?: string;
  email?: string;
  soDienThoai?: string;
}): Promise<void> {
  await http.post("/auth/me/change-request", data);
}

export async function updateProfileApi(data: {
  hoTen?: string;
  email?: string;
  soDienThoai?: string;
}): Promise<LoginUserDto> {
  const res = await http.put<LoginUserDto>("/auth/me", data);
  return res;
}

export async function logoutApi(): Promise<void> {
  await http.post("/auth/logout");
}

/* ─── Helpers ───────────────────────────────────────────── */

export function setStoredToken(accessToken: string) {
  localStorage.setItem("accessToken", accessToken);
}

export function getStoredToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function clearStoredToken() {
  localStorage.removeItem("accessToken");
}
