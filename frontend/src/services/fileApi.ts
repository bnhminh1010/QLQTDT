import axios from "axios";
import { toast } from "sonner";
import http from "@/util/http";
import type { ApiResponse } from "./types";

export type DocumentPhase = "Processing" | "Approval";

export type TaiLieuUploadResultDto = {
  id: number;
  fileName: string;
  size: number;
  loaiTaiLieu: string;
};

export type TaiLieuDto = {
  id: number;
  tenFile: string;
  kichThuoc: number;
  loaiTaiLieu: string;
  documentPhase?: DocumentPhase | null;
  contentType: string;
  goiThauId?: number | null;
  workflowStepInstanceId?: number | null;
  nguoiUploadId?: number | null;
  nguoiUploadTen?: string | null;
  ngayTao: string;
};

export async function uploadTaiLieuFiles(request: {
  files: File[];
  goiThauId?: number | null;
  workflowStepInstanceId?: number | null;
  loaiTaiLieu: string;
  documentPhase?: DocumentPhase | null;
}, options?: {
  skipAuthToast?: boolean;
}): Promise<TaiLieuUploadResultDto[]> {
  const formData = new FormData();
  request.files.forEach((file) => formData.append("files", file));
  if (request.goiThauId != null) formData.append("goiThauId", String(request.goiThauId));
  if (request.workflowStepInstanceId != null) {
    formData.append("workflowStepInstanceId", String(request.workflowStepInstanceId));
  }
  formData.append("loaiTaiLieu", request.loaiTaiLieu);
  if (request.documentPhase) formData.append("documentPhase", request.documentPhase);

  const res = await http.post<ApiResponse<TaiLieuUploadResultDto[]>>(
    "/files/upload",
    formData,
    options?.skipAuthToast ? { _skipAuthToast: true } : undefined,
  );
  return res.data;
}

export async function getTaiLieuFiles(params: {
  goiThauId?: number | null;
  workflowStepInstanceId?: number | null;
  loaiTaiLieu?: string;
  documentPhase?: DocumentPhase | null;
}, options?: {
  skipAuthToast?: boolean;
}): Promise<TaiLieuDto[]> {
  const res = await http.get<ApiResponse<TaiLieuDto[]>>("/files", {
    params: {
      goiThauId: params.goiThauId ?? undefined,
      workflowStepInstanceId: params.workflowStepInstanceId ?? undefined,
      loaiTaiLieu: params.loaiTaiLieu || undefined,
      documentPhase: params.documentPhase || undefined,
    },
    _skipAuthToast: options?.skipAuthToast,
  });
  return res.data;
}

async function getTaiLieuBlob(id: number): Promise<Blob> {
  return await http.get<Blob>(`/files/${id}`, {
    responseType: "blob",
    _skipAuthToast: true,
  });
}

function showTaiLieuAccessError(error: unknown, actionLabel: string) {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return;
  }
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    toast.error("Bạn không có quyền xem hoặc tải tài liệu này.");
    return;
  }

  toast.error(`Không thể ${actionLabel} tài liệu.`);
}

export async function openTaiLieuFile(id: number) {
  try {
    const blob = await getTaiLieuBlob(id);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    showTaiLieuAccessError(error, "xem");
  }
}

export async function downloadTaiLieuFile(id: number, fileName: string) {
  try {
    const blob = await getTaiLieuBlob(id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    showTaiLieuAccessError(error, "tải");
  }
}
