# Dev #2 — Procurement Request

## APIs cần implement: 9 APIs

| # | API | Priority |
|---|-----|----------|
| 1 | GET /api/de-xuat | P0 |
| 2 | POST /api/de-xuat | P0 |
| 3 | GET /api/de-xuat/{id} | P0 |
| 4 | PUT /api/de-xuat/{id} | P0 |
| 5 | DELETE /api/de-xuat/{id} | P0 |
| 6 | POST /api/de-xuat/{id}/submit | P0 |
| 7 | POST /api/de-xuat/{id}/approve | P0 |
| 8 | POST /api/de-xuat/{id}/reject | P0 |
| 9 | GET /api/de-xuat/{id}/chi-tiet | P0 |

## Task breakdown

### Phase 1: CRUD + Business Rules
1. Tạo `DeXuatController.cs`
2. Tạo `IDeXuatService.cs` / `DeXuatService.cs`
3. Implement CRUD:
   - GET list: phân trang, filter theo (trangThai, khoaPhongId, search, date range)
   - POST: validate chiTiet array, auto sinh MaDeXuat
   - PUT: chỉ cho phép khi DRAFT
   - DELETE: soft delete, chỉ khi DRAFT
   - GET detail: include chiTiet + nguoiDeXuat + khoaPhong

### Phase 2: State Transitions
4. Submit: DRAFT → PENDING
   - Validate có ít nhất 1 chiTiet
   - Ghi audit log
   - Tạo thông báo cho người phê duyệt
5. Approve: PENDING → APPROVED
   - Validate user có quyền DeXuat.Approve
   - Ghi audit log
6. Reject: PENDING → REJECTED
   - Validate user có quyền
   - Bắt buộc có lý do từ chối

### Business Logic
- Tự sinh MaDeXuat = DX-{năm}-{số thứ tự}
- Tính thanhTien = soLuong * donGiaDuToan
- Chỉ người tạo mới được sửa/xoá (khi DRAFT)
- Approve chỉ dành cho user có vai trò phê duyệt (check permission)

### Related Models
- DeXuat (Id, IdCongKhai, MaDeXuat, TieuDe, MoTa, KhoaPhongId, TongDuToan, TrangThai, NguoiTaoId, NgayDeXuat, DaXoa)
- DeXuatChiTiet (Id, DeXuatId, MaVatTu, TenVatTu, DonViTinh, SoLuong, DonGiaDuToan, ThanhTien)
