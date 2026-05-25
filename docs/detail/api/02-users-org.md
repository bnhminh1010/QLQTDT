# Module Users & Organization (9 APIs)

## GET /api/users

Danh sách user (phân trang, filter).

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| search | string | - | Tìm theo Họ tên / Email |
| khoaPhongId | int | - | Lọc theo khoa/phòng |
| trangThai | bool | - | Lọc theo trạng thái hoạt động |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "idCongKhai": "guid",
        "hoTen": "Nguyễn Văn A",
        "email": "a@benhvien.vn",
        "soDienThoai": "0901234567",
        "khoaPhong": "Nội tổng hợp",
        "vaiTro": ["TruongPhong"],
        "trangThaiHoatDong": true,
        "ngayDangNhapCuoi": "2026-05-20T10:00:00"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

---

## POST /api/users

Tạo user.

**Request:**
```json
{
  "hoTen": "Nguyễn Văn A",
  "email": "a@benhvien.vn",
  "soDienThoai": "0901234567",
  "tenDangNhap": "nguyenvana",
  "matKhau": "P@ssw0rd!",
  "khoaPhongId": 5,
  "vaiTroId": [2, 3]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 1, "idCongKhai": "guid", "hoTen": "Nguyễn Văn A" },
  "message": "Tạo user thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | DUPLICATE_USERNAME | Tên đăng nhập đã tồn tại |
| 400 | DUPLICATE_EMAIL | Email đã tồn tại |
| 400 | VALIDATION_ERROR | Dữ liệu không hợp lệ |

---

## GET /api/users/{id}

Chi tiết user.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "idCongKhai": "guid",
    "hoTen": "Nguyễn Văn A",
    "email": "a@benhvien.vn",
    "soDienThoai": "0901234567",
    "tenDangNhap": "nguyenvana",
    "khoaPhongId": 5,
    "khoaPhong": "Nội tổng hợp",
    "vaiTro": [{"id": 2, "ten": "TruongPhong"}],
    "trangThaiHoatDong": true,
    "ngayTao": "2026-01-01T00:00:00",
    "ngayCapNhat": "2026-05-20T10:00:00",
    "ngayDangNhapCuoi": "2026-05-20T10:00:00"
  }
}
```

---

## PUT /api/users/{id}

Cập nhật user.

**Request:**
```json
{
  "hoTen": "Nguyễn Văn B",
  "email": "b@benhvien.vn",
  "soDienThoai": "0901234568",
  "khoaPhongId": 3,
  "vaiTroId": [2]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "hoTen": "Nguyễn Văn B" },
  "message": "Cập nhật user thành công"
}
```

---

## PATCH /api/users/{id}/status

Khoá/Mở khoá user.

**Request:**
```json
{
  "trangThaiHoatDong": false,
  "lyDo": "Nghỉ việc"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "User đã bị khoá"
}
```

---

## GET /api/khoa-phong

Danh sách khoa/phòng.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "maKhoaPhong": "NOI",
      "tenKhoaPhong": "Nội tổng hợp",
      "moTa": "Khoa nội tổng hợp",
      "trangThaiHoatDong": true,
      "soLuongNhanVien": 25
    }
  ]
}
```

---

## POST /api/khoa-phong

Tạo khoa/phòng.

**Request:**
```json
{
  "maKhoaPhong": "NGOAI",
  "tenKhoaPhong": "Ngoại tổng hợp",
  "moTa": "Khoa ngoại tổng hợp"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 2, "maKhoaPhong": "NGOAI", "tenKhoaPhong": "Ngoại tổng hợp" },
  "message": "Tạo khoa/phòng thành công"
}
```

---

## PUT /api/khoa-phong/{id}

Cập nhật khoa/phòng.

**Request:**
```json
{
  "tenKhoaPhong": "Ngoại tổng hợp (Sửa)",
  "moTa": "Mô tả mới"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật khoa/phòng thành công"
}
```

---

## DELETE /api/khoa-phong/{id}

Xoá (soft) khoa/phòng.

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá khoa/phòng thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | HAS_REFERENCE | Khoa/phòng đang có user hoạt động |
