import axios, { type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { clearAuthClientState, getCsrfToken } from "@/util/authStorage";

/** Mở rộng AxiosRequestConfig thêm flag skip toast */
declare module "axios" {
  interface AxiosRequestConfig {
    _skipAuthToast?: boolean;
  }
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;

  const error = (data as { error?: unknown }).error;
  const message = (data as { message?: unknown }).message;

  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const nestedMessage = (error as { message?: unknown }).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
  }

  if (typeof message === "string" && message.trim()) return message;
  if (message && typeof message === "object") {
    const nestedMessage = (message as { message?: unknown }).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
  }

  return fallback;
}

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_API ?? "http://localhost:5208/api",
  withCredentials: true,
});

const _send = async <T>(
  method: string,
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> => {
  const response = await httpClient.request<T>({
    ...config,
    method,
    url: path,
    data,
  });

  return response.data;
};

httpClient.interceptors.request.use(
  (config) => {
    // Auth: HttpOnly cookie tu dong duoc browser gui kem.
    // Khong can set Authorization header — token an toan trong cookie.

    // CSRF double-submit token cho unsafe methods
    const method = config.method?.toLowerCase();
    if (method && !["get", "head", "options"].includes(method)) {
      const xsrf = getCsrfToken();
      if (xsrf) config.headers["X-CSRF-Token"] = xsrf;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthClientState();
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      window.location.hash = "#/login";
      return Promise.reject(error);
    }

    // 403 — toast nếu caller không yêu cầu skip
    if (error.response?.status === 403 && !error.config?._skipAuthToast) {
      const msg = getApiErrorMessage(
        error.response?.data,
        "Bạn không có quyền thực hiện thao tác này.",
      );
      toast.error(msg);
    }

    return Promise.reject(error);
  },
);

const get = <T>(path: string, config?: AxiosRequestConfig) =>
  _send<T>("get", path, undefined, config);

const post = <T>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
  _send<T>("post", path, data, config);

const put = <T>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
  _send<T>("put", path, data, config);

const patch = <T>(path: string, data?: unknown, config?: AxiosRequestConfig) =>
  _send<T>("patch", path, data, config);

const del = <T>(path: string, config?: AxiosRequestConfig) =>
  _send<T>("delete", path, undefined, config);

const http = { get, post, put, patch, del };
export default http;
