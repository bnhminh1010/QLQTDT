/* ─────────────────────────────────────────────────────────────
   Core API service — login, logout, current user, refresh
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import { clearCsrfToken, setCsrfToken } from "@/util/authStorage";

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
  roles: { khoaPhongId?: number; tenKhoaPhong?: string; maKhoaPhong?: string; vaiTroId: number; tenVaiTro: string; laChinh: boolean; doUuTien?: number }[];
  quyen: string[];
};

export type LoginResponse = {
  message: string;
  user: LoginUserDto;
  token: string;
  refreshToken?: string;
  csrfToken?: string;
};

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<LoginResponse>("/auth/login", data);
  setCsrfToken(res.csrfToken);
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
  try {
    await http.post("/auth/logout");
  } finally {
    clearAuthClientState();
  }
}

/* ─── Helpers ───────────────────────────────────────────── */

const AUTH_STORAGE_KEYS = [
  "token",
  "accessToken",
  "refreshToken",
  "authToken",
  "qlqtdt.token",
  "qlqtdt.accessToken",
  "qlqtdt.refreshToken",
  "qlqtdt.authToken",
];

export function clearAuthClientState() {
  clearCsrfToken();

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

/**
 * Token duoc luu trong HttpOnly cookie (do backend set khi login).
 * Frontend KHONG doc token tu localStorage — browser tu dong gui cookie.
 * Cac ham duoi day duoc giu signature de tranh pha code goi,
 * nhung luon tra ve null (chi dung cookie).
 */

export function getStoredToken(): string | null {
  // Chi dung cookie-based auth — khong luu JWT o client JS
  return null;
}

export function setStoredToken(_accessToken: string) {
  // No-op: token duoc set qua HttpOnly cookie boi backend
}

export function clearStoredToken() {
  clearAuthClientState();
}
