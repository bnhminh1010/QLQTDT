# Module Contract (11 APIs)

## GET /api/hop-dong

Danh sách hợp đồng (phân trang, filter).

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| search | string | - | Tìm theo số/mã hợp đồng |
| goiThauId | int | - | Lọc theo gói thầu |
| nhaThauId | int | - | Lọc theo nhà thầu |
| trangThai | string | - | Lọc theo trạng thái |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "soHopDong": "HD-2026-0001",
        "tenHopDong": "Hợp đồng mua máy siêu âm",
        "goiThau": { "id": 1, "maGoiThau": "GT-2026-0001" },
        "nhaThau": { "id": 1, "tenNhaThau": "Công ty TNHH XYZ" },
        "giaTri": 2350000000,
        "trangThai": "DANG_THUC_HIEN",
        "ngayKy": "2026-06-01",
        "ngayHetHan": "2026-09-01"
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

---

## POST /api/hop-dong

Tạo hợp đồng.

**Request:**
```json
{
  "goiThauId": 1,
  "nhaThauId": 1,
  "tenHopDong": "Hợp đồng mua máy siêu âm",
  "giaTri": 2350000000,
  "ngayKy": "2026-06-01",
  "ngayHieuLuc": "2026-06-01",
  "ngayHetHan": "2026-09-01",
  "dieuKhoanThanhToan": "Thanh toán 2 đợt: 50% sau khi ký, 50% sau nghiệm thu",
  "dinhKemFileIds": [8, 9]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "soHopDong": "HD-2026-0001",
    "trangThai": "NHAP"
  },
  "message": "Tạo hợp đồng thành công"
}
```

**Business Rules:**
- Tự sinh SoHopDong = "HD-{year}-{seq}"
- TrangThai mặc định = "NHAP"

---

## GET /api/hop-dong/{id}

Chi tiết hợp đồng.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "soHopDong": "HD-2026-0001",
    "tenHopDong": "Hợp đồng mua máy siêu âm",
    "goiThau": { "id": 1, "maGoiThau": "GT-2026-0001" },
    "nhaThau": {
      "id": 1,
      "tenNhaThau": "Công ty TNHH XYZ",
      "maSoThue": "0123456789"
    },
    "giaTri": 2350000000,
    "trangThai": "DANG_THUC_HIEN",
    "ngayKy": "2026-06-01",
    "ngayHieuLuc": "2026-06-01",
    "ngayHetHan": "2026-09-01",
    "dieuKhoanThanhToan": "Thanh toán 2 đợt...",
    "phuLuc": [
      { "id": 1, "soPhuLuc": "PL-2026-0001", "giaTriDieuChinh": 50000000 }
    ],
    "nghiemThu": [
      { "id": 1, "lan": 1, "trangThai": "DA_NGHIEM_THU", "ngayNghiemThu": "2026-07-01" }
    ],
    "file": [{ "id": 8, "tenFileGoc": "hop_dong.pdf" }],
    "ngayTao": "2026-06-01T08:00:00"
  }
}
```

---

## PUT /api/hop-dong/{id}

Cập nhật hợp đồng (chỉ khi NHAP).

**Request:** (partial)
```json
{
  "tenHopDong": "Hợp đồng mua máy siêu âm màu",
  "dieuKhoanThanhToan": "Thanh toán 1 lần sau nghiệm thu"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật hợp đồng thành công"
}
```

---

## POST /api/hop-dong/{id}/phu-luc

Thêm phụ lục hợp đồng.

**Request:**
```json
{
  "soPhuLuc": "PL-2026-0001",
  "noiDung": "Điều chỉnh thời gian giao hàng",
  "giaTriDieuChinh": 50000000,
  "ngayKy": "2026-07-01",
  "dinhKemFileIds": [10]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 1, "soPhuLuc": "PL-2026-0001" },
  "message": "Thêm phụ lục thành công"
}
```

---

## GET /api/hop-dong/{id}/phu-luc

Danh sách phụ lục.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "soPhuLuc": "PL-2026-0001",
      "noiDung": "Điều chỉnh thời gian giao hàng",
      "giaTriDieuChinh": 50000000,
      "ngayKy": "2026-07-01",
      "file": [{ "id": 10, "tenFileGoc": "phu_luc.pdf" }]
    }
  ]
}
```

---

## POST /api/hop-dong/{id}/nghiem-thu

Tạo nghiệm thu.

**Request:**
```json
{
  "lan": 1,
  "noiDung": "Nghiệm thu đợt 1: bàn giao thiết bị",
  "ngayNghiemThu": "2026-07-15",
  "ketQua": "DAT",
  "nhanXet": "Thiết bị đúng chủng loại, hoạt động tốt",
  "dinhKemFileIds": [11]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 1, "lan": 1, "ketQua": "DAT" },
  "message": "Tạo nghiệm thu thành công"
}
```

---

## GET /api/hop-dong/{id}/nghiem-thu

Danh sách nghiệm thu.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lan": 1,
      "noiDung": "Nghiệm thu đợt 1",
      "ngayNghiemThu": "2026-07-15",
      "ketQua": "DAT",
      "nhanXet": "Thiết bị đúng chủng loại",
      "file": [{ "id": 11, "tenFileGoc": "bien_ban_nghiem_thu.pdf" }]
    }
  ]
}
```

---

## POST /api/hop-dong/{id}/quyet-toan

Tạo quyết toán.

**Request:**
```json
{
  "soQuyetToan": "QT-2026-0001",
  "giaTriThucTe": 2400000000,
  "noiDung": "Quyết toán hợp đồng mua máy siêu âm",
  "ngayQuyetToan": "2026-08-15",
  "dinhKemFileIds": [12]
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 1, "soQuyetToan": "QT-2026-0001" },
  "message": "Tạo quyết toán thành công"
}
```

---

## GET /api/hop-dong/{id}/quyet-toan

Chi tiết quyết toán.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "soQuyetToan": "QT-2026-0001",
    "giaTriHopDong": 2350000000,
    "giaTriThucTe": 2400000000,
    "chenhLech": 50000000,
    "noiDung": "Quyết toán hợp đồng mua máy siêu âm",
    "ngayQuyetToan": "2026-08-15",
    "file": [{ "id": 12, "tenFileGoc": "quyet_toan.pdf" }]
  }
}
```

---

## PATCH /api/hop-dong/{id}/status

Cập nhật trạng thái hợp đồng.

**Request:**
```json
{
  "trangThai": "DANG_THUC_HIEN",
  "ghiChu": "Hợp đồng đã có hiệu lực"
}
```

**State Machine:**
```
NHAP → DA_KY → DANG_THUC_HIEN → DA_NGHIEM_THU → DA_QUYET_TOAN → DA_TAT_TOAN
                                       ↓             ↓
                                TAM_DUNG      HUY
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái hợp đồng thành công"
}
```
