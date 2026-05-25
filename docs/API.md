# API Reference — Hệ thống QLQTDT

> **Tổng: 104 APIs · 15 Modules**
> Chi tiết từng module: `docs/detail/api/`

---

## 1. Auth (6 APIs)

> `detail/api/01-auth.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập, trả JWT trong HttpOnly cookie |
| POST | `/api/auth/logout` | Đăng xuất, clear cookie |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Gửi email khôi phục mật khẩu |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu |
| GET | `/api/auth/me` | Thông tin user hiện tại (roles + permissions) |

**Mẫu:** `POST /api/auth/login`
```json
// Request
{ "tenDangNhap": "string", "matKhau": "string" }
// Response 200
{ "success": true, "data": { "id": 1, "hoTen": "...", "vaiTro": ["..."], "tokenExpires": "..." } }
```

---

## 2. Users & Organization (9 APIs)

> `detail/api/02-users-org.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users` | Danh sách user (phân trang, filter) |
| POST | `/api/users` | Tạo user |
| GET | `/api/users/{id}` | Chi tiết user |
| PUT | `/api/users/{id}` | Cập nhật user |
| PATCH | `/api/users/{id}/status` | Khoá/Mở khoá user |
| GET | `/api/khoa-phong` | Danh sách khoa/phòng |
| POST | `/api/khoa-phong` | Tạo khoa/phòng |
| PUT | `/api/khoa-phong/{id}` | Cập nhật khoa/phòng |
| DELETE | `/api/khoa-phong/{id}` | Xoá (soft) khoa/phòng |

---

## 3. RBAC (12 APIs)

> `detail/api/03-rbac.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/roles` | Danh sách vai trò |
| POST | `/api/roles` | Tạo vai trò |
| PUT | `/api/roles/{id}` | Cập nhật vai trò |
| DELETE | `/api/roles/{id}` | Xoá (soft) vai trò |
| GET | `/api/permissions` | Danh sách quyền |
| POST | `/api/permissions` | Tạo quyền |
| PUT | `/api/permissions/{id}` | Cập nhật quyền |
| DELETE | `/api/permissions/{id}` | Xoá (soft) quyền |
| POST | `/api/roles/{id}/permissions` | Gán quyền cho role |
| GET | `/api/roles/{id}/permissions` | Quyền của role |
| POST | `/api/users/{id}/assign-role` | Gán user → khoa/phòng → role |
| GET | `/api/users/{id}/roles` | Roles của user |

---

## 4. Procurement Request (9 APIs)

> `detail/api/04-procurement.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/de-xuat` | Danh sách đề xuất (phân trang, filter) |
| POST | `/api/de-xuat` | Tạo đề xuất (kèm chi tiết vật tư) |
| GET | `/api/de-xuat/{id}` | Chi tiết đề xuất |
| PUT | `/api/de-xuat/{id}` | Cập nhật (chỉ khi DRAFT) |
| DELETE | `/api/de-xuat/{id}` | Xoá (chỉ khi DRAFT) |
| POST | `/api/de-xuat/{id}/submit` | Trình duyệt (DRAFT → PENDING) |
| POST | `/api/de-xuat/{id}/approve` | Phê duyệt (PENDING → APPROVED) |
| POST | `/api/de-xuat/{id}/reject` | Từ chối (PENDING → REJECTED) |
| GET | `/api/de-xuat/{id}/chi-tiet` | Chi tiết vật tư của đề xuất |

**Mẫu:** `POST /api/de-xuat`
```json
// Request
{ "tieuDe": "...", "khoaPhongId": 5, "tongDuToan": 25000000, "chiTiet": [{ "tenVatTu": "...", "soLuong": 10, "donGiaDuToan": 85000 }] }
// Response 201
{ "success": true, "data": { "id": 1, "maDeXuat": "DX-2026-0001", "trangThai": "DRAFT" } }
```

---

## 5. Workflow Configuration (12 APIs)

> `detail/api/05-workflow-config.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/hinh-thuc-dau-thau` | Danh sách hình thức đấu thầu |
| POST | `/api/hinh-thuc-dau-thau` | Tạo hình thức đấu thầu |
| GET | `/api/workflows` | Danh sách workflow template |
| POST | `/api/workflows` | Tạo workflow |
| PUT | `/api/workflows/{id}` | Cập nhật workflow |
| DELETE | `/api/workflows/{id}` | Xoá workflow |
| GET | `/api/workflows/{id}/steps` | Các bước của workflow |
| POST | `/api/workflows/{id}/steps` | Thêm bước |
| PUT | `/api/workflows/steps/{id}` | Cập nhật bước |
| DELETE | `/api/workflows/steps/{id}` | Xoá bước |
| POST | `/api/workflows/{id}/transitions` | Tạo transition |
| GET | `/api/workflows/{id}/transitions` | Danh sách transition |

---

## 6. Tender Package (8 APIs)

> `detail/api/06-tender.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/goi-thau` | Danh sách gói thầu (phân trang, filter) |
| POST | `/api/goi-thau` | Tạo gói thầu (từ đề xuất hoặc mới) |
| GET | `/api/goi-thau/{id}` | Chi tiết gói thầu |
| PUT | `/api/goi-thau/{id}` | Cập nhật (chỉ khi DU_THAO) |
| DELETE | `/api/goi-thau/{id}` | Xoá (chỉ khi DU_THAO) |
| GET | `/api/goi-thau/{id}/chi-tiet` | Chi tiết vật tư |
| POST | `/api/goi-thau/{id}/start-workflow` | Bắt đầu workflow |
| GET | `/api/goi-thau/{id}/workflow` | Xem workflow instance |

---

## 7. Workflow Runtime (8 APIs)

> `detail/api/07-workflow-runtime.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/workflow/pending` | Pending tasks của user |
| GET | `/api/workflow/{instanceId}` | Chi tiết workflow instance |
| GET | `/api/workflow/{instanceId}/steps` | Steps + trạng thái |
| POST | `/api/workflow/{instanceId}/process` | Xử lý bước (approve/reject) |
| POST | `/api/workflow/{instanceId}/rollback` | Rollback về bước trước |
| POST | `/api/workflow/{instanceId}/skip` | Bỏ qua bước (nếu optional) |
| POST | `/api/workflow/{instanceId}/reassign` | Chuyển người xử lý |
| GET | `/api/workflow/overdue` | Steps quá hạn |

---

## 8. Document (4 APIs)

> `detail/api/08-document.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/files/upload` | Upload file (multipart, multiple files) |
| GET | `/api/files/{id}` | Download file |
| DELETE | `/api/files/{id}` | Xoá file |
| GET | `/api/files` | Danh sách file (filter) |

---

## 9. Vendor (7 APIs)

> `detail/api/09-vendor.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/nha-thau` | Danh sách nhà thầu |
| POST | `/api/nha-thau` | Tạo nhà thầu |
| PUT | `/api/nha-thau/{id}` | Cập nhật nhà thầu |
| GET | `/api/nha-thau/{id}/ho-so-nang-luc` | Hồ sơ năng lực |
| POST | `/api/nha-thau/{id}/ho-so-nang-luc` | Upload hồ sơ năng lực |
| DELETE | `/api/nha-thau/{id}/ho-so-nang-luc/{fileId}` | Xoá hồ sơ năng lực |
| GET | `/api/nha-thau/{id}/ls-du-thau` | Lịch sử đấu thầu |

---

## 10. Bidding (6 APIs)

> `detail/api/10-bidding.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/ho-so-du-thau` | Danh sách hồ sơ dự thầu |
| POST | `/api/ho-so-du-thau` | Nộp hồ sơ (1 nhà thầu 1 hồ sơ/gói thầu) |
| GET | `/api/ho-so-du-thau/{id}` | Chi tiết hồ sơ |
| POST | `/api/ho-so-du-thau/{id}/evaluate` | Đánh giá hồ sơ |
| POST | `/api/goi-thau/{id}/award` | Chọn nhà thầu trúng thầu |
| GET | `/api/goi-thau/{id}/results` | Kết quả đấu thầu |

---

## 11. Contract (11 APIs)

> `detail/api/11-contract.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/hop-dong` | Danh sách hợp đồng |
| POST | `/api/hop-dong` | Tạo hợp đồng |
| GET | `/api/hop-dong/{id}` | Chi tiết hợp đồng |
| PUT | `/api/hop-dong/{id}` | Cập nhật (chỉ khi NHAP) |
| POST | `/api/hop-dong/{id}/phu-luc` | Thêm phụ lục |
| GET | `/api/hop-dong/{id}/phu-luc` | Danh sách phụ lục |
| POST | `/api/hop-dong/{id}/nghiem-thu` | Tạo nghiệm thu |
| GET | `/api/hop-dong/{id}/nghiem-thu` | Danh sách nghiệm thu |
| POST | `/api/hop-dong/{id}/quyet-toan` | Tạo quyết toán |
| GET | `/api/hop-dong/{id}/quyet-toan` | Chi tiết quyết toán |
| PATCH | `/api/hop-dong/{id}/status` | Cập nhật trạng thái hợp đồng |

---

## 12. Notification (3 APIs)

> `detail/api/12-notification.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/thong-bao` | Danh sách thông báo của user |
| PATCH | `/api/thong-bao/{id}/read` | Đánh dấu đã đọc |
| POST | `/api/thong-bao/read-all` | Đánh dấu tất cả đã đọc |

---

## 13. Audit Log (2 APIs)

> `detail/api/13-audit.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/audit-log` | Danh sách audit log (phân trang, filter) |
| GET | `/api/audit-log/goi-thau/{id}` | Audit log theo gói thầu |

---

## 14. Dashboard (4 APIs)

> `detail/api/14-dashboard.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/dashboard/summary` | Tổng quan gói thầu theo trạng thái |
| GET | `/api/dashboard/statistics` | Thống kê theo tháng, khoa phòng, hình thức |
| GET | `/api/dashboard/pending` | Việc cần xử lý theo role |
| GET | `/api/dashboard/export` | Export báo cáo Excel/PDF |

---

## 15. Integration (3 APIs)

> `detail/api/15-integration.md`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/integration/sync` | Đồng bộ dữ liệu với hệ thống ngoài |
| GET | `/api/integration/logs` | Danh sách log đồng bộ |
| POST | `/api/integration/retry/{logId}` | Thử lại đồng bộ thất bại |

---

## Phân công

| Dev | APIs | Modules |
|-----|------|---------|
| Dev #1 | 29 | Auth 6 + Users 9 + RBAC 12 + Audit 2 |
| Dev #2 | 9 | Procurement 9 |
| Dev #3 | 20 | Workflow Config 12 + Runtime 8 |
| Dev #4 | 16 | Tender 8 + Document 4 + Dashboard 4 |
| Dev #5 | 30 | Vendor 7 + Bidding 6 + Contract 11 + Notif 3 + Integration 3 |
| **Tổng** | **104** | 15 Modules |
