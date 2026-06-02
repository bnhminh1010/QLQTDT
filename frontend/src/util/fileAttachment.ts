export const ACCEPT_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

export const ALLOWED_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: "fa-file-pdf", color: "text-red-500" };
  if (["doc", "docx"].includes(ext)) return { icon: "fa-file-word", color: "text-blue-500" };
  if (["xls", "xlsx"].includes(ext)) return { icon: "fa-file-excel", color: "text-emerald-600" };
  if (["png", "jpg", "jpeg"].includes(ext)) return { icon: "fa-file-image", color: "text-purple-500" };
  return { icon: "fa-file", color: "text-slate-400" };
}

export function openFile(file: File) {
  const url = URL.createObjectURL(file);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}


