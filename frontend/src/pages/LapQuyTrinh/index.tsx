import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { WorkflowStepDraft, StepModalContext, ParallelGroupDraft, ParallelBranchDraft } from "./workflowDesignerTypes";
import type { StepFormData } from "./components/StepFormModal";
import type { StepLibraryEntry } from "./stepLibrary";
import WorkflowPreview from "./components/WorkflowPreview";
import type { WorkflowTemplatePreview, WorkflowTemplateSummary } from "@/services/workflowApi";
import {
  getWorkflowTemplates, previewWorkflowTemplate, generateWorkflowFromTemplate,
  getWorkflowById,
  getWorkflowDesignSteps, getWorkflowTransitions, getParallelGroups,
  deleteWorkflowStep, cloneWorkflowStep, updateWorkflowStep,
  insertStepAfter, createWorkflowStep, reorderWorkflowSteps,
  createParallelGroup, createParallelBranch, updateParallelGroup, updateParallelBranch, deleteParallelGroup,
} from "@/services/workflowApi";
import { previewToWorkflowDraft, templateSummaryToInfo, mapLoaiBuocToUi, mapLoaiBuocToBackend, mapLoaiHanToUi, mapLoaiHanToBackend, mapHuongXuLyToUi, mapDieuKienHopNhatToUi } from "./workflowDesignerMappers";
import http from "@/util/http";
import TemplateSelectorCard from "./components/TemplateSelectorCard";
import TemplatePreviewModal from "./components/TemplatePreviewModal";
import WorkflowStepList from "./components/WorkflowStepList";
import StepFormModal, { emptyStepForm } from "./components/StepFormModal";
import type { LoaiBuocUI } from "./workflowDesignerTypes";
import { LOAI_HINH_DAU_THAU } from "./components/constants";
import StepLibraryModal from "./components/StepLibraryModal";
import DeleteStepConfirmModal from "./components/DeleteStepConfirmModal";
import LeaveConfirmModal from "./components/LeaveConfirmModal";
import type { TemplateInfo } from "./workflowDesignerTypes";

function loaiHinhToId(ten: string): number | undefined {
  const idx = LOAI_HINH_DAU_THAU.indexOf(ten as any);
  return idx >= 0 ? idx + 1 : undefined;
}

let _idCounter = 0;
function nextId(): string {
  _idCounter += 1;
  return `draft_${Date.now()}_${_idCounter}`;
}

export default function LapQuyTrinh() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEdit = !!editId;

  /* ── Form state ── */
  const [tenQuyTrinh, setTenQuyTrinh] = useState("");
  const [tenErr, setTenErr] = useState("");
  const [loaiHinh, setLoaiHinh] = useState("");
  const [loaiHinhErr, setLoaiHinhErr] = useState("");
  const [buocList, setBuocList] = useState<WorkflowStepDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  /* ── Template state ── */
  const [templateList, setTemplateList] = useState<WorkflowTemplateSummary[]>([]);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const templateInfoRaw = templateList[selectedTemplateIdx] ?? null;
  const templateInfo: TemplateInfo | null = templateInfoRaw
    ? templateSummaryToInfo({ ...templateInfoRaw, loaiHinhDauThau: templateInfoRaw.loaiHinhDauThau ?? loaiHinh })
    : null;
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [previewData, setPreviewData] = useState<WorkflowTemplatePreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generatedWorkflowId, setGeneratedWorkflowId] = useState<number | undefined>();

  /* ── Dirty tracking ── */
  const [isDirty, setIsDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);

  /* ── Parallel group state ── */
  const [parallelGroups, setParallelGroups] = useState<ParallelGroupDraft[]>([]);

  /* ── Modal state ── */
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<StepModalContext>({ type: "main" });
  const [editTargetIdx, setEditTargetIdx] = useState<number | undefined>();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [newStepForm, setNewStepForm] = useState<StepFormData>(emptyStepForm());
  const [newStepErrs, setNewStepErrs] = useState<Partial<Record<keyof StepFormData, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<WorkflowStepDraft | null>(null);
  const [deletingStep, setDeletingStep] = useState(false);

  /* ── Load existing if editing ── */
  useEffect(() => {
    if (editId) {
      const wfId = parseInt(editId);
      if (!isNaN(wfId)) {
        setGeneratedWorkflowId(wfId);
        getWorkflowById(wfId)
          .then((wf) => {
            setTenQuyTrinh(wf.tenWorkflow);
            setLoaiHinh(wf.loaiHinhDauThau || '');
          })
          .catch(() => {
            toast.error("Không tìm thấy quy trình");
            navigate("/danh-sach-quy-trinh");
          });
        // Load steps + transitions + parallel groups in parallel
        Promise.all([
          getWorkflowDesignSteps(wfId),
          getWorkflowTransitions(wfId),
          getParallelGroups(wfId).catch(() => [] as any[]),
        ])
          .then(([dtos, transitions, pgDtos]) => {
            const nextByStep = new Map<number, string>();
            transitions.forEach((t: any) => {
              if (t.hanhDong === "DUYET") nextByStep.set(t.tuBuocId, `be_${t.denBuocId}`);
            });

            // Build branch ID map: backend branch id → draft id
            const branchMap = new Map<number, string>();
            pgDtos.forEach((pg: any) => {
              (pg.branches || []).forEach((b: any) => {
                branchMap.set(b.id, `branch_${b.id}`);
              });
            });

            const steps: WorkflowStepDraft[] = dtos.map((dto) => ({
              id: `be_${dto.id}`,
              backendId: dto.id,
              maBuoc: dto.maBuoc ?? "",
              tenBuoc: dto.tenBuoc,
              loaiBuoc: mapLoaiBuocToUi(dto.loaiBuoc),
              thuTu: dto.thuTu,
              nhomGiaiDoan: dto.nhomGiaiDoan ?? undefined,
              moTa: dto.moTa ?? undefined,
              donViPhuTrach: String(dto.donViXuLyId ?? ""),
              vaiTroXuLy: "",
              slaNgay: dto.soNgayLapHoSo,
              loaiThoiHan: mapLoaiHanToUi(dto.loaiHan),
              coKyDuyet: dto.vaiTroKyDuyetId != null,
              donViKyHoSo: dto.donViKyHoSoId != null ? String(dto.donViKyHoSoId) : undefined,
              vaiTroKyDuyet: "",
              soNgayKyDuyet: dto.soNgayXuLy > 0 ? dto.soNgayXuLy : undefined,
              buocTiepTheoId: nextByStep.get(dto.id) ?? "",
              huongXuLyKhongDuyet: mapHuongXuLyToUi(),
              batBuocGhiChu: dto.batBuocGhiChu,
              batBuocTaiLieu: dto.batBuocTaiLieu,
              batBuocKyTruocChuyenBuoc: dto.batBuocKyTruocChuyenBuoc,
              batBuocDungSLA: dto.batBuocDungSLA,
              nhanhId: dto.nhanhWorkflowId ? branchMap.get(dto.nhanhWorkflowId) : undefined,
            }));
            setBuocList(steps);

            // Build parallel groups
            const groups: ParallelGroupDraft[] = pgDtos.map((pg: any) => {
              const groupId = `group_${pg.id}`;
              const branches = (pg.branches || []).map((b: any) => ({
                id: `branch_${b.id}`,
                backendId: b.id,
                tenNhanh: b.tenNhanh,
                stepIds: steps.filter((s) => s.nhanhId === `branch_${b.id}`).map((s) => s.id),
              }));
              return {
                id: groupId,
                backendId: pg.id,
                buocTachNhanhId: `be_${pg.buocTachNhanhId}`,
                dieuKienHopNhat: mapDieuKienHopNhatToUi(pg.dieuKienHopNhat),
                soNhanhHopNhatToiThieu: pg.soNhanhHopNhatToiThieu ?? 2,
                buocSauHopNhatId: pg.buocSauHopNhatId ? `be_${pg.buocSauHopNhatId}` : "",
                branches,
              };
            });
            setParallelGroups(groups);
          })
          .catch(() => toast.error("Không thể tải danh sách bước"));
      }
    }
  }, [editId, navigate]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  async function saveDraftWorkflow(hinhThucId?: number) {
    try {
      // 1. Create workflow
      const workflow = await createWorkflow({
        tenWorkflow: tenQuyTrinh.trim(),
        hinhThucId: hinhThucId ?? 1,
      });
      const newWorkflowId = workflow.id;

      // 2. Create steps in order, map draftId -> backendId
      const stepIdMap = new Map<string, number>(); // draftId -> backendId
      let thuTu = 1;
      for (const step of buocList.filter((s) => !s.nhanhId)) {
        const created = await createWorkflowStep(newWorkflowId, {
          maBuoc: step.maBuoc || `BUOC_${Date.now()}_${thuTu}`,
          tenBuoc: step.tenBuoc,
          loaiBuoc: mapLoaiBuocToBackend(step.loaiBuoc),
          thuTu: thuTu++,
          soNgayLapHoSo: step.slaNgay,
          soNgayXuLy: step.soNgayKyDuyet ?? 0,
          loaiHan: mapLoaiHanToBackend(step.loaiThoiHan),
          batBuocGhiChu: step.batBuocGhiChu,
          batBuocTaiLieu: step.batBuocTaiLieu,
          batBuocKyTruocChuyenBuoc: step.batBuocKyTruocChuyenBuoc,
          batBuocDungSLA: step.batBuocDungSLA,
          choPhepTuChoi: true,
          choPhepBoQua: false,
        });
        stepIdMap.set(step.id, created.id);
      }

      // 3. Create transitions (linear by default: step i -> step i+1)
      const mainSteps = buocList.filter((s) => !s.nhanhId);
      for (let i = 0; i < mainSteps.length - 1; i++) {
        const fromId = stepIdMap.get(mainSteps[i].id);
        const toId = stepIdMap.get(mainSteps[i + 1].id);
        if (fromId && toId) {
          await createWorkflowTransition(newWorkflowId, {
            tuBuocId: fromId,
            denBuocId: toId,
            hanhDong: "DUYET",
            dieuKienKichHoat: "LUON",
            batBuocGhiChu: false,
            batBuocTaiLieu: false,
          });
        }
      }

      // 4. Create parallel groups and branches
      for (const group of parallelGroups) {
        const splitStepBackendId = stepIdMap.get(group.buocTachNhanhId);
        const mergeStepBackendId = group.buocSauHopNhatId ? stepIdMap.get(group.buocSauHopNhatId) : undefined;

        if (!splitStepBackendId || !mergeStepBackendId) continue;

        const createdGroup = await createParallelGroup(newWorkflowId, {
          buocTachNhanhId: splitStepBackendId,
          tenNhom: `Nhóm song song`,
          dieuKienHopNhat: group.dieuKienHopNhat.toUpperCase() as any,
          buocSauHopNhatId: mergeStepBackendId,
        });

        for (const branch of group.branches) {
          await createParallelBranch(createdGroup.id, {
            maNhanh: `BR_${Date.now()}`,
            tenNhanh: branch.tenNhanh,
            thuTu: 1,
            thoiHanNgay: 1,
            loaiHan: "CANH_BAO",
            buocDauTienId: 0,
          });
        }
      }

      toast.success("Lưu quy trình thành công");
      setIsDirty(false);
      setSaving(false);
      setIsTemplateDraft(false);
      navigate("/danh-sach-quy-trinh");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Lưu quy trình thất bại");
      setSaving(false);
    }
  }

  function navWithCheck(path: string) {
    if (isDirty) { setPendingNavPath(path); setLeaveOpen(true); }
    else { navigate(path); }
  }

  function confirmLeave() {
    setIsDirty(false); setLeaveOpen(false);
    if (pendingNavPath) navigate(pendingNavPath);
  }

  /* ── Template handlers ── */
  async function handleLoaiHinhChange(value: string) {
    setLoaiHinh(value); setLoaiHinhErr(""); setPreviewData(null);
    setSelectedTemplateIdx(0);
    markDirty();
    if (!value) { setTemplateList([]); return; }
    setLoadingTemplate(true);
    try {
      const templates = await getWorkflowTemplates(value);
      setTemplateList(templates);
    } catch { toast.error("Không thể tải quy trình chuẩn."); }
    finally { setLoadingTemplate(false); }
  }

  async function handlePreview() {
    if (!templateInfoRaw) return;
    setPreviewLoading(true); setPreviewOpen(true);
    try { setPreviewData(await previewWorkflowTemplate(templateInfoRaw.id)); }
    catch { toast.error("Không thể tải preview."); setPreviewOpen(false); }
    finally { setPreviewLoading(false); }
  }

  async function handleGenerate() {
    const e = validateTen(tenQuyTrinh); setTenErr(e);
    if (e) return;
    if (!loaiHinh) { setLoaiHinhErr("Vui lòng chọn loại hình đấu thầu"); return; }
    if (!templateInfoRaw) { toast.error("Chưa có quy trình chuẩn."); return; }

    setSaving(true); setSaveErr("");
    try {
      const templates = await getWorkflowTemplates(loaiHinh);
      const selectedTemplate = templates.find((t) => t.id === templateInfoRaw.id) ?? templates[0];
      if (!selectedTemplate || selectedTemplate.soBuoc <= 0) {
        setTemplateList(templates);
        setSelectedTemplateIdx(0);
        toast.error("Không có quy trình chuẩn hợp lệ cho loại hình này.");
        return;
      }

      const selectedIdx = templates.findIndex((t) => t.id === selectedTemplate.id);
      setTemplateList(templates);
      setSelectedTemplateIdx(selectedIdx >= 0 ? selectedIdx : 0);

      // Preview only — no DB write until user clicks "Lưu quy trình"
      const result = await previewWorkflowTemplate(selectedTemplate.id);
      const draft = previewToWorkflowDraft(result, loaiHinh, { preserveBackendIds: false });
      setGeneratedWorkflowId(undefined);
      setIsTemplateDraft(true);
      setBuocList(draft.steps);
      setParallelGroups(draft.parallelGroups);
      setIsDirty(true);
      toast.success("Đã tạo bản nháp từ template. Bấm Lưu quy trình để ghi vào DB.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Tạo quy trình thất bại");
    } finally {
      setSaving(false);
    }
  }

  function validateTen(val: string): string {
    const t = val.trim();
    if (!t) return "Vui lòng nhập tên quy trình";
    if (t.length < 3) return "Tên quy trình tối thiểu 3 ký tự";
    if (t.length > 255) return "Tên quy trình không được vượt quá 255 ký tự";
    return "";
  }

  /* ── Step actions ── */

  async function reloadSteps() {
    if (!generatedWorkflowId) return;
    try {
      const previousByBackendId = new Map(
        buocList
          .filter((step) => step.backendId != null)
          .map((step) => [step.backendId as number, step] as const)
      );
      const [dtos, transitions, pgDtos] = await Promise.all([
        getWorkflowDesignSteps(generatedWorkflowId),
        getWorkflowTransitions(generatedWorkflowId).catch(() => []),
        getParallelGroups(generatedWorkflowId).catch(() => [] as any[]),
      ]);
      const nextByStep = new Map<number, string>();
      transitions.forEach((t: any) => {
        if (t.hanhDong === "DUYET") nextByStep.set(t.tuBuocId, `be_${t.denBuocId}`);
      });
      const branchMap = new Map<number, string>();
      pgDtos.forEach((pg: any) => {
        (pg.branches || []).forEach((b: any) => {
          branchMap.set(b.id, `branch_${b.id}`);
        });
      });
      const steps: WorkflowStepDraft[] = dtos.map((dto) => ({
        id: `be_${dto.id}`,
        backendId: dto.id,
        maBuoc: dto.maBuoc ?? "", tenBuoc: dto.tenBuoc,
        loaiBuoc: mapLoaiBuocToUi(dto.loaiBuoc), thuTu: dto.thuTu,
        nhomGiaiDoan: dto.nhomGiaiDoan ?? undefined, moTa: dto.moTa ?? undefined,
        donViPhuTrach: String(dto.donViXuLyId ?? ""), vaiTroXuLy: "",
        slaNgay: dto.soNgayLapHoSo, loaiThoiHan: mapLoaiHanToUi(dto.loaiHan),
        coKyDuyet: dto.vaiTroKyDuyetId != null,
        donViKyHoSo: dto.donViKyHoSoId != null ? String(dto.donViKyHoSoId) : undefined,
        vaiTroKyDuyet: "", soNgayKyDuyet: dto.soNgayXuLy > 0 ? dto.soNgayXuLy : undefined,
        buocTiepTheoId: nextByStep.get(dto.id) ?? "",
        huongXuLyKhongDuyet: mapHuongXuLyToUi(),
        batBuocGhiChu: dto.batBuocGhiChu, batBuocTaiLieu: dto.batBuocTaiLieu,
        batBuocKyTruocChuyenBuoc: dto.batBuocKyTruocChuyenBuoc, batBuocDungSLA: dto.batBuocDungSLA,
        nhanhId: dto.nhanhWorkflowId ? branchMap.get(dto.nhanhWorkflowId) : undefined,
      })).map((step) => {
        const prev = previousByBackendId.get(step.backendId!);
        if (!prev) return step;
        return {
          ...prev,
          ...step,
          nhanhId: step.nhanhId ?? prev.nhanhId,
          buocTiepTheoId: step.buocTiepTheoId || prev.buocTiepTheoId,
        };
      });
      setBuocList(steps);
      setParallelGroups(pgDtos.map((pg: any) => ({
        id: `group_${pg.id}`,
        backendId: pg.id,
        buocTachNhanhId: `be_${pg.buocTachNhanhId}`,
        dieuKienHopNhat: mapDieuKienHopNhatToUi(pg.dieuKienHopNhat),
        soNhanhHopNhatToiThieu: pg.soNhanhHopNhatToiThieu ?? 2,
        buocSauHopNhatId: pg.buocSauHopNhatId ? `be_${pg.buocSauHopNhatId}` : "",
        branches: (pg.branches || []).map((b: any) => ({
          id: `branch_${b.id}`,
          backendId: b.id,
          tenNhanh: b.tenNhanh,
          stepIds: steps.filter((s) => s.nhanhId === `branch_${b.id}`).map((s) => s.id),
        })),
      })));
    } catch { toast.error("Không thể tải lại danh sách bước"); }
  }
  function syncReorder(next: WorkflowStepDraft[]) {
    if (!generatedWorkflowId) return;
    const realSteps = next.filter((s) => s.backendId);
    if (realSteps.length !== next.length) return;
    reorderWorkflowSteps(generatedWorkflowId, {
      steps: realSteps.map((s, idx) => ({ id: s.backendId!, thuTu: idx + 1 })),
    }).catch(() => toast.error("Lưu thứ tự bước thất bại"));
  }

  function handleMoveUp(idx: number) {
    if (idx === 0) return;
    setBuocList((prev) => {
      const n = [...prev];
      [n[idx-1], n[idx]] = [n[idx], n[idx-1]];
      syncReorder(n);
      return n;
    });
    markDirty();
  }
  function handleMoveDown(idx: number) {
    if (idx === buocList.length - 1) return;
    setBuocList((prev) => {
      const n = [...prev];
      [n[idx], n[idx+1]] = [n[idx+1], n[idx]];
      syncReorder(n);
      return n;
    });
    markDirty();
  }

  function handleOpenEdit(idx: number) {
    const step = buocList[idx];
    if (!step) return;
    setEditTargetIdx(idx);
    setModalContext(step.nhanhId ? { type: "branch", branchId: step.nhanhId } : { type: "main" });
    setNewStepForm({
      tenBuoc: step.tenBuoc,
      loaiBuoc: step.loaiBuoc,
      moTa: step.moTa ?? "",
      donViPhuTrach: step.donViPhuTrach,
      vaiTroXuLy: step.vaiTroXuLy,
      slaNgay: step.slaNgay,
      loaiThoiHan: step.loaiThoiHan,
      coKyDuyet: step.coKyDuyet,
      donViKyHoSo: step.donViKyHoSo ?? "",
      vaiTroKyDuyet: step.vaiTroKyDuyet ?? "",
      soNgayKyDuyet: step.soNgayKyDuyet,
      huongXuLyKhongDuyet: step.huongXuLyKhongDuyet,
      batBuocGhiChu: step.batBuocGhiChu,
      batBuocTaiLieu: step.batBuocTaiLieu,
      batBuocKyTruocChuyenBuoc: step.batBuocKyTruocChuyenBuoc,
      batBuocDungSLA: step.batBuocDungSLA,
    });
    setNewStepErrs({});
    setStepModalOpen(true);
  }

  function handleDeleteTarget(step: WorkflowStepDraft) {
    if (!isTemplateDraft && (step.loaiBuoc === "Bắt đầu" || step.loaiBuoc === "Kết thúc")) {
      toast.error("Không thể xóa bước bắt đầu/kết thúc");
      return;
    }
    if (step.nhanhId) {
      const branchStepCount = buocList.filter((s) => s.nhanhId === step.nhanhId).length;
      if (branchStepCount <= 1) {
        toast.error("KhÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ nhÃ¡nh song song rÃ´ng");
        return;
      }
    }
    setDeleteTarget(step);
  }

  function removeStepFromState(stepId: string) {
    setBuocList((prev) => prev.filter((x) => x.id !== stepId));
    setParallelGroups((prev) => prev.map((g) => ({
      ...g,
      branches: g.branches.map((b) => ({
        ...b,
        stepIds: b.stepIds.filter((id) => id !== stepId),
      })),
    })));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const step = deleteTarget;
    const beId = step.backendId;
    setDeletingStep(true);
    try {
      if (beId) {
        await deleteWorkflowStep(beId);
      }
      removeStepFromState(step.id);
      setDeleteTarget(null);
      markDirty();
    } catch {
      toast.error("Xoa tren server that bai");
      await reloadSteps();
      setDeletingStep(false);
      return;
    }
    setDeletingStep(false);
    toast.success("Da xoa buoc");
    return;
  }

  function handleClone(step: WorkflowStepDraft) {
    const newMaBuoc = `BUOC_${Date.now()}_${nextId()}`;
    const beId = step.backendId;
    if (beId && generatedWorkflowId) {
      cloneWorkflowStep(generatedWorkflowId, beId, { maBuocMoi: newMaBuoc, tenBuocMoi: step.tenBuoc + " (sao chép)" })
        .then((createdStep) => {
          const sourceIdx = buocList.findIndex((s) => s.id === step.id);
          const clonedDraft = hydrateClonedStep(step, createdStep);
          setBuocList((prev) => {
            const next = [...prev];
            const insertAt = sourceIdx >= 0 ? sourceIdx + 1 : next.length;
            next.splice(insertAt, 0, clonedDraft);
            return next;
          });
          if (step.nhanhId) {
            setParallelGroups((prev) => prev.map((g) => ({
              ...g,
              branches: g.branches.map((b) => {
                if (b.id !== step.nhanhId) return b;
                const idx = b.stepIds.indexOf(step.id);
                if (idx === -1) return { ...b, stepIds: [...b.stepIds, clonedDraft.id] };
                const nextIds = [...b.stepIds];
                nextIds.splice(idx + 1, 0, clonedDraft.id);
                return { ...b, stepIds: nextIds };
              }),
            })));
          }
          return reloadSteps();
        })
        .catch(() => toast.error("Nhân bản thất bại"));
      return;
    }
    const clonedLocal = {
      ...step,
      id: nextId(),
      maBuoc: newMaBuoc,
      tenBuoc: step.tenBuoc + " (sao chép)",
    };
    setBuocList((prev) => {
      const sourceIdx = prev.findIndex((s) => s.id === step.id);
      const next = [...prev];
      const insertAt = sourceIdx >= 0 ? sourceIdx + 1 : next.length;
      next.splice(insertAt, 0, clonedLocal);
      return next;
    });
    if (step.nhanhId) {
      setParallelGroups((prev) => prev.map((g) => ({
        ...g,
        branches: g.branches.map((b) => {
          if (b.id !== step.nhanhId) return b;
          const idx = b.stepIds.indexOf(step.id);
          if (idx === -1) return { ...b, stepIds: [...b.stepIds, clonedLocal.id] };
          const nextIds = [...b.stepIds];
          nextIds.splice(idx + 1, 0, clonedLocal.id);
          return { ...b, stepIds: nextIds };
        }),
      })));
    }
    markDirty();
    toast.success("Đã nhân bản bước");
  }

  function handleInsertAfter(step: WorkflowStepDraft) {
    setModalContext({ type: "main", afterStepId: step.id });
    setEditTargetIdx(undefined);
    setNewStepForm(emptyStepForm());
    setNewStepErrs({});
    setStepModalOpen(true);
  }

  function buildStepCreatePayload(
    form: StepFormData,
    thuTu: number,
    options?: { nhanhWorkflowId?: number }
  ) {
    return {
      maBuoc: `BUOC_${Date.now()}`,
      tenBuoc: form.tenBuoc,
      loaiBuoc: mapLoaiBuocToBackend(form.loaiBuoc),
      thuTu,
      soNgayLapHoSo: form.slaNgay,
      soNgayXuLy: form.soNgayKyDuyet ?? 0,
      loaiHan: mapLoaiHanToBackend(form.loaiThoiHan),
      laBuocJoin: false,
      moTa: form.moTa || undefined,
      batBuocGhiChu: form.batBuocGhiChu,
      batBuocTaiLieu: form.batBuocTaiLieu,
      batBuocKyTruocChuyenBuoc: form.batBuocKyTruocChuyenBuoc,
      batBuocDungSLA: form.batBuocDungSLA,
      choPhepTuChoi: true,
      choPhepBoQua: false,
      nhanhWorkflowId: options?.nhanhWorkflowId,
    };
  }

  function hydrateCreatedStep(step: WorkflowStepDraft, createdStep: any): WorkflowStepDraft {
    return {
      ...step,
      backendId: createdStep.id,
      maBuoc: createdStep.maBuoc || step.maBuoc,
      tenBuoc: createdStep.tenBuoc || step.tenBuoc,
      loaiBuoc: mapLoaiBuocToUi(createdStep.loaiBuoc),
      thuTu: createdStep.thuTu ?? step.thuTu,
    };
  }

  function hydrateClonedStep(sourceStep: WorkflowStepDraft, createdStep: any): WorkflowStepDraft {
    return {
      ...hydrateCreatedStep(
        {
          ...sourceStep,
          id: nextId(),
          maBuoc: createdStep.maBuoc || sourceStep.maBuoc,
          tenBuoc: createdStep.tenBuoc || `${sourceStep.tenBuoc} (sao chép)`,
        },
        createdStep
      ),
      nhanhId: sourceStep.nhanhId,
      buocTiepTheoId: sourceStep.buocTiepTheoId,
    };
  }

  /* ── Parallel group handlers ── */
  async function handleCreateParallel(step: WorkflowStepDraft) {
    const existing = parallelGroups.find((g) => g.buocTachNhanhId === step.id);
    if (existing) { toast.info("Đã có nhánh song song cho bước này"); return; }
    const groupId = nextId();
    const newGroup: ParallelGroupDraft = {
      id: groupId,
      buocTachNhanhId: step.id,
      dieuKienHopNhat: "all",
      soNhanhHopNhatToiThieu: 2,
      buocSauHopNhatId: "",
      branches: [],
    };
    setParallelGroups((prev) => [...prev, newGroup]);
    markDirty();

    // Find default merge step — next step after split in the list
    const splitIdx = buocList.findIndex((s) => s.id === step.id);
    const defaultMergeStep = splitIdx >= 0 && splitIdx < buocList.length - 1 ? buocList[splitIdx + 1] : undefined;

    if (generatedWorkflowId && step.backendId && defaultMergeStep?.backendId) {
      try {
        const created = await createParallelGroup(generatedWorkflowId, {
          buocTachNhanhId: step.backendId,
          tenNhom: `Nhóm song song`,
          dieuKienHopNhat: "ALL",
          buocSauHopNhatId: defaultMergeStep.backendId,
        });
        // Store backendId on group
        setParallelGroups((prev) => prev.map((g) =>
          g.id === groupId ? { ...g, backendId: created.id, buocSauHopNhatId: defaultMergeStep.id } : g
        ));
      } catch { /* keep local draft */ }
    }
    toast.success("Đã tạo nhánh song song");
  }

  function handleUpdateGroup(group: ParallelGroupDraft) {
    setParallelGroups((prev) => prev.map((g) => g.id === group.id ? group : g));
    markDirty();

    // API sync: if group has backendId and merge step changed, update
    if (generatedWorkflowId && group.backendId && group.buocSauHopNhatId) {
      const mergeStep = buocList.find((s) => s.id === group.buocSauHopNhatId);
      if (mergeStep?.backendId) {
        updateParallelGroup(generatedWorkflowId, group.backendId, {
          dieuKienHopNhat: group.dieuKienHopNhat.toUpperCase() as any,
          buocSauHopNhatId: mergeStep.backendId,
        }).catch(() => {});
      }
    }
  }

  function handleDeleteGroup(groupId: string) {
    const targetGroup = parallelGroups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    const branchIds = new Set(targetGroup.branches.map((b) => b.id));
    setParallelGroups((prev) => prev.filter((g) => g.id !== groupId));
    setBuocList((prev) => prev.filter((s) => !s.nhanhId || !branchIds.has(s.nhanhId)));
    markDirty();

    if (generatedWorkflowId && targetGroup.backendId) {
      deleteParallelGroup(generatedWorkflowId, targetGroup.backendId)
        .catch(() => {
          toast.error("Xóa nhánh song song trên server thất bại");
          reloadSteps();
        });
    }
  }

  async function handleAddBranch(groupId: string) {
    const group = parallelGroups.find((g) => g.id === groupId);
    if (!group) return;
    const bi = group.branches.length;
    const branchId = nextId();
    const newBranch: ParallelBranchDraft = {
      id: branchId,
      tenNhanh: `Nhánh ${bi + 1}`,
      stepIds: [],
    };
    setParallelGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, branches: [...g.branches, newBranch] } : g));
    markDirty();
  }

  function handleRemoveBranch(groupId: string, branchId: string) {
    const group = parallelGroups.find((g) => g.id === groupId);
    const branch = group?.branches.find((b) => b.id === branchId);
    if (!isTemplateDraft && branch?.backendId && generatedWorkflowId) {
      deleteParallelBranch(branch.backendId).catch(() => {});
    }
    setParallelGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, branches: g.branches.filter((b) => b.id !== branchId) } : g));
    markDirty();
  }

  async function handleAddBranch(groupId: string) {
    const group = parallelGroups.find((g) => g.id === groupId);
    if (!group) return;
    const bi = group.branches.length;
    const branchId = nextId();
    const newBranch: ParallelBranchDraft = {
      id: branchId,
      tenNhanh: `Nhánh ${bi + 1}`,
      stepIds: [],
    };
    setParallelGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, branches: [...g.branches, newBranch] } : g));
    markDirty();

    if (!isTemplateDraft && generatedWorkflowId && group.backendId) {
      try {
        const created = await createParallelBranch(group.backendId, {
          maNhanh: `BR_${Date.now()}`,
          tenNhanh: newBranch.tenNhanh,
          thuTu: bi + 1,
          thoiHanNgay: 1,
          loaiHan: "CANH_BAO",
          buocDauTienId: 0,
        });
        // Store backendId on branch
        setParallelGroups((prev) => prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                branches: g.branches.map((b) =>
                  b.id === branchId ? { ...b, backendId: created.id } : b
                ),
              }
            : g
        ));
      } catch { /* keep local draft */ }
    }
    toast.success("Đã thêm nhánh");
  }

  function handleAddStepToBranch(branchId: string, afterStepId?: string) {
    setModalContext({ type: "branch", branchId, afterStepId });
    setEditTargetIdx(undefined);
    setNewStepForm(emptyStepForm());
    setNewStepErrs({});
    setStepModalOpen(true);
  }

  function handleNewStepSave() {
    const errs: Partial<Record<keyof StepFormData, string>> = {};
    if (!newStepForm.tenBuoc.trim()) errs.tenBuoc = "Vui lòng nhập tên bước";
    if (!newStepForm.donViPhuTrach) errs.donViPhuTrach = "Vui lòng chọn đơn vị phụ trách";
    if (!newStepForm.vaiTroXuLy) errs.vaiTroXuLy = "Vui lòng chọn vai trò xử lý";
    if (newStepForm.slaNgay < 0) errs.slaNgay = ">= 0";
    if (newStepForm.coKyDuyet && !newStepForm.vaiTroKyDuyet) errs.vaiTroKyDuyet = "Chọn vai trò ký duyệt";
    setNewStepErrs(errs);
    if (Object.keys(errs).length > 0) return;

    const canChooseSpecialLoaiBuoc = editTargetIdx !== undefined || (!generatedWorkflowId && modalContext.type === "main" && !modalContext.afterStepId);
    const loaiBuocUI = canChooseSpecialLoaiBuoc ? newStepForm.loaiBuoc : "Thường";
    const stepFormToPersist: StepFormData = { ...newStepForm, loaiBuoc: loaiBuocUI };
    const isBranch = modalContext.type === "branch";
    const newStep: WorkflowStepDraft = {
      id: nextId(), maBuoc: "", tenBuoc: newStepForm.tenBuoc, loaiBuoc: loaiBuocUI,
      thuTu: 0, moTa: newStepForm.moTa || undefined, nhomGiaiDoan: undefined,
      donViPhuTrach: newStepForm.donViPhuTrach, vaiTroXuLy: newStepForm.vaiTroXuLy,
      slaNgay: newStepForm.slaNgay, loaiThoiHan: newStepForm.loaiThoiHan,
      coKyDuyet: newStepForm.coKyDuyet,
      donViKyHoSo: newStepForm.donViKyHoSo || undefined,
      vaiTroKyDuyet: newStepForm.vaiTroKyDuyet || undefined,
      soNgayKyDuyet: newStepForm.soNgayKyDuyet, buocTiepTheoId: "",
      huongXuLyKhongDuyet: newStepForm.huongXuLyKhongDuyet,
      batBuocGhiChu: newStepForm.batBuocGhiChu, batBuocTaiLieu: newStepForm.batBuocTaiLieu,
      batBuocKyTruocChuyenBuoc: newStepForm.batBuocKyTruocChuyenBuoc,
      batBuocDungSLA: newStepForm.batBuocDungSLA,
      nhanhId: isBranch ? modalContext.branchId : undefined,
    };

    if (editTargetIdx !== undefined) {
      const oldStep = buocList[editTargetIdx];
      const branchBackendId = oldStep.nhanhId
        ? parallelGroups.flatMap((g) => g.branches).find((b) => b.id === oldStep.nhanhId)?.backendId
        : undefined;
      const updatedStep: WorkflowStepDraft = {
        ...newStep,
        id: oldStep.id,
        backendId: oldStep.backendId,
        maBuoc: oldStep.maBuoc,
        thuTu: oldStep.thuTu,
        nhanhId: oldStep.nhanhId,
        buocTiepTheoId: oldStep.buocTiepTheoId,
      };
      setBuocList((prev) => prev.map((s, i) => i === editTargetIdx ? updatedStep : s));
      if (oldStep.backendId) {
        updateWorkflowStep(oldStep.backendId, {
          tenBuoc: stepFormToPersist.tenBuoc,
          loaiBuoc: mapLoaiBuocToBackend(stepFormToPersist.loaiBuoc),
          soNgayLapHoSo: stepFormToPersist.slaNgay,
          loaiHan: mapLoaiHanToBackend(stepFormToPersist.loaiThoiHan),
          batBuocGhiChu: stepFormToPersist.batBuocGhiChu,
          batBuocTaiLieu: stepFormToPersist.batBuocTaiLieu,
          batBuocKyTruocChuyenBuoc: stepFormToPersist.batBuocKyTruocChuyenBuoc,
          batBuocDungSLA: stepFormToPersist.batBuocDungSLA,
          nhanhWorkflowId: branchBackendId,
        }).catch(() => toast.error("Cập nhật server thất bại"));
      }
      toast.success("Đã cập nhật bước");
    } else if (isBranch) {
      const branchAfterStepId = modalContext.afterStepId;
      const branch = parallelGroups.flatMap((g) => g.branches).find((b) => b.id === modalContext.branchId);
      const group = parallelGroups.find((g) => g.branches.some((b) => b.id === modalContext.branchId));
      const branchSteps = buocList.filter((s) => s.nhanhId === modalContext.branchId);
      const anchorStepId = branchAfterStepId || branchSteps[branchSteps.length - 1]?.id;
      const anchorStep = anchorStepId ? buocList.find((s) => s.id === anchorStepId) : undefined;
      setBuocList((prev) => {
        if (!branchAfterStepId) return [...prev, newStep]; // append to end
        const idx = prev.findIndex((s) => s.id === branchAfterStepId);
        if (idx === -1) return [...prev, newStep];
        const copy = [...prev];
        copy.splice(idx + 1, 0, newStep);
        return copy;
      });
      setParallelGroups((prev) => prev.map((g) => ({
        ...g,
        branches: g.branches.map((b) => {
          if (b.id !== modalContext.branchId) return b;
          // Insert stepId at correct position in branch
          const existingBranchSteps = buocList.filter((s) => s.nhanhId === b.id);
          if (!branchAfterStepId || existingBranchSteps.length === 0) {
            return { ...b, stepIds: [...b.stepIds, newStep.id] };
          }
          const stepIdx = b.stepIds.indexOf(branchAfterStepId);
          if (stepIdx === -1) return { ...b, stepIds: [...b.stepIds, newStep.id] };
          const newStepIds = [...b.stepIds];
          newStepIds.splice(stepIdx + 1, 0, newStep.id);
          return { ...b, stepIds: newStepIds };
        }),
      })));
      if (generatedWorkflowId) {
        const persistBranchStep = async () => {
          if (anchorStep?.backendId) {
            const createdStep = await insertStepAfter(generatedWorkflowId, anchorStep.backendId, {
              maBuoc: `BUOC_${Date.now()}`,
              tenBuoc: stepFormToPersist.tenBuoc,
              loaiBuoc: mapLoaiBuocToBackend(stepFormToPersist.loaiBuoc),
              soNgayLapHoSo: stepFormToPersist.slaNgay,
              soNgayXuLy: stepFormToPersist.soNgayKyDuyet ?? 0,
              loaiHan: mapLoaiHanToBackend(stepFormToPersist.loaiThoiHan),
              createDefaultTransition: true,
              batBuocGhiChu: stepFormToPersist.batBuocGhiChu,
              batBuocTaiLieu: stepFormToPersist.batBuocTaiLieu,
              batBuocKyTruocChuyenBuoc: stepFormToPersist.batBuocKyTruocChuyenBuoc,
              batBuocDungSLA: stepFormToPersist.batBuocDungSLA,
            });
            setBuocList((prev) => prev.map((s) => s.id === newStep.id ? {
              ...s,
              backendId: createdStep.id,
              maBuoc: createdStep.maBuoc || s.maBuoc,
              thuTu: createdStep.thuTu,
              tenBuoc: createdStep.tenBuoc,
              loaiBuoc: mapLoaiBuocToUi(createdStep.loaiBuoc),
            } : s));
            return;
          }

          const createdStep = await createWorkflowStep(
            generatedWorkflowId,
            buildStepCreatePayload(stepFormToPersist, buocList.length + 1, {
              nhanhWorkflowId: branch?.backendId,
            })
          );

          const branchBackendId = branch?.backendId;
          if (branchBackendId) {
            await updateParallelBranch(branchBackendId, { buocDauTienId: createdStep.id });
            setBuocList((prev) => prev.map((s) => s.id === newStep.id ? {
              ...s,
              backendId: createdStep.id,
              maBuoc: createdStep.maBuoc || s.maBuoc,
              thuTu: createdStep.thuTu,
              tenBuoc: createdStep.tenBuoc,
              loaiBuoc: mapLoaiBuocToUi(createdStep.loaiBuoc),
            } : s));
            return;
          }

          if (!group?.backendId) {
            throw new Error("Parallel group is not synchronized");
          }

          const branchOrder = group.branches.findIndex((b) => b.id === modalContext.branchId);
          const createdBranch = await createParallelBranch(group.backendId, {
            maNhanh: `BR_${Date.now()}`,
            tenNhanh: branch?.tenNhanh || `Nhánh ${group.branches.length}`,
            thuTu: branchOrder >= 0 ? branchOrder + 1 : group.branches.length,
            thoiHanNgay: 1,
            loaiHan: "CANH_BAO",
            buocDauTienId: createdStep.id,
          });

          await updateWorkflowStep(createdStep.id, {
            nhanhWorkflowId: createdBranch.id,
          });
          setParallelGroups((prev) => prev.map((g) => ({
            ...g,
            branches: g.branches.map((b) => b.id === modalContext.branchId ? { ...b, backendId: createdBranch.id } : b),
          })));
          setBuocList((prev) => prev.map((s) => s.id === newStep.id ? {
            ...s,
            backendId: createdStep.id,
            maBuoc: createdStep.maBuoc || s.maBuoc,
            thuTu: createdStep.thuTu,
            tenBuoc: createdStep.tenBuoc,
            loaiBuoc: mapLoaiBuocToUi(createdStep.loaiBuoc),
          } : s));
        };

        persistBranchStep()
          .then(() => {})
          .catch(() => toast.error("Thêm bước trên server thất bại"));
      }
      toast.success("Đã thêm bước vào nhánh");
    } else if (modalContext.type === "main" && modalContext.afterStepId) {
      const afterStep = buocList.find((s) => s.id === modalContext.afterStepId);
      setBuocList((prev) => {
        const idx = prev.findIndex((s) => s.id === modalContext.afterStepId);
        if (idx === -1) return [...prev, newStep];
        const copy = [...prev];
        copy.splice(idx + 1, 0, newStep);
        return copy;
      });
      if (generatedWorkflowId && afterStep?.backendId) {
        insertStepAfter(generatedWorkflowId, afterStep.backendId, {
          maBuoc: `BUOC_${Date.now()}`,
          tenBuoc: stepFormToPersist.tenBuoc,
          loaiBuoc: mapLoaiBuocToBackend(stepFormToPersist.loaiBuoc),
          soNgayLapHoSo: stepFormToPersist.slaNgay,
          soNgayXuLy: stepFormToPersist.soNgayKyDuyet ?? 0,
          loaiHan: mapLoaiHanToBackend(stepFormToPersist.loaiThoiHan),
          createDefaultTransition: true,
          batBuocGhiChu: stepFormToPersist.batBuocGhiChu,
          batBuocTaiLieu: stepFormToPersist.batBuocTaiLieu,
          batBuocKyTruocChuyenBuoc: stepFormToPersist.batBuocKyTruocChuyenBuoc,
          batBuocDungSLA: stepFormToPersist.batBuocDungSLA,
        })
          .then((createdStep) => {
            setBuocList((prev) => prev.map((s) => s.id === newStep.id ? hydrateCreatedStep(s, createdStep) : s));
            return reloadSteps();
          })
          .catch(() => toast.error("Thêm bước trên server thất bại"));
      }
      toast.success("Đã thêm bước");
    } else {
      setBuocList((prev) => [...prev, newStep]);
      if (generatedWorkflowId) {
        createWorkflowStep(generatedWorkflowId, buildStepCreatePayload(stepFormToPersist, buocList.length + 1))
          .then((createdStep) => {
            setBuocList((prev) => prev.map((s) => s.id === newStep.id ? hydrateCreatedStep(s, createdStep) : s));
            return reloadSteps();
          })
          .catch(() => toast.error("Thêm bước trên server thất bại"));
      }
      toast.success("Đã thêm bước");
    }

    if (isBranch) { setModalContext({ type: "main" }); }
    setStepModalOpen(false); setEditTargetIdx(undefined); setNewStepForm(emptyStepForm());
    markDirty();
  }

  function handleSave() {
    const e = validateTen(tenQuyTrinh); setTenErr(e);
    if (e) return;
    if (!buocList.length) { setSaveErr("Vui lòng thêm ít nhất 1 bước"); return; }
    const hasStart = buocList.some((b) => b.loaiBuoc === "Bắt đầu");
    const hasEnd = buocList.some((b) => b.loaiBuoc === "Kết thúc");
    if (!hasStart || !hasEnd) { setSaveErr("Quy trình cần 1 bước Bắt đầu và 1 bước Kết thúc."); return; }
    const sc = buocList.filter((b) => b.loaiBuoc === "Bắt đầu").length;
    const ec = buocList.filter((b) => b.loaiBuoc === "Kết thúc").length;
    if (sc > 1) { setSaveErr("Chỉ được 1 bước Bắt đầu."); return; }
    if (ec > 1) { setSaveErr("Chỉ được 1 bước Kết thúc."); return; }
    // Validate parallel groups
    for (const g of parallelGroups) {
      if (g.branches.length < 2) { setSaveErr(`Nhánh song song tại bước "${buocList.find((s) => s.id === g.buocTachNhanhId)?.tenBuoc ?? "?"}" cần ít nhất 2 nhánh.`); return; }
      const emptyBranches = g.branches.filter((b) => !buocList.some((s) => s.nhanhId === b.id));
      if (emptyBranches.length > 0) { setSaveErr(`Nhánh "${emptyBranches[0].tenNhanh}" chưa có bước nào.`); return; }
      if (!g.buocSauHopNhatId) { setSaveErr("Vui lòng chọn bước sau hợp nhất cho nhánh song song."); return; }
    }
    setSaveErr(""); setSaving(true);

    const hi = loaiHinhToId(loaiHinh);

    if (isTemplateDraft) {
      // Draft mode: create new workflow + all steps + transitions + parallel groups
      saveDraftWorkflow(hi);
      return;
    }

    const wid = isEdit && editId ? parseInt(editId) : generatedWorkflowId;
    if (!wid) { setSaveErr("Vui lòng tạo quy trình từ template trước."); setSaving(false); return; }
    const p: any = { tenWorkflow: tenQuyTrinh.trim() };
    if (hi) p.hinhThucId = hi;
    const req = http.put(`/workflows/${wid}`, p);
    req.then(() => { toast.success("Lưu thành công"); setIsDirty(false); setSaving(false); navigate("/danh-sach-quy-trinh"); })
       .catch(() => { toast.error("Lưu thất bại"); setSaving(false); });
  }

  function handleLibrarySelect(entry: StepLibraryEntry) {
    const loaiBuoc: LoaiBuocUI = (["Bắt đầu", "Thường", "Kết thúc"] as const).includes(entry.loaiBuoc as any)
      ? entry.loaiBuoc as LoaiBuocUI
      : "Thường";
    const canChooseSpecialLoaiBuoc = editTargetIdx !== undefined || (!generatedWorkflowId && modalContext.type === "main" && !modalContext.afterStepId);
    setNewStepForm({
      ...emptyStepForm(), tenBuoc: entry.tenBuoc, loaiBuoc: canChooseSpecialLoaiBuoc ? loaiBuoc : "Thường",
      donViPhuTrach: entry.donViPhuTrach ?? "", vaiTroXuLy: entry.vaiTroXuLy ?? "",
      slaNgay: entry.slaNgay ?? 1, loaiThoiHan: entry.loaiThoiHan ?? "Chỉ cảnh báo quá hạn",
      coKyDuyet: entry.coKyDuyet ?? false, donViKyHoSo: entry.donViKyHoSo ?? "",
      vaiTroKyDuyet: entry.vaiTroKyDuyet ?? "",
    });
    setNewStepErrs({}); setEditTargetIdx(undefined); setLibraryOpen(false); setStepModalOpen(true);
  }

  /* ── Computed ── */
  const startCount = buocList.filter((b) => b.loaiBuoc === "Bắt đầu").length;
  const endCount = buocList.filter((b) => b.loaiBuoc === "Kết thúc").length;
  const pointedToIds = new Set(buocList.flatMap((b) => b.buocTiepTheoId ? [b.buocTiepTheoId] : []));
  const orphanIds = new Set(buocList.filter((b) => b.loaiBuoc !== "Bắt đầu" && !pointedToIds.has(b.id)).map((b) => b.id));
  const editedStep = editTargetIdx !== undefined ? buocList[editTargetIdx] : null;
  const allowSpecialLoaiBuoc = editTargetIdx !== undefined || (!generatedWorkflowId && modalContext.type === "main" && !modalContext.afterStepId);
  const nextStepId = editedStep?.buocTiepTheoId || null;
  const editNextStepName = nextStepId ? buocList.find((s) => s.id === nextStepId)?.tenBuoc : undefined;

  /* ── Render ── */
  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => navWithCheck("/danh-sach-quy-trinh")} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <i className="fa-solid fa-arrow-left text-sm" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <i className="fa-solid fa-diagram-project text-slate-400" />
            <span className="text-slate-800 font-semibold">{isEdit ? "Chỉnh sửa quy trình" : "Lập quy trình mới"}</span>
            {isDirty && <span className="text-[11px] text-amber-500 font-medium">(Chưa lưu)</span>}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-60">
          {saving ? <i className="fa-solid fa-circle-notch fa-spin text-xs" /> : <i className="fa-solid fa-floppy-disk text-xs" />}
          {saving ? "Đang lưu..." : "Lưu quy trình"}
        </button>
      </header>

      <div className="w-full p-4 lg:p-6 space-y-6">
        {saveErr && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <i className="fa-solid fa-circle-xmark shrink-0" />{saveErr}
          </div>
        )}

        <TemplateSelectorCard
          tenWorkflow={tenQuyTrinh} tenErr={tenErr}
          onTenChange={(v) => { setTenQuyTrinh(v); setTenErr(validateTen(v)); markDirty(); }}
          selectedLoaiHinh={loaiHinh} onLoaiHinhChange={handleLoaiHinhChange}
          loaiHinhErr={loaiHinhErr} templateInfo={templateInfo} loadingTemplate={loadingTemplate}
          templateList={templateList} selectedTemplateIdx={selectedTemplateIdx}
          onTemplateIdxChange={(i) => { setSelectedTemplateIdx(i); markDirty(); }}
          onPreview={handlePreview} onGenerate={handleGenerate}
          canGenerate={!isEdit && !!templateInfo && templateInfo.soBuoc > 0 && !saving} canPreview={!!templateInfo} isEdit={isEdit}
        />

        <WorkflowStepList
          steps={buocList}
          parallelGroups={parallelGroups}
          orphanIds={orphanIds} startCount={startCount} endCount={endCount}
          onEdit={(s) => { const idx = buocList.findIndex((x) => x.id === s.id); if (idx >= 0) handleOpenEdit(idx); }}
          onDelete={handleDeleteTarget}
          onMoveUp={handleMoveUp} onMoveDown={handleMoveDown}
          onInsertAfter={handleInsertAfter}
          onCreateParallel={handleCreateParallel}
          onClone={handleClone}
          onAddFromLibrary={() => setLibraryOpen(true)}
          onAddNew={() => { setEditTargetIdx(undefined); setModalContext({ type: "main" }); setNewStepForm(emptyStepForm()); setNewStepErrs({}); setStepModalOpen(true); }}
          onUpdateGroup={handleUpdateGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddBranch={handleAddBranch}
          onRemoveBranch={handleRemoveBranch}
          onAddStepToBranch={handleAddStepToBranch}
          onEditBranchStep={(s) => { const idx = buocList.findIndex((x) => x.id === s.id); if (idx >= 0) handleOpenEdit(idx); }}
          onDeleteBranchStep={handleDeleteTarget}
        />

        {buocList.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-diagram-project text-blue-500" />Xem trước luồng quy trình
            </h2>
            {orphanIds.size > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                <i className="fa-solid fa-triangle-exclamation" />Có {orphanIds.size} bước mồ côi.
              </div>
            )}
            <WorkflowPreview steps={buocList} parallelGroups={parallelGroups} orphanIds={orphanIds} />
          </section>
        )}
      </div>

      {/* Modals */}
      <StepFormModal
        open={stepModalOpen} mode={editTargetIdx !== undefined ? "edit" : "add"} context={modalContext}
        form={newStepForm} errors={newStepErrs} nextStepName={editNextStepName}
        allowSpecialLoaiBuoc={allowSpecialLoaiBuoc}
        onChange={(d) => setNewStepForm(d)} onSave={handleNewStepSave}
        onClose={() => { setStepModalOpen(false); setEditTargetIdx(undefined); }}
      />

      <StepLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={handleLibrarySelect}
      />

      <TemplatePreviewModal
        open={previewOpen} preview={previewData} loading={previewLoading}
        onClose={() => setPreviewOpen(false)}
      />

      <DeleteStepConfirmModal
        target={deleteTarget}
        loading={deletingStep}
        onClose={() => { if (!deletingStep) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
      />

      <LeaveConfirmModal
        open={leaveOpen} onStay={() => setLeaveOpen(false)} onLeave={confirmLeave}
      />
    </>
  );
}
