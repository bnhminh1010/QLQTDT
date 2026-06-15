# Module Bidding (6 APIs)

## GET /api/ho-so-du-thau

Danh sách hồ sơ dự thầu.

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| goiThauId | int | - | Lọc theo gói thầu |
| nhaThauId | int | - | Lọc theo nhà thầu |
| ketQua | string | - | Lọc theo kết quả |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "idCongKhai": "guid",
        "maHoSo": "HSDT-2026-0001",
        "goiThau": { "id": 1, "maGoiThau": "GT-2026-0001", "tenGoiThau": "Mua sắm máy siêu âm" },
        "nhaThau": { "id": 1, "tenNhaThau": "Công ty TNHH XYZ" },
        "giaDuThau": 2400000000,
        "ketQua": "DANG_XET",
        "ngayNop": "2026-05-25T10:00:00"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

---

## POST /api/ho-so-du-thau

Nộp hồ sơ dự thầu.

**Request:**
```json
{
  "goiThauId": 1,
  "nhaThauId": 1,
  "giaDuThau": 2400000000,
  "thoiGianBaoHanh": 24,
  "thoiGianGiaoHang": 30,
  "dinhKemFileIds": [5, 6, 7]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "maHoSo": "HSDT-2026-0001",
    "giaDuThau": 2400000000,
    "ketQua": "DANG_XET"
  },
  "message": "Nộp hồ sơ dự thầu thành công"
}
```

**Business Rules:**
- Mỗi nhà thầu chỉ nộp 1 hồ sơ/gói thầu
- Tự sinh MaHoSo = "HSDT-{year}-{seq}"
- KetQua mặc định = "DANG_XET"

---

## GET /api/ho-so-du-thau/{id}

Chi tiết hồ sơ.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "maHoSo": "HSDT-2026-0001",
    "goiThau": { "id": 1, "maGoiThau": "GT-2026-0001" },
    "nhaThau": {
      "id": 1,
      "tenNhaThau": "Công ty TNHH XYZ",
      "maSoThue": "0123456789"
    },
    "giaDuThau": 2400000000,
    "thoiGianBaoHanh": 24,
    "thoiGianGiaoHang": 30,
    "ketQua": "DANG_XET",
    "diemDanhGia": null,
    "nhanXet": null,
    "file": [
      { "id": 5, "tenFileGoc": "ho_so_du_thau.pdf" }
    ],
    "ngayNop": "2026-05-25T10:00:00"
  }
}
```

---

## POST /api/ho-so-du-thau/{id}/evaluate

Đánh giá hồ sơ (cập nhật kết quả).

**Request:**
```json
{
  "ketQua": "DAT",
  "diemDanhGia": 85,
  "nhanXet": "Hồ sơ đáp ứng yêu cầu kỹ thuật, giá hợp lý"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "ketQua": "DAT", "diemDanhGia": 85 },
  "message": "Đánh giá hồ sơ thành công"
}
```

---

## POST /api/goi-thau/{id}/award

Chọn nhà thầu trúng thầu.

**Request:**
```json
{
  "hoSoDuThauId": 1,
  "giaTrungThau": 2350000000,
  "lyDo": "Giá thấp nhất, đáp ứng kỹ thuật"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "goiThauTrangThai": "DA_CHON_NHA_THAU",
    "nhaThauTrungThau": { "id": 1, "tenNhaThau": "Công ty TNHH XYZ" },
    "giaTrungThau": 2350000000
  },
  "message": "Chọn nhà thầu trúng thầu thành công"
}
```

**Business Rules:**
- Chỉ chọn khi trạng thái gói thầu = "DANG_XET_HO_SO"
- Các hồ sơ không trúng tự động chuyển "KHONG_TRUNG"

---

## GET /api/goi-thau/{id}/results

Kết quả đấu thầu.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "goiThau": { "id": 1, "maGoiThau": "GT-2026-0001", "tenGoiThau": "Mua sắm máy siêu âm" },
    "tongDuToan": 2500000000,
    "giaTrungThau": 2350000000,
    "tietKiem": 150000000,
    "tiLeTietKiem": 6,
    "nhaThauTrungThau": {
      "id": 1,
      "tenNhaThau": "Công ty TNHH XYZ",
      "giaDuThau": 2400000000,
      "giaTrungThau": 2350000000
    },
    "cacNhaThauKhac": [
      {
        "id": 2,
        "tenNhaThau": "Công ty ABC",
        "giaDuThau": 2480000000,
        "ketQua": "KHONG_TRUNG"
      }
    ]
  }
}
```
