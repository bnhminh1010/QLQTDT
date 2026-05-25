# Module Integration (3 APIs)

## POST /api/integration/sync

Đồng bộ dữ liệu với hệ thống ngoài.

**Request:**
```json
{
  "heThong": "HIS",
  "loai": "NHAN_SU",
  "ngayTu": "2026-05-01T00:00:00"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tongSoBanGhi": 150,
    "soLuongThemMoi": 10,
    "soLuongCapNhat": 140,
    "soLuongLoi": 0
  },
  "message": "Đồng bộ thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 500 | SYNC_ERROR | Lỗi kết nối đến hệ thống HIS |

---

## GET /api/integration/logs

Danh sách log đồng bộ.

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| heThong | string | - | Lọc theo hệ thống |
| trangThai | string | - | Lọc theo trạng thái (THANH_CONG, THAT_BAI) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "heThong": "HIS",
        "loai": "NHAN_SU",
        "trangThai": "THANH_CONG",
        "soLuongXuLy": 150,
        "soLuongLoi": 0,
        "thoiGianBatDau": "2026-05-20T02:00:00",
        "thoiGianKetThuc": "2026-05-20T02:05:30",
        "noiDungLoi": null
      }
    ],
    "total": 300,
    "page": 1,
    "pageSize": 20,
    "totalPages": 15
  }
}
```

---

## POST /api/integration/retry/{logId}

Thử lại đồng bộ thất bại.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "logId": 1,
    "trangThai": "DANG_DONG_BO"
  },
  "message": "Đang thử lại đồng bộ"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Log không tồn tại |
| 400 | INVALID_STATUS | Chỉ thử lại khi trạng thái THAT_BAI |
