import { useMemo } from "react";
import type { LoginUserDto } from "@/services/api";

/**
 * 1 = CAP_CAO (full access)
 * 3 = TRUNG_BINH (limited)
 * 5 = THAP (basic)
 * null = no role → basic
 */
export type AccessLevel = 1 | 3 | 5 | null;

export function useAccessLevel(user?: LoginUserDto | null): AccessLevel {
  return useMemo(() => {
    if (!user?.roles?.length) return null;
    // Check if user has ADMIN role → full access regardless of doUuTien
    const isAdmin = user.roles.some(
      (r) => r.tenVaiTro === "ADMIN" || r.maVaiTro === "ADMIN"
    );
    // Lowest DoUuTien = highest priority (1 > 3 > 5)
    const priorities = user.roles.map((r) => r.doUuTien).filter((p): p is number => p != null);
    if (isAdmin || priorities.length === 0) return 1; // Admin or no priority → full access
    return Math.min(...priorities) as AccessLevel;
  }, [user]);
}

const LEVEL: Record<string, number> = {
  dashboard: 5,       // THAP + TRUNG_BINH + CAP_CAO
  "tao-goi-thau": 5,  // THAP + TRUNG_BINH + CAP_CAO
  "danh-sach-goi-thau": 3,  // TRUNG_BINH + CAP_CAO
  "danh-sach-quy-trinh": 3, // TRUNG_BINH + CAP_CAO
  "lap-quy-trinh": 3, // TRUNG_BINH + CAP_CAO
  "danh-muc-thuc-hien": 1, // chỉ CAP_CAO
  "bao-cao": 3,       // TRUNG_BINH + CAP_CAO
  "khoa-phong": 1,    // chỉ CAP_CAO
  "nguoi-dung": 1,    // chỉ CAP_CAO
  "xu-ly-buoc": 3,    // TRUNG_BINH + CAP_CAO
  profile: 5,         // tất cả
};

export function canAccess(path: string, level: AccessLevel): boolean {
  if (!level) return false;
  const key = path.replace(/^\//, "").split("/")[0];
  const required = LEVEL[key];
  if (required === undefined) return true;
  // User's DoUuTien (lower = more privileged) must be <= page required level
  return level <= required;
}

export function getVisiblePaths(level: AccessLevel): string[] {
  if (!level) return ["/dashboard", "/profile"];
  return Object.entries(LEVEL)
    .filter(([_, required]) => level <= required)
    .map(([key]) => `/${key}`);
}
