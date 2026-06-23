import axios, { type AxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { clearStoredToken, getStoredToken } from "@/services/api";

/** Mở rộng AxiosRequestConfig thêm flag skip toast */
declare module "axios" {
  interface AxiosRequestConfig {
    _skipAuthToast?: boolean;
  }
}

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_BASE_API,
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
    const accessToken = getStoredToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      window.location.hash = "#/login";
      return Promise.reject(error);
    }

    // 403 — toast nếu caller ko yêu cầu skip
    if (error.response?.status === 403 && !error.config?._skipAuthToast) {
      const msg =
        error.response?.data?.error ||
        "Bạn không có quyền thực hiện thao tác này.";
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
