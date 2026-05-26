# Task Assignment — Hệ thống QLQTDT

> **5 Dev · 104 APIs · 15 Modules**
> Chi tiết từng task: `docs/detail/tasks/`

---

## Tổng quan

| Dev | APIs | Modules | Priority | Phụ thuộc |
|-----|------|---------|----------|-----------|
| Dev #1 | 29 | Auth + Users + Org + RBAC + Audit | P0 | BaseService |
| Dev #2 | 9 | Procurement | P0 | BaseService |
| Dev #3 | 20 | Workflow Config + Runtime Engine | P0 | BaseService |
| Dev #4 | 16 | Tender + Document + Dashboard | P1 | BaseService + FtpService |
| Dev #5 | 30 | Vendor + Bidding + Contract + Notif + Integration | P1 | Workflow Engine |

---

## Dev #1 (29 APIs) — Auth + Users + Organization + RBAC + Audit

> `detail/tasks/tasks-auth-rbac.md`

### Phases

| Phase | Module | APIs | Key Classes |
|-------|--------|------|-------------|
| 1 | Auth | 6 | `AuthController`, `AuthService`, JwtHelper |
| 2 | Users + Org | 9 | `UsersController`, `UserService`, `KhoaPhongService` |
| 3 | RBAC | 12 | `RolesController`, `PermissionsController`, `RbacService` |
| 4 | Audit Log | 2 | `AuditLogController`, `AuditService` |
| — | Cross-cutting | — | `BaseService<T>`, `ExceptionMiddleware`, `ApiResponse` |

### API List

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
GET  /api/users
POST /api/users
GET  /api/users/{id}
PUT  /api/users/{id}
PATCH /api/users/{id}/status
GET  /api/khoa-phong
POST /api/khoa-phong
PUT  /api/khoa-phong/{id}
DELETE /api/khoa-phong/{id}
GET  /api/roles
POST /api/roles
PUT  /api/roles/{id}
DELETE /api/roles/{id}
GET  /api/permissions
POST /api/permissions
PUT  /api/permissions/{id}
DELETE /api/permissions/{id}
POST /api/roles/{id}/permissions
GET  /api/roles/{id}/permissions
POST /api/users/{id}/assign-role
GET  /api/users/{id}/roles
GET  /api/audit-log
GET  /api/audit-log/goi-thau/{id}
```

---

## Dev #2 (9 APIs) — Procurement Request

> `detail/tasks/tasks-procurement.md`

### Phases

| Phase | Module | APIs | Key Classes |
|-------|--------|------|-------------|
| 1 | CRUD | 5 | `DeXuatController`, `DeXuatService` |
| 2 | State transitions | 4 | Submit, Approve, Reject handlers |

### Business Rules
- `MaDeXuat` = DX-{year}-{seq}
- Chỉ sửa/xoá khi DRAFT
- Approve chỉ dành cho user có permission `DeXuat.Approve`

### API List

```
GET  /api/de-xuat
POST /api/de-xuat
GET  /api/de-xuat/{id}
PUT  /api/de-xuat/{id}
DELETE /api/de-xuat/{id}
POST /api/de-xuat/{id}/submit
POST /api/de-xuat/{id}/approve
POST /api/de-xuat/{id}/reject
GET  /api/de-xuat/{id}/chi-tiet
```

---

## Dev #3 (20 APIs) — Workflow Config + Runtime Engine ⭐

> `detail/tasks/tasks-workflow.md`
> `detail/tasks/workflow-engine-pseudocode.md`

### Phases

| Phase | Module | APIs | Key Classes |
|-------|--------|------|-------------|
| 1 | Entity models | — | HinhThucDauThau, Workflow, BuocWorkflow, ChuyenTiepWorkflow, WorkflowInstance, WorkflowStepInstance, WorkflowAssignment, WorkflowActionHistory |
| 2 | Config CRUD | 12 | `HinhThucDauThauController`, `WorkflowConfigController` |
| 3 | Runtime engine | 8 | `WorkflowEngine` (state machine), `WorkflowController` |

### API List — Config

```
GET  /api/hinh-thuc-dau-thau
POST /api/hinh-thuc-dau-thau
GET  /api/workflows
POST /api/workflows
PUT  /api/workflows/{id}
DELETE /api/workflows/{id}
GET  /api/workflows/{id}/steps
POST /api/workflows/{id}/steps
PUT  /api/workflows/steps/{id}
DELETE /api/workflows/steps/{id}
POST /api/workflows/{id}/transitions
GET  /api/workflows/{id}/transitions
```

### API List — Runtime

```
GET  /api/workflow/pending
GET  /api/workflow/{instanceId}
GET  /api/workflow/{instanceId}/steps
POST /api/workflow/{instanceId}/process
POST /api/workflow/{instanceId}/rollback
POST /api/workflow/{instanceId}/skip
POST /api/workflow/{instanceId}/reassign
GET  /api/workflow/overdue
```

### Notes
- Module **critical** — state machine runtime core
- Xem pseudocode tại `detail/tasks/workflow-engine-pseudocode.md`
- Cần optimistic locking cho WorkflowInstance

---

## Dev #4 (16 APIs) — Tender Package + Document + Dashboard

> `detail/tasks/tasks-tender-doc.md`

### Phases

| Phase | Module | APIs | Key Classes |
|-------|--------|------|-------------|
| 1 | Tender CRUD | 8 | `GoiThauController`, `GoiThauService` |
| 2 | FTP Document | 4 | `TaiLieuController`, `FtpService` |
| 3 | Dashboard | 4 | `DashboardController` |

### API List

```
GET  /api/goi-thau
POST /api/goi-thau
GET  /api/goi-thau/{id}
PUT  /api/goi-thau/{id}
DELETE /api/goi-thau/{id}
GET  /api/goi-thau/{id}/chi-tiet
POST /api/goi-thau/{id}/start-workflow
GET  /api/goi-thau/{id}/workflow
POST /api/files/upload
GET  /api/files/{id}
DELETE /api/files/{id}
GET  /api/files
GET  /api/dashboard/summary
GET  /api/dashboard/statistics
GET  /api/dashboard/pending
GET  /api/dashboard/export
```

---

## Dev #5 (30 APIs) — Vendor + Bidding + Contract + Notification + Integration

> `detail/tasks/tasks-vendor-bidding-contract-notification.md`

### Phases

| Phase | Module | APIs | Key Classes |
|-------|--------|------|-------------|
| 1 | Vendor | 7 | `NhaThauController`, `NhaThauService` |
| 2 | Bidding | 6 | `HoSoDuThauController`, award logic |
| 3 | Contract | 11 | `HopDongController`, `HopDongService`, state machine |
| 4 | Integration | 3 | `IntegrationController`, `IntegrationService` |
| 5 | Notification | 3 | `ThongBaoController`, `ThongBaoService` |

### API List — Vendor

```
GET  /api/nha-thau
POST /api/nha-thau
PUT  /api/nha-thau/{id}
GET  /api/nha-thau/{id}/ho-so-nang-luc
POST /api/nha-thau/{id}/ho-so-nang-luc
DELETE /api/nha-thau/{id}/ho-so-nang-luc/{fileId}
GET  /api/nha-thau/{id}/ls-du-thau
```

### API List — Bidding

```
GET  /api/ho-so-du-thau
POST /api/ho-so-du-thau
GET  /api/ho-so-du-thau/{id}
POST /api/ho-so-du-thau/{id}/evaluate
POST /api/goi-thau/{id}/award
GET  /api/goi-thau/{id}/results
```

### API List — Contract

```
GET  /api/hop-dong
POST /api/hop-dong
GET  /api/hop-dong/{id}
PUT  /api/hop-dong/{id}
POST /api/hop-dong/{id}/phu-luc
GET  /api/hop-dong/{id}/phu-luc
POST /api/hop-dong/{id}/nghiem-thu
GET  /api/hop-dong/{id}/nghiem-thu
POST /api/hop-dong/{id}/quyet-toan
GET  /api/hop-dong/{id}/quyet-toan
PATCH /api/hop-dong/{id}/status
```

### API List — Integration

```
POST /api/integration/sync
GET  /api/integration/logs
POST /api/integration/retry/{logId}
```

### API List — Notification

```
GET  /api/thong-bao
PATCH /api/thong-bao/{id}/read
POST /api/thong-bao/read-all
```

### Contract State Machine

```
NHAP → DA_KY → DANG_THUC_HIEN → DA_NGHIEM_THU → DA_QUYET_TOAN → DA_TAT_TOAN
                 ↓                    ↓
            TAM_DUNG               HUY
```
