/* ─────────────────────────────────────────────────────────────
   Core API service — login, logout, current user, refresh
───────────────────────────────────────────────────────────── */
import http from "@/util/http";
import type { ApiResponse } from "./types";

/* ─── Auth ──────────────────────────────────────────────── */

export type LoginRequest = {
  username: string;
  password: string;
  rememberMe?: boolean;
};

export type UserDto = {
  id: number;
  idCongKhai: string;
  hoTen: string;
  email: string;
  tenDangNhap: string;
  soDienThoai?: string;
  ngayDangNhapCuoi?: string;
  ngayCapNhat?: string;
};

export type LoginResponse = {
  user: UserDto;
  permissions: string[];
};

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const res = await http.post<ApiResponse<LoginResponse>>("/auth/login", data);
  return res.data;
}

export async function getCurrentUserApi(): Promise<UserDto> {
  const res = await http.get<ApiResponse<UserDto>>("/auth/me");
  return res.data;
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
