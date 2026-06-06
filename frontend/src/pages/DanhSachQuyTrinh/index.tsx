import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getQuyTrinhList,
  deleteQuyTrinh,
  updateQuyTrinh,
  type QuyTrinh,
  type TrangThaiQT,
} from "./quyTrinhService";

const HT_BADGE: Record<string, string> = {
  "Chỉ định thầu rút gọn": "bg-blue-100 text-blue-700",
  "Chỉ định thầu tự quyết định": "bg-emerald-100 text-emerald-700",
  "Chỉ định thầu thông thường": "bg-slate-100 text-slate-600",
  "Chào hàng cạnh tranh": "bg-amber-100 text-amber-700",
  "Đấu thầu rộng rãi": "bg-purple-100 text-purple-700",
};

export default function DanhSachQuyTrinh() {
  const navigate = useNavigate();
  const [list, setList] = useState<QuyTrinh[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<QuyTrinh | null>(null);

  const reload = () => {
    setLoading(true);
    const t = setTimeout(() => {
      setList(getQuyTrinhList());
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  };

  useEffect(() => {
    return reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggle(qt: QuyTrinh) {
    const updated: QuyTrinh = {
      ...qt,
      trangThai: (
        qt.trangThai === "Đang hoạt động" ? "Đã tắt" : "Đang hoạt động"
      ) as TrangThaiQT,
    };
    updateQuyTrinh(updated);
    setList((prev) => prev.map((x) => (x.id === qt.id ? updated : x)));
    toast.success(
      updated.trangThai === "Đang hoạt động"
        ? "Đã kích hoạt quy trình"
        : "Đã tắt quy trình",
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteQuyTrinh(deleteTarget.id);
    setList((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast.success(`Đã xóa quy trình "${deleteTarget.ten}"`);
    setDeleteTarget(null);
  }

  return (
    <>
      {/* TOPBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-[17px] font-bold text-slate-900">
          Danh sách quy trình
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={reload}
            title="Tải lại"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <i
              className={`fa-solid fa-rotate-right ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => navigate("/lap-quy-trinh")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-plus text-xs" /> Tạo quy trình
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-400" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && list.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <i className="fa-solid fa-diagram-project text-4xl text-slate-200" />
              <p className="text-sm font-medium text-slate-500">
                Chưa có quy trình nào
              </p>
              <button
                onClick={() => navigate("/lap-quy-trinh")}
                className="mt-2 h-9 px-4 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus" /> Tạo quy trình đầu tiên
              </button>
            </div>
          )}

          {/* Table */}
          {!loading && list.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 tracking-wide uppercase">
                    <th className="px-5 py-3 text-left">Tên quy trình</th>
                    <th className="px-5 py-3 text-left">Hình thức</th>
                    <th className="px-5 py-3 text-center">Số bước</th>
                    <th className="px-5 py-3 text-left">Trạng thái</th>
                    <th className="px-5 py-3 text-left">Ngày tạo</th>
                    <th className="px-5 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((qt) => (
                    <tr
                      key={qt.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800">
                          {qt.ten}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {qt.id}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${HT_BADGE[qt.hinhThuc] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {qt.hinhThuc}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {qt.buocList.length}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          bước
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${qt.trangThai === "Đang hoạt động" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {qt.trangThai}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(qt.ngayTao).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Chỉnh sửa"
                            onClick={() =>
                              navigate(`/lap-quy-trinh?id=${qt.id}`)
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <i className="fa-solid fa-pen text-xs" />
                          </button>
                          <button
                            title={
                              qt.trangThai === "Đang hoạt động"
                                ? "Tắt quy trình"
                                : "Kích hoạt"
                            }
                            onClick={() => handleToggle(qt)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${qt.trangThai === "Đang hoạt động" ? "text-slate-500 hover:bg-slate-100" : "text-emerald-500 hover:bg-emerald-50"}`}
                          >
                            <i
                              className={`fa-solid ${qt.trangThai === "Đang hoạt động" ? "fa-toggle-on" : "fa-toggle-off"} text-xs`}
                            />
                          </button>
                          <button
                            title="Xóa"
                            onClick={() => setDeleteTarget(qt)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <i className="fa-solid fa-trash text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-triangle-exclamation text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Xóa quy trình
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bạn có chắc muốn xóa quy trình "
                  <strong>{deleteTarget.ten}</strong>"? Hành động này không thể
                  hoàn tác.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="h-9 px-5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
