# Dev #4 — Tender Package + Document + Dashboard

## APIs cần implement: 16 APIs

### Tender Package (8 APIs)
| # | API | Priority |
|---|-----|----------|
| 1 | GET /api/goi-thau | P0 |
| 2 | POST /api/goi-thau | P0 |
| 3 | GET /api/goi-thau/{id} | P0 |
| 4 | PUT /api/goi-thau/{id} | P0 |
| 5 | DELETE /api/goi-thau/{id} | P0 |
| 6 | GET /api/goi-thau/{id}/chi-tiet | P0 |
| 7 | POST /api/goi-thau/{id}/start-workflow | P0 |
| 8 | GET /api/goi-thau/{id}/workflow | P0 |

### Document (4 APIs)
| # | API | Priority |
|---|-----|----------|
| 9 | POST /api/files/upload | P1 |
| 10 | GET /api/files/{id} | P1 |
| 11 | DELETE /api/files/{id} | P1 |
| 12 | GET /api/files | P1 |

### Dashboard (4 APIs)
| # | API | Priority |
|---|-----|----------|
| 13 | GET /api/dashboard/summary | P1 |
| 14 | GET /api/dashboard/statistics | P1 |
| 15 | GET /api/dashboard/pending | P1 |
| 16 | GET /api/dashboard/export | P1 |

## Task breakdown

### Phase 1: Tender Package CRUD
1. Tạo `GoiThauController.cs`
2. Tạo `IGoiThauService.cs` / `GoiThauService.cs`
3. Implement CRUD:
   - GET list: phân trang, filter (trangThai, khoaPhongId, hinhThucDauThauId)
   - POST: tạo mới (từ DeXuatId hoặc nhập tay)
   - PUT: chỉ khi DU_THAO
   - DELETE: chỉ khi DU_THAO
   - GET chiTiet: danh sách vật tư

### Phase 2: Tender + Workflow Integration
4. POST /goi-thau/{id}/start-workflow:
   - Gọi WorkflowEngine.StartWorkflowAsync
   - Cập nhật TrangThai gói thầu
5. GET /goi-thau/{id}/workflow:
   - Query WorkflowInstance → WorkflowStepInstance → WorkflowAssignment

### Phase 3: Document/FTP
6. Tạo `FtpService.cs` (passive mode FTP)
   - Upload stream → FTP server
   - Download stream ← FTP server
   - Xoá file on FTP
7. Tạo `TaiLieuController.cs`
8. Implement upload:
   - Accept multipart/form-data
   - Validate file size (< 50MB)
   - Validate file extension (whitelist: pdf, doc, docx, xls, xlsx, jpg, png)
   - Upload to FTP → lưu metadata (tenFileGoc, tenFileFtp, kichThuoc, loaiTaiLieu)
9. Implement download: FTP stream → response
10. Implement delete: soft delete

### Phase 4: Dashboard
11. Tạo `DashboardController.cs`
12. Implement summary: aggregate GoiThau by trangThai
13. Implement statistics: group by month/quarter, by khoaPhong, by hinhThuc
14. Implement pending: count pending tasks for current user
15. Implement export: generate Excel/PDF using EPPlus or similar
