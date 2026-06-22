# WorkflowEngine Runtime Analysis -- Report (Updated)

## 1. Entity Landscape

**Template layer (static):**
- Workflow: one per bidding method
- BuocWorkflow: step definition; 2-phase roles, NhomSongSong/LaBuocJoin
- ChuyenTiepWorkflow: TuBuocId -> DenBuocId + action

**Runtime layer (per-GoiThau):**
- WorkflowInstance: BuocHienTaiId key field
- WorkflowStepInstance: per execution; PhaHienTai in {LAP_HO_SO, KY_DUYET}
- WorkflowAssignment: per-user per-step; DaXuLy flag
- WorkflowActionHistory: audit log

**State machine:**
- GoiThau: DU_THAO -> DANG_XU_LY -> HOAN_THANH | DU_THAO
- Instance: ACTIVE -> COMPLETED | REJECTED | CANCELLED
- StepInstance: DANG_XU_LY -> CHO_DUYET -> HOAN_TAT | TRA_VE | SKIPPED

## 2. Current-Step Invariant

WorkflowInstance.BuocHienTaiId = WorkflowStepInstance.BuocWorkflowId
AND WorkflowStepInstance.TrangThai in {DANG_XU_LY, CHO_DUYET}
AND WorkflowStepInstance.WorkflowInstanceId = WorkflowInstance.Id

Enforced ProcessStepAsync step 3. Rollback re-entries use OrderByDescending(Id).FirstOrDefault().
Concurrency: RowVersion + UPDLOCK/ROWLOCK.

## 3. Diff: Backup vs Live

PENDING -> DANG_XU_LY|CHO_DUYET. Single permission -> phase-aware. Simple approve -> 3-path (fast, 2-phase, partial). ENGLISH only -> adds VN aliases. ROLLBACK only -> ROLLBACK|TRA_VE. No deadline -> CheckDeadlineAsync. No multi-signer -> DaXuLy counting.

## 4. Risks

### CRITICAL: BuocHienTaiId Scalar -- No Parallel Routing
Engine ONE next step. NhomSongSong never read. Silent sequential.

### HIGH: Join Step Not Implemented
LaBuocJoin never read. No join-counter.

### HIGH: StartWorkflow Initializes One Branch
steps[0] only. Forks broken.

### MEDIUM: Rollback Creates Duplicate StepInstance
Same BuocWorkflowId multiple rows. No depth cap.

### MEDIUM: Read Outside Transaction
Reads before UPDLOCK. Re-check missing BuocHienTaiId filter.

### MEDIUM: RowVersion Blocks Parallel Signers
First signer commits -> others ConflictException.

### MEDIUM: CheckDeadlineAsync Mutates Template Entity
buoc.LoaiHan = "CANH_BAO" on tracked object. EF persists to DB.

### MEDIUM: Duplicate Assignment in HandleApproveAsync
Stale in-memory collection. Concurrent REASSIGN -> unique violation.

### LOW: SKIP Falls Back to APPROVE
No SKIP transition -> uses APPROVE silently.

### LOW: CANCELLED Never Set
WorkflowTrangThai.CANCELLED and GoiThauTrangThai.HUY_BO dead code.

### LOW: Backup File in Production
WorkflowEngineService.cs.bak alongside live code.

### LOW: Phase String Literals
"LAP_HO_SO"/"KY_DUYET" raw. No constants.

## 5. Side Effects

### CheckDeadlineAsync Mutates Template
Sets buoc.LoaiHan = "CANH_BAO" on tracked entity via .Include(). SaveChangesAsync flushes to DB. Template corrupted permanently.

Fix: AsNoTracking, Detach, local variable clone.

### Duplicate Assignment in HandleApproveAsync
In-memory .Include() collection stale under concurrent REASSIGN. Add throws unique constraint violation.

Fix: Query DB inside transaction, not in-memory.

## 6. Branch/Parallel Implications
Strictly sequential. Second branch orphaned. Join never waits.

## 7. Option B (5 Phases, Backward-Compatible)

Phase 1: NhomSongSong runtime key, WorkflowParallelGroup entity, JoinStepBuocId nullable.
Phase 2: StartWorkflow fork -> 1 StepInstance per branch, init counter.
Phase 3: ProcessStepAsync accept any group branch.
Phase 4: Branch completion -> counter, last sibling advances, join check predecessors.
Phase 5: State query returns ParallelGroups.

Cleanup: PhaHienTai constants, delete .bak, fix CheckDeadlineAsync, DB-side DuplicateAssignment check, Cancellation endpoint, remove SKIP-APPROVE fallback.

## 8. CANCELLED vs REJECTED Gap
Both CANCELLED and HUY_BO defined never set. Rejection resets GoiThau to DU_THAO (soft). No terminal cancellation state.

## 9. BA Feedback Traces
6 markers in 3 files. GoiThau.cs: VN action aliases + states. WorkflowEngineDtos.cs: 3 DTOs (duyet, khong-duyet, tra-ve). GoiThauController.cs: POST /duyet, /khong-duyet. All thin wrappers delegating to ProcessStepAsync. Missing: HUY_BO endpoint, cancellation.

## 10. All Files Referenced

- /home/binhminh/Developer/Interns/QLQTDT/backend/Services/WorkflowEngineService.cs (1205 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Services/WorkflowEngineService.cs.bak (backup)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Services/IWorkflowEngineService.cs (12 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Services/WorkflowConfigService.cs (279 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Services/BuocWorkflowService.cs (299 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Services/GoiThauService.cs (197 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Controllers/GoiThauController.cs (276 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/GoiThau.cs (86 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/WorkflowInstance.cs (21 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/WorkflowStepInstance.cs (41 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/WorkflowAssignment.cs (20 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/BuocWorkflow.cs (37 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/ChuyenTiepWorkflow.cs (14 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/Workflow.cs (13 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/WorkflowActionHistory.cs (16 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/WorkflowRule.cs (10 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/DTOs/Workflow/WorkflowEngineDtos.cs (154 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/DTOs/Workflow/StepDtos.cs (76 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/DTOs/Workflow/WorkflowDtos.cs (28 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/DTOs/Workflow/WorkflowVersionDtos.cs (52 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Interfaces.cs (12 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Data/AppDbContext.cs (559 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Validators/WorkflowEngineValidators.cs (130 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Program.cs (293 lines)
- /home/binhminh/Developer/Interns/QLQTDT/backend/Models/Entities/DeXuatMuaSam.cs (23 lines)
