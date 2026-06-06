import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { toast } from "sonner";
import { taoGoiThauSchema } from "@/util/validate";
import type { InferType } from "yup";
import { useFileAttachment } from "@/hooks/useFileAttachment";
import {
  formatBytes,
  fileIcon,
  openFile,
  downloadFile,
} from "@/util/fileAttachment";
import { addGoiThau, generateGoiThauId, formatVND } from "@/pages/DanhSachGoiThau/goiThauService";
import type { HinhThuc } from "@/pages/DanhSachGoiThau/goiThauService";

const HT_BADGE: Record<HinhThuc, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};

const NGUON_VON = [
  "Ngân sách Nhà nước",
  "Ngân sách BV",
  "Tự chủ tài chính",
  "Nguồn khác",
];

const DON_VI = [
  "Khoa Nội",
  "Khoa Dược",
  "Khoa Ngoại",
  "Khoa Xét nghiệm",
  "P.HCQT",
  "P.Kế hoạch",
  "Phòng khác",
];

const inputCls =
  "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputErrCls =
  "w-full px-3.5 py-2.5 border border-red-400 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent";
const labelCls = "block text-xs font-semibold text-slate-500 mb-1.5";

type FormData = InferType<typeof taoGoiThauSchema>;

export default function TaoGoiThau() {
  const navigate = useNavigate();
  const [savingDraft, setSavingDraft] = useState(false);
  const { attachments, getRootProps, getInputProps, isDragActive, removeFile } =
    useFileAttachment();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(taoGoiThauSchema),
    defaultValues: { ghiChu: "" },
  });

  const watched = watch();
  const hasPreview = !!(watched.ten?.trim() || watched.hinhThuc);
  const ghiChuLen = watched.ghiChu?.length ?? 0;

  /* ─ Gửi đề xuất ─ */
  function onSubmit(data: FormData) {
    const num = parseInt(data.giaTriStr.replace(/[^\d]/g, ""), 10) || 0;
    addGoiThau({
      id: generateGoiThauId(),
      ten: data.ten.trim(),
      hinhThuc: data.hinhThuc as HinhThuc,
      giaTriStr: formatVND(data.giaTriStr),
      giaTriNum: num,
      donVi: data.donVi,
      trangThai: "Chờ duyệt",
      detail: {
        nguonVon: data.nguonVon,
        ngayTao: data.ngayTao,
        hanHT: data.hanHT,
        pct: "0%",
        buoc: "1/14",
      },
    });
    toast.success("Gói thầu đã được gửi đề xuất và đang chờ duyệt");
    navigate("/danh-sach-goi-thau");
  }

  /* ─ Lưu nháp ─ */
  function saveDraft() {
    const values = watch();
    if (!values.ten?.trim()) {
      toast.error("Vui lòng nhập tên gói thầu trước khi lưu nháp");
      return;
    }
    setSavingDraft(true);
    const num =
      parseInt((values.giaTriStr ?? "").replace(/[^\d]/g, ""), 10) || 0;
    addGoiThau({
      id: generateGoiThauId(),
      ten: values.ten.trim(),
      hinhThuc: (values.hinhThuc || "Chỉ định thầu rút gọn") as HinhThuc,
      giaTriStr: values.giaTriStr ? formatVND(values.giaTriStr) : "0",
      giaTriNum: num,
      donVi: values.donVi || "—",
      trangThai: "Nháp",
      detail: {
        nguonVon: values.nguonVon || "—",
        ngayTao: values.ngayTao || "—",
        hanHT: values.hanHT || "—",
        pct: "0%",
        buoc: "0/14",
      },
    });
    toast.success("Gói thầu đã được lưu nháp thành công");
    navigate("/danh-sach-goi-thau");
  }

  const cls = (field: keyof FormData) =>
    errors[field] ? inputErrCls : inputCls;

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">Tạo gói thầu</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-regular fa-bell" />
            <span className="absolute top-1.5 right-1.5 w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              5
            </span>
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {/* FORM CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <i className="fa-solid fa-plus text-sm" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Thông tin gói thầu
                </p>
                <p className="text-xs text-slate-400">
                  Vui lòng điền đầy đủ các thông tin bắt buộc
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* Tên gói thầu */}
              <div>
                <label className={labelCls}>
                  Tên gói thầu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Mua sắm thiết bị y tế khoa Nội"
                  {...register("ten")}
                  className={cls("ten")}
                />
                {errors.ten && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.ten.message}
                  </p>
                )}
              </div>

              {/* Hình thức + Nguồn vốn */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Hình thức đấu thầu <span className="text-red-500">*</span>
                  </label>
                  <select {...register("hinhThuc")} className={cls("hinhThuc")}>
                    <option value="">-- Chọn hình thức --</option>
                    <option>Chỉ định thầu rút gọn</option>
                    <option>Chỉ định thầu tự quyết định</option>
                    <option>Chỉ định thầu thông thường</option>
                    <option>Chào hàng cạnh tranh</option>
                    <option>Đấu thầu rộng rãi</option>
                  </select>
                  {errors.hinhThuc && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.hinhThuc.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Nguồn vốn <span className="text-red-500">*</span>
                  </label>
                  <select {...register("nguonVon")} className={cls("nguonVon")}>
                    <option value="">-- Chọn nguồn vốn --</option>
                    {NGUON_VON.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  {errors.nguonVon && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.nguonVon.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Giá trị + Đơn vị */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Giá trị gói thầu (VNĐ){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VD: 320,000,000"
                      {...register("giaTriStr")}
                      className={cls("giaTriStr")}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                      đ
                    </span>
                  </div>
                  {errors.giaTriStr && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.giaTriStr.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Đơn vị đề xuất <span className="text-red-500">*</span>
                  </label>
                  <select {...register("donVi")} className={cls("donVi")}>
                    <option value="">-- Chọn đơn vị --</option>
                    {DON_VI.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                  {errors.donVi && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.donVi.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Ngày tạo + Hạn HT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Ngày tạo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("ngayTao")}
                    className={cls("ngayTao")}
                  />
                  {errors.ngayTao && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.ngayTao.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>
                    Hạn hoàn thành <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("hanHT")}
                    className={cls("hanHT")}
                  />
                  {errors.hanHT && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.hanHT.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className={labelCls}>Ghi chú / Lý do mua sắm</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả nhu cầu mua sắm, lý do cần thiết..."
                  {...register("ghiChu")}
                  className={`${
                    errors.ghiChu ? inputErrCls : inputCls
                  } resize-none`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.ghiChu ? (
                    <p className="text-xs text-red-500">
                      {errors.ghiChu.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`text-[11px] ml-auto ${
                      ghiChuLen > 1000
                        ? "text-red-500 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {ghiChuLen}/1000
                  </span>
                </div>
              </div>

              {/* TÀI LIỆU ĐÍNH KÈM */}
              <div>
                <label className={labelCls}>
                  Tài liệu đính kèm{" "}
                  <span className="text-slate-400 font-normal">
                    (PDF, DOCX, XLSX, hình ảnh — tối đa 20 MB/file)
                  </span>
                </label>

                {/* Drop zone */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 hover:border-blue-400 hover:bg-blue-50/40"
                  }`}
                >
                  <input {...getInputProps()} />
                  <i
                    className={`fa-solid fa-cloud-arrow-up text-2xl mb-2 block ${
                      isDragActive ? "text-blue-400" : "text-slate-300"
                    }`}
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    {isDragActive
                      ? "Thả file vào đây..."
                      : "Kéo thả hoặc nhấn để chọn file"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PDF · DOCX · XLSX · PNG · JPG — tối đa 20 MB/file
                  </p>
                </div>

                {/* Danh sách file */}
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {attachments.map((file, idx) => {
                      const { icon, color } = fileIcon(file.name);
                      return (
                        <li
                          key={`${file.name}-${idx}`}
                          className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5"
                        >
                          <i
                            className={`fa-solid ${icon} ${color} text-lg shrink-0`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Xem file"
                              onClick={() => openFile(file)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <i className="fa-solid fa-eye text-xs" />
                            </button>
                            <button
                              type="button"
                              title="Tải xuống"
                              onClick={() => downloadFile(file)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <i className="fa-solid fa-download text-xs" />
                            </button>
                            <button
                              type="button"
                              title="Xóa file"
                              onClick={() => removeFile(idx)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <i className="fa-solid fa-xmark text-xs" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {attachments.length > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1.5 text-right">
                    {attachments.length} file ·{" "}
                    {formatBytes(attachments.reduce((s, f) => s + f.size, 0))}{" "}
                    tổng
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/danh-sach-goi-thau")}
                  className="px-5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={isSubmitting || savingDraft}
                  className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {savingDraft ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                  ) : (
                    <i className="fa-regular fa-floppy-disk text-xs" />
                  )}{" "}
                  Lưu nháp
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || savingDraft}
                  className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                  ) : (
                    <i className="fa-solid fa-paper-plane text-xs" />
                  )}{" "}
                  Gửi đề xuất
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* PREVIEW PANEL */}
        <aside className="w-[270px] shrink-0 border-l border-slate-200 bg-white overflow-y-auto p-5 hidden xl:block">
          <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-3">
            XEM TRƯỚC
          </p>

          {hasPreview ? (
            <>
              <div className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                {watched.ten || (
                  <span className="text-slate-300">Chưa có tên</span>
                )}
              </div>
              {watched.hinhThuc && (
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${HT_BADGE[watched.hinhThuc as HinhThuc] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {watched.hinhThuc}
                </span>
              )}
              <div className="space-y-2 mt-3">
                {[
                  [
                    "Giá trị",
                    watched.giaTriStr ? `${formatVND(watched.giaTriStr)} đ` : "—",
                  ],
                  ["Nguồn vốn", watched.nguonVon || "—"],
                  ["Đơn vị", watched.donVi || "—"],
                  ["Ngày tạo", watched.ngayTao || "—"],
                  ["Hạn hoàn thành", watched.hanHT || "—"],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between text-xs">
                    <span className="text-slate-400">{lbl}</span>
                    <span className="text-slate-800 font-medium">{val}</span>
                  </div>
                ))}
              </div>
              {watched.ghiChu && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wide mb-1">
                    GHI CHÚ
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {watched.ghiChu}
                  </p>
                </div>
              )}
              <div className="mt-5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-700 font-medium">
                  <i className="fa-solid fa-circle-info mr-1" />
                  Gói thầu sau khi tạo sẽ "Chờ duyệt" và cần Giám đốc BV phê
                  duyệt trước khi tiến hành.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <i className="fa-regular fa-file-lines text-slate-300 text-xl" />
              </div>
              <p className="text-xs text-slate-400">
                Bắt đầu nhập thông tin để xem trước gói thầu
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
