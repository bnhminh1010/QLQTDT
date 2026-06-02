import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { MAX_FILE_SIZE } from "@/util/fileAttachment";

export function useFileAttachment() {
  const [attachments, setAttachments] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    onDropAccepted(files) {
      const unique = files.filter(
        (f) => !attachments.some((a) => a.name === f.name && a.size === f.size),
      );
      if (unique.length < files.length)
        toast.error("Một số file đã được thêm trước đó");
      if (unique.length > 0)
        setAttachments((prev) => [...prev, ...unique]);
    },
    onDropRejected(rejections) {
      rejections.forEach((r) => {
        const isTooLarge = r.errors.some((e) => e.code === "file-too-large");
        toast.error(
          isTooLarge
            ? `"${r.file.name}" vượt quá 20 MB`
            : `"${r.file.name}" không đúng định dạng`,
        );
      });
    },
  });

  function removeFile(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  return { attachments, getRootProps, getInputProps, isDragActive, removeFile };
}
