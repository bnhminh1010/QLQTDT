# Dev #5 — Vendor + Bidding + Contract + Notification

## APIs cần implement: 30 APIs

### Vendor (7 APIs)
| # | API | Priority |
|---|-----|----------|
| 1 | GET /api/nha-thau | P1 |
| 2 | POST /api/nha-thau | P1 |
| 3 | PUT /api/nha-thau/{id} | P1 |
| 4 | GET /api/nha-thau/{id}/ho-so-nang-luc | P1 |
| 5 | POST /api/nha-thau/{id}/ho-so-nang-luc | P1 |
| 6 | DELETE /api/nha-thau/{id}/ho-so-nang-luc/{fileId} | P1 |
| 7 | GET /api/nha-thau/{id}/ls-du-thau | P1 |

### Bidding (6 APIs)
| # | API | Priority |
|---|-----|----------|
| 8 | GET /api/ho-so-du-thau | P1 |
| 9 | POST /api/ho-so-du-thau | P1 |
| 10 | GET /api/ho-so-du-thau/{id} | P1 |
| 11 | POST /api/ho-so-du-thau/{id}/evaluate | P1 |
| 12 | POST /api/goi-thau/{id}/award | P1 |
| 13 | GET /api/goi-thau/{id}/results | P1 |

### Contract (11 APIs)
| # | API | Priority |
|---|-----|----------|
| 14 | GET /api/hop-dong | P1 |
| 15 | POST /api/hop-dong | P1 |
| 16 | GET /api/hop-dong/{id} | P1 |
| 17 | PUT /api/hop-dong/{id} | P1 |
| 18 | POST /api/hop-dong/{id}/phu-luc | P1 |
| 19 | GET /api/hop-dong/{id}/phu-luc | P1 |
| 20 | POST /api/hop-dong/{id}/nghiem-thu | P1 |
| 21 | GET /api/hop-dong/{id}/nghiem-thu | P1 |
| 22 | POST /api/hop-dong/{id}/quyet-toan | P1 |
| 23 | GET /api/hop-dong/{id}/quyet-toan | P1 |
| 24 | PATCH /api/hop-dong/{id}/status | P1 |

### Notification (3 APIs)
| # | API | Priority |
|---|-----|----------|
| 25 | GET /api/thong-bao | P1 |
| 26 | PATCH /api/thong-bao/{id}/read | P1 |
| 27 | POST /api/thong-bao/read-all | P1 |

## Task breakdown

### Phase 1: Vendor
1. Tạo `NhaThauController.cs` + Service
2. CRUD NhaThau: validate unique MST
3. Quản lý hồ sơ năng lực (upload file + metadata)
4. Lịch sử đấu thầu của nhà thầu (aggregate từ HoSoDuThau)

### Phase 2: Bidding
5. Tạo `HoSoDuThauController.cs` + Service
6. Nộp hồ sơ: validate 1 nhà thầu 1 hồ sơ/gói thầu
7. Evaluate: cập nhật kết quả, điểm, nhận xét
8. Award: chọn nhà thầu trúng thầu
   - Set GoiThau.TrangThai = "DA_CHON_NHA_THAU"
   - Các hồ sơ khác → "KHONG_TRUNG"
   - Tạo HopDong tự động (hoặc chờ user tạo thủ công)

### Phase 3: Contract Lifecycle
9. Tạo `HopDongController.cs` + Service
10. CRUD HopDong:
    - Tự sinh SoHopDong
    - TrangThai state machine: NHAP → DA_KY → DANG_THUC_HIEN → DA_NGHIEM_THU → DA_QUYET_TOAN → DA_TAT_TOAN
11. Quản lý PhuLuc (con của HopDong)
12. Quản lý NghiemThu (multiple lần)
13. Quản lý QuyetToan (1 hopDong → 1 quyetToan)
14. PATCH status: validate transition hợp lệ

### Phase 4: Integration (thêm 3 APIs)
| # | API | Priority |
|---|-----|----------|
| 28 | POST /api/integration/sync | P2 |
| 29 | GET /api/integration/logs | P2 |
| 30 | POST /api/integration/retry/{logId} | P2 |

17. Tạo `IntegrationController.cs` + `IntegrationService.cs`
18. Implement sync: kết nối hệ thống HIS/kho, đồng bộ dữ liệu
19. Implement logs: xem lịch sử đồng bộ
20. Implement retry: thử lại sync thất bại

### Phase 5: Notification
15. Tạo `ThongBaoController.cs` + Service
16. Tạo `ThongBaoService.cs`:
    - Tự động tạo ThongBao khi:
      - Có WorkflowAssignment mới
      - Có người phê duyệt/ từ chối
      - Có kết quả đấu thầu
    - Query thông báo của user (phân trang)
    - Mark read / read all
