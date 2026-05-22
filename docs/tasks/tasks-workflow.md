# Dev #3 — Workflow (Config + Runtime Engine) ⭐

## APIs cần implement: 20 APIs

### Workflow Config (12 APIs)
| # | API | Priority |
|---|-----|----------|
| 1 | GET /api/hinh-thuc-dau-thau | P1 |
| 2 | POST /api/hinh-thuc-dau-thau | P1 |
| 3 | GET /api/workflows | P1 |
| 4 | POST /api/workflows | P1 |
| 5 | PUT /api/workflows/{id} | P1 |
| 6 | DELETE /api/workflows/{id} | P1 |
| 7 | GET /api/workflows/{id}/steps | P1 |
| 8 | POST /api/workflows/{id}/steps | P1 |
| 9 | PUT /api/workflows/steps/{id} | P1 |
| 10 | DELETE /api/workflows/steps/{id} | P1 |
| 11 | POST /api/workflows/{id}/transitions | P1 |
| 12 | GET /api/workflows/{id}/transitions | P1 |

### Workflow Runtime (8 APIs)
| # | API | Priority |
|---|-----|----------|
| 13 | GET /api/workflow/pending | P0 |
| 14 | GET /api/workflow/{instanceId} | P0 |
| 15 | GET /api/workflow/{instanceId}/steps | P0 |
| 16 | POST /api/workflow/{instanceId}/process | P0 |
| 17 | POST /api/workflow/{instanceId}/rollback | P0 |
| 18 | POST /api/workflow/{instanceId}/skip | P0 |
| 19 | POST /api/workflow/{instanceId}/reassign | P0 |
| 20 | GET /api/workflow/overdue | P0 |

## Task breakdown

### Phase 1: Domain Models
1. Tạo entities: HinhThucDauThau, Workflow, BuocWorkflow, ChuyenTiepWorkflow, WorkflowInstance, WorkflowStepInstance, WorkflowAssignment, WorkflowActionHistory, WorkflowRule
2. Tạo DbContext config cho các entity trên

### Phase 2: Workflow Config CRUD
3. Tạo `HinhThucDauThauController.cs` + Service (CRUD đơn giản)
4. Tạo `WorkflowConfigController.cs` + Service:
   - CRUD Workflow template
   - CRUD BuocWorkflow theo workflowId
   - CRUD ChuyenTiepWorkflow (transition mapping)
   - Validate: không xoá workflow đang có instance ACTIVE
   - Validate: không xoá bước đang được transition tham chiếu

### Phase 3: Workflow Engine Runtime ⭐
5. Tạo `WorkflowEngine.cs` (state machine) — xem pseudocode trong `docs/tasks/workflow-engine-pseudocode.md`
6. Tạo `WorkflowController.cs` + `IWorkflowService.cs` / `WorkflowService.cs`
7. Implement StartWorkflow:
   - Tìm Workflow (tự động từ WorkflowRule hoặc manual)
   - Tạo WorkflowInstance + step đầu tiên
   - Tạo WorkflowAssignment cho user có VaiTroXuLyId
   - Ghi ActionHistory
   - Tạo ThongBao

8. Implement ProcessStep:
   - Validate user assignment
   - Validate transition
   - Xử lý APPROVE/REJECT
   - Tạo step kế tiếp hoặc complete instance
   - Tích hợp ThongBao cho người xử lý tiếp

9. Implement Rollback:
   - Set current step → ROLLED_BACK
   - Reactivate step trước đó
   - Tạo assignment mới

10. Implement Skip:
    - Kiểm tra ChoPhepBoQua = true
    - Set step → SKIPPED
    - Move to next step

11. Implement Reassign: chuyển người xử lý

12. Implement CheckOverdue: so sánh NgayBatDau + SoNgaySLA < now

### Seed Data
- Tạo 10 HinhThucDauThau mặc định
- Tạo Workflow templates tương ứng

## Important
- Workflow Engine là **module core quan trọng nhất** của hệ thống
- Thiết kế atomic: mỗi step xử lý phải là 1 transaction
- Cần có optimistic locking cho WorkflowInstance (tránh xung đột)
- Pseudocode chi tiết tại `docs/tasks/workflow-engine-pseudocode.md`
