# Module Vendor (7 APIs)

## GET /api/nha-thau

Danh sách nhà thầu.

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| search | string | - | Tìm theo tên/MST |
| linhVuc | string | - | Lọc theo lĩnh vực hoạt động |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "idCongKhai": "guid",
        "tenNhaThau": "Công ty TNHH Thương mại XYZ",
        "maSoThue": "0123456789",
        "nguoiDaiDien": "Trần Văn B",
        "soDienThoai": "0901234567",
        "email": "info@xyz.vn",
        "linhVuc": "Thiết bị y tế",
        "trangThaiHoatDong": true
      }
    ],
    "total": 80,
    "page": 1,
    "pageSize": 20,
    "totalPages": 4
  }
}
```

---

## POST /api/nha-thau

Tạo nhà thầu.

**Request:**
```json
{
  "tenNhaThau": "Công ty TNHH Thương mại XYZ",
  "maSoThue": "0123456789",
  "nguoiDaiDien": "Trần Văn B",
  "soDienThoai": "0901234567",
  "email": "info@xyz.vn",
  "diaChi": "123 Nguyễn Huệ, Q.1, TP.HCM",
  "linhVuc": "Thiết bị y tế",
  "soTaiKhoan": "1234567890",
  "tenNganHang": "Vietcombank"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 1, "tenNhaThau": "Công ty TNHH Thương mại XYZ" },
  "message": "Tạo nhà thầu thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | DUPLICATE_MST | Mã số thuế đã tồn tại |

---

## PUT /api/nha-thau/{id}

Cập nhật nhà thầu.

**Request:** (partial)
```json
{
  "soDienThoai": "0901234568",
  "email": "contact@xyz.vn"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật nhà thầu thành công"
}
```

---

## GET /api/nha-thau/{id}/ho-so-nang-luc

Hồ sơ năng lực của nhà thầu.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "nhaThau": { "id": 1, "tenNhaThau": "Công ty TNHH Thương mại XYZ" },
    "hoSo": [
      {
        "id": 1,
        "tenTaiLieu": "Giấy phép kinh doanh",
        "loai": "GPKD",
        "ngayHetHan": "2027-01-01",
        "file": { "id": 10, "tenFileGoc": "dk_kinh_doanh.pdf" }
      },
      {
        "id": 2,
        "tenTaiLieu": "Chứng chỉ ISO",
        "loai": "CHUNGCHI",
        "ngayHetHan": "2026-12-31",
        "file": { "id": 11, "tenFileGoc": "iso_cert.pdf" }
      }
    ]
  }
}
```

---

## POST /api/nha-thau/{id}/ho-so-nang-luc

Upload hồ sơ năng lực.

**Request (multipart):**
| Field | Type | Description |
|-------|------|-------------|
| file | File | File hồ sơ năng lực |
| tenTaiLieu | string | Tên tài liệu |
| loai | string | Loại hồ sơ (GPKD, CHUNGCHI, etc) |
| ngayHetHan | date | Ngày hết hạn (optional) |

**Response 201:**
```json
{
  "success": true,
  "message": "Upload hồ sơ năng lực thành công"
}
```

---

## DELETE /api/nha-thau/{id}/ho-so-nang-luc/{fileId}

Xoá hồ sơ năng lực.

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá hồ sơ năng lực thành công"
}
```

---

## GET /api/nha-thau/{id}/ls-du-thau

Lịch sử đấu thầu của nhà thầu.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "goiThauId": 1,
      "maGoiThau": "GT-2025-0015",
      "tenGoiThau": "Mua sắm máy X-quang",
      "giaDuThau": 1200000000,
      "ketQua": "TRUNG_THAU",
      "giaTrungThau": 1150000000,
      "ngayDuThau": "2025-11-01",
      "ngayTraKetQua": "2025-11-30"
    }
  ]
}
```
