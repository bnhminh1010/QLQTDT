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

const CSRF_STORAGE_KEY = "qlqtdt.csrfToken";

export function setCsrfToken(token?: string | null) {
  if (token) {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  }
}

export function clearCsrfToken() {
  sessionStorage.removeItem(CSRF_STORAGE_KEY);
}

export function getCsrfToken(): string | null {
  return sessionStorage.getItem(CSRF_STORAGE_KEY);
}

export function clearAuthClientState() {
  clearCsrfToken();

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
