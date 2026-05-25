# Module Tender Package (8 APIs)

## GET /api/goi-thau

Danh sách gói thầu (phân trang, filter).

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| search | string | - | Tìm theo tên/mã gói thầu |
| khoaPhongId | int | - | Lọc theo khoa/phòng |
| trangThai | string | - | Lọc theo trạng thái |
| hinhThucDauThauId | int | - | Lọc theo hình thức đấu thầu |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "idCongKhai": "guid",
        "maGoiThau": "GT-2026-0001",
        "tenGoiThau": "Mua sắm máy siêu âm",
        "trangThai": "DANG_DU_THAU",
        "hinhThucDauThau": "Đấu thầu rộng rãi",
        "nguoiTao": { "id": 10, "hoTen": "Nguyễn Văn A" },
        "khoaPhong": "Nội tổng hợp",
        "ngayTao": "2026-05-20T10:30:00"
      }
    ],
    "total": 45,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

---

## POST /api/goi-thau

Tạo gói thầu (từ đề xuất hoặc mới).

**Request (từ đề xuất):**
```json
{
  "deXuatId": 1,
  "tenGoiThau": "Mua sắm văn phòng phẩm quý 2/2026",
  "hinhThucDauThauId": 2,
  "ghiChu": "Gói thầu nhỏ"
}
```

**Request (mới):**
```json
{
  "tenGoiThau": "Mua sắm máy siêu âm",
  "moTa": "Máy siêu âm màu cho khoa Chẩn đoán hình ảnh",
  "khoaPhongId": 5,
  "hinhThucDauThauId": 2,
  "nguonVon": "Ngân sách nhà nước",
  "tongDuToan": 2500000000,
  "chiTiet": [
    {
      "maVatTu": "TB-001",
      "tenVatTu": "Máy siêu âm màu",
      "donViTinh": "Bộ",
      "soLuong": 1,
      "donGiaDuToan": 2500000000
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
    "maGoiThau": "GT-2026-0001",
    "tenGoiThau": "Mua sắm máy siêu âm",
    "trangThai": "DU_THAO",
    "tongDuToan": 2500000000
  },
  "message": "Tạo gói thầu thành công"
}
```

---

## GET /api/goi-thau/{id}

Chi tiết gói thầu.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "idCongKhai": "guid",
    "maGoiThau": "GT-2026-0001",
    "tenGoiThau": "Mua sắm máy siêu âm",
    "moTa": "Máy siêu âm màu...",
    "trangThai": "DANG_DU_THAU",
    "hinhThucDauThau": { "id": 2, "tenHinhThuc": "Đấu thầu rộng rãi" },
    "nguonVon": "Ngân sách nhà nước",
    "tongDuToan": 2500000000,
    "khoaPhong": { "id": 5, "tenKhoaPhong": "Nội tổng hợp" },
    "nguoiTao": { "id": 10, "hoTen": "Nguyễn Văn A" },
    "soLuongHoSo": 3,
    "nhaThauTrungThau": null,
    "ngayTao": "2026-05-20T10:30:00",
    "ngayCapNhat": "2026-05-21T08:00:00"
  }
}
```

---

## PUT /api/goi-thau/{id}

Cập nhật gói thầu (chỉ khi DU_THAO).

**Request:** (giống POST, partial)

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật gói thầu thành công"
}
```

---

## DELETE /api/goi-thau/{id}

Xoá gói thầu (chỉ khi DU_THAO).

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá gói thầu thành công"
}
```

---

## GET /api/goi-thau/{id}/chi-tiet

Chi tiết vật tư của gói thầu.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "maVatTu": "TB-001",
      "tenVatTu": "Máy siêu âm màu",
      "donViTinh": "Bộ",
      "soLuong": 1,
      "donGiaDuToan": 2500000000,
      "thanhTien": 2500000000
    }
  ]
}
```

---

## POST /api/goi-thau/{id}/start-workflow

Bắt đầu workflow cho gói thầu (DU_THAO → trong quy trình).

**Request:**
```json
{
  "workflowId": 1
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "workflowInstanceId": 1,
    "buocHienTai": "Phê duyệt gói thầu",
    "nguoiXuLy": [{ "id": 5, "hoTen": "Trần Văn B" }]
  },
  "message": "Đã khởi tạo workflow"
}
```

---

## GET /api/goi-thau/{id}/workflow

Xem workflow instance của gói thầu.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "workflowInstanceId": 1,
    "workflow": { "id": 1, "tenWorkflow": "Quy trình đấu thầu chỉ định" },
    "trangThai": "ACTIVE",
    "buocHienTai": {
      "id": 2,
      "tenBuoc": "Phê duyệt gói thầu",
      "nguoiXuLy": [{ "id": 5, "hoTen": "Trần Văn B" }],
      "ngayBatDau": "2026-05-21T08:00:00",
      "hanXuLy": "2026-05-24T08:00:00"
    },
    "cacBuocDaXuLy": [
      {
        "id": 1,
        "tenBuoc": "Lập gói thầu",
        "trangThai": "COMPLETED",
        "nguoiXuLy": { "id": 10, "hoTen": "Nguyễn Văn A" },
        "ngayHoanThanh": "2026-05-21T08:00:00"
      }
    ]
  }
}
```
