# Module Procurement Request (9 APIs)

## GET /api/de-xuat

Danh sách đề xuất (phân trang, filter).

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| search | string | - | Tìm theo tiêu đề/mã đề xuất |
| khoaPhongId | int | - | Lọc theo khoa/phòng |
| trangThai | string | - | Lọc theo trạng thái (DRAFT, PENDING, APPROVED, REJECTED) |
| tuNgay | date | - | Từ ngày tạo |
| denNgay | date | - | Đến ngày tạo |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "idCongKhai": "guid",
        "maDeXuat": "DX-2026-0001",
        "tieuDe": "Mua sắm văn phòng phẩm quý 2/2026",
        "trangThai": "APPROVED",
        "tongDuToan": 25000000,
        "nguoiDeXuat": { "id": 10, "hoTen": "Nguyễn Văn A" },
        "khoaPhong": "Nội tổng hợp",
        "ngayDeXuat": "2026-05-20T10:30:00"
      }
    ],
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "totalPages": 6
  }
}
```

---

## POST /api/de-xuat

Tạo đề xuất.

**Request:**
```json
{
  "tieuDe": "Mua sắm văn phòng phẩm quý 2/2026",
  "moTa": "Bổ sung văn phòng phẩm cho khoa Nội tổng hợp",
  "khoaPhongId": 5,
  "tongDuToan": 25000000,
  "ghiChu": "Cần trước ngày 01/06/2026",
  "chiTiet": [
    {
      "maVatTu": "VP-001",
      "tenVatTu": "Giấy A4 Double A",
      "donViTinh": "Thùng",
      "soLuong": 10,
      "donGiaDuToan": 85000
    },
    {
      "maVatTu": "VP-002",
      "tenVatTu": "Bút bi Thiên Long",
      "donViTinh": "Hộp",
      "soLuong": 20,
      "donGiaDuToan": 12000
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "idCongKhai": "guid",
    "maDeXuat": "DX-2026-0001",
    "tieuDe": "Mua sắm văn phòng phẩm quý 2/2026",
    "trangThai": "DRAFT",
    "tongDuToan": 25000000,
    "chiTiet": [
      { "maVatTu": "VP-001", "soLuong": 10, "thanhTien": 850000 },
      { "maVatTu": "VP-002", "soLuong": 20, "thanhTien": 240000 }
    ],
    "ngayDeXuat": "2026-05-20T10:30:00"
  },
  "message": "Tạo đề xuất thành công"
}
```

**Validation:**
| Field | Rule |
|-------|------|
| tieuDe | Required, max 500 |
| khoaPhongId | Required, phải tồn tại |
| tongDuToan | Required, > 0 |
| chiTiet[].soLuong | Required, > 0 |
| chiTiet[].donGiaDuToan | Required, >= 0 |

---

## GET /api/de-xuat/{id}

Chi tiết đề xuất (bao gồm chi tiết vật tư).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "idCongKhai": "guid",
    "maDeXuat": "DX-2026-0001",
    "tieuDe": "Mua sắm văn phòng phẩm quý 2/2026",
    "moTa": "Bổ sung văn phòng phẩm...",
    "trangThai": "DRAFT",
    "tongDuToan": 25000000,
    "nguoiDeXuat": { "id": 10, "hoTen": "Nguyễn Văn A" },
    "khoaPhong": { "id": 5, "tenKhoaPhong": "Nội tổng hợp" },
    "chiTiet": [
      {
        "id": 1,
        "maVatTu": "VP-001",
        "tenVatTu": "Giấy A4 Double A",
        "donViTinh": "Thùng",
        "soLuong": 10,
        "donGiaDuToan": 85000,
        "thanhTien": 850000
      }
    ],
    "ngayDeXuat": "2026-05-20T10:30:00",
    "ngayCapNhat": "2026-05-20T14:00:00"
  }
}
```

---

## PUT /api/de-xuat/{id}

Cập nhật đề xuất (chỉ khi DRAFT).

**Request:** (giống POST, có thể gửi partial)

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật đề xuất thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_STATUS | Chỉ cập nhật được khi ở trạng thái DRAFT |

---

## DELETE /api/de-xuat/{id}

Xoá đề xuất (chỉ khi DRAFT).

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá đề xuất thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_STATUS | Chỉ xoá được khi ở trạng thái DRAFT |

---

## POST /api/de-xuat/{id}/submit

Trình duyệt đề xuất (DRAFT → PENDING).

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "trangThai": "PENDING" },
  "message": "Đã trình duyệt đề xuất"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_STATUS | Chỉ trình duyệt được khi ở trạng thái DRAFT |
| 400 | EMPTY_ITEMS | Đề xuất phải có ít nhất 1 vật tư |

---

## POST /api/de-xuat/{id}/approve

Phê duyệt đề xuất (chỉ dành cho người có quyền phê duyệt).

**Request:**
```json
{
  "ghiChu": "Đã phê duyệt, tiến hành tạo gói thầu"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "trangThai": "APPROVED" },
  "message": "Phê duyệt đề xuất thành công"
}
```

---

## POST /api/de-xuat/{id}/reject

Từ chối đề xuất.

**Request:**
```json
{
  "lyDo": "Ngân sách quý 2 đã hết, đề xuất vào quý 3"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "trangThai": "REJECTED" },
  "message": "Đã từ chối đề xuất"
}
```

---

## GET /api/de-xuat/{id}/chi-tiet

Chi tiết vật tư của đề xuất.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "maVatTu": "VP-001",
      "tenVatTu": "Giấy A4 Double A",
      "donViTinh": "Thùng",
      "soLuong": 10,
      "donGiaDuToan": 85000,
      "thanhTien": 850000
    }
  ]
}
```
