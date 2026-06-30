import { useMemo } from "react";
import type { LoginUserDto } from "@/services/api";

/**
 * 1 = CAP_CAO
 * 3 = TRUNG_BINH
 * 5 = THAP
 * null = no role
 */
export type AccessLevel = 1 | 3 | 5 | null;
export type RoleCode = "ADMIN" | "CAP_CAO" | "TRUNG_BINH" | "THAP";

/* Route → permissions mapping (OR logic — 1 trong số đó là đủ) */
const ROUTE_PERMISSION_MAP: Record<string, string[]> = {
  "/dashboard": [],
  "/danh-sach-goi-thau": ["GOITHAU.VIEW", "GOITHAU.VIEW_ALL", "GOITHAU.VIEW_INTERNAL"],
  "/tao-goi-thau": ["GOITHAU.CREATE"],
  "/danh-sach-quy-trinh": ["WORKFLOW.VIEW", "WORKFLOW.VIEW_ALL"],
  "/lap-quy-trinh": ["WORKFLOW.CREATE", "WORKFLOW.CONFIG", "WORKFLOW.VIEW_ALL"],
  "/danh-muc-thuc-hien": ["HINHTHUCDAUTHAU.VIEW", "DANHMUC.VIEW", "DANHMUC.VIEW_ALL"],
  "/bao-cao": ["REPORT.VIEW", "REPORT.VIEW_INTERNAL", "REPORT.VIEW_ALL"],
  "/xu-ly-buoc": ["WORKFLOW.PROCESS", "GOITHAU.EDIT", "GOITHAU.CREATE"],
  "/khoa-phong": ["USER.VIEW", "USER.VIEW_ALL"],
  "/nguoi-dung": ["USER.VIEW", "USER.VIEW_ALL"],
  "/profile": [],
};

/* Legacy level-based fallback */
const PAGE_POLICY: Record<RoleCode, "*" | string[]> = {
  ADMIN: "*",
  CAP_CAO: [
    "/dashboard",
    "/tao-goi-thau",
    "/danh-sach-goi-thau",
    "/danh-sach-quy-trinh",
    "/danh-muc-thuc-hien",
    "/bao-cao",
    "/xu-ly-buoc",
    "/profile",
  ],
  TRUNG_BINH: [
    "/dashboard",
    "/tao-goi-thau",
    "/danh-sach-goi-thau",
    "/danh-muc-thuc-hien",
    "/bao-cao",
    "/xu-ly-buoc",
    "/profile",
  ],
  THAP: ["/dashboard", "/tao-goi-thau", "/danh-sach-goi-thau", "/profile"],
};

/* ─── Permission helpers ─────────────────────────────────── */

/** Check if user has at least 1 permission in the list (OR) */
export function hasAnyPermission(user: LoginUserDto | null | undefined, permissions: string[]): boolean {
  if (!user?.quyen?.length) return false;
  if (permissions.length === 0) return true; // no permission required → allow
  return permissions.some((p) => user.quyen.includes(p));
}

function getPrimaryPath(path: string) {
  const cleanPath = path.split("?")[0].replace(/\/+$/, "");
  const key = cleanPath.replace(/^\//, "").split("/")[0];
  return key ? `/${key}` : "/dashboard";
}

export function getRoleCode(user?: LoginUserDto | null): RoleCode {
  if (!user?.roles?.length) return "THAP";

  const hasAdmin = user.roles.some((r) => r.tenVaiTro?.toUpperCase() === "ADMIN");
  if (hasAdmin) return "ADMIN";

  // User gắn với khoa/phòng → at least TRUNG_BINH (có quyền xem dashboard, DS gói thầu, báo cáo theo khoa)
  const belongsToDepartment = user.roles.some(r => r.khoaPhongId != null);

  const priorities = user.roles
    .map((r) => r.doUuTien)
    .filter((priority): priority is number => priority != null);
  const priority = priorities.length > 0 ? Math.min(...priorities) : (belongsToDepartment ? 3 : 5);

  if (priority <= 1) return "CAP_CAO";
  if (priority <= 3) return "TRUNG_BINH";
  return "THAP";
}

export function getDefaultPath(user?: LoginUserDto | null) {
  return getRoleCode(user) === "THAP" ? "/danh-sach-goi-thau" : "/dashboard";
}

/** Permission-based route guard. Fall back to legacy level if user has no `quyen`. */
export function canAccessPath(path: string, user?: LoginUserDto | null): boolean {
  // Try permission-based first
  const primaryPath = getPrimaryPath(path);
  const neededPerms = ROUTE_PERMISSION_MAP[primaryPath];
  if (neededPerms && user?.quyen?.length) {
    if (neededPerms.length === 0) return true; // no permission needed
    return hasAnyPermission(user, neededPerms);
  }

  // Fallback to legacy level
  const roleCode = getRoleCode(user);
  const allowedPaths = PAGE_POLICY[roleCode];
  if (allowedPaths === "*") return true;
  return allowedPaths.includes(primaryPath);
}

export function canAccessReport(user: LoginUserDto | null | undefined, ...permissions: string[]): boolean {
  return hasAnyPermission(user, permissions.length > 0 ? permissions : ["REPORT.VIEW", "REPORT.VIEW_INTERNAL", "REPORT.VIEW_ALL"]);
}

export function useAccessLevel(user?: LoginUserDto | null): AccessLevel {
  return useMemo(() => {
    const roleCode = getRoleCode(user);
    if (roleCode === "ADMIN" || roleCode === "CAP_CAO") return 1;
    if (roleCode === "TRUNG_BINH") return 3;
    return 5;
  }, [user]);
}

export function canAccess(path: string, level: AccessLevel, user?: LoginUserDto | null): boolean {
  if (user) return canAccessPath(path, user);
  if (!level) return false;

  const key = getPrimaryPath(path);
  const legacyPolicy: Record<NonNullable<AccessLevel>, string[]> = {
    1: PAGE_POLICY.CAP_CAO as string[],
    3: PAGE_POLICY.TRUNG_BINH as string[],
    5: PAGE_POLICY.THAP as string[],
  };

  return legacyPolicy[level].includes(key);
}

export function getVisiblePaths(level: AccessLevel): string[] {
  if (!level) return [];
  const legacyPolicy: Record<NonNullable<AccessLevel>, string[]> = {
    1: PAGE_POLICY.CAP_CAO as string[],
    3: PAGE_POLICY.TRUNG_BINH as string[],
    5: PAGE_POLICY.THAP as string[],
  };
  return legacyPolicy[level];
}
