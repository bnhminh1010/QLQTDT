# Module Audit Log (2 APIs)

## GET /api/audit-log

Danh sách audit log (phân trang, filter).

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| bang | string | - | Lọc theo tên bảng (GoiThau, DeXuat, etc) |
| hanhDong | string | - | Lọc theo hành động (INSERT, UPDATE, DELETE) |
| nguoiThucHienId | int | - | Lọc theo người thực hiện |
| tuNgay | date | - | Từ ngày |
| denNgay | date | - | Đến ngày |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "bang": "GoiThau",
        "banGhiId": 1,
        "hanhDong": "UPDATE",
        "duLieuCu": "{\"trangThai\": \"DU_THAO\"}",
        "duLieuMoi": "{\"trangThai\": \"DANG_DU_THAU\"}",
        "nguoiThucHien": { "id": 10, "hoTen": "Nguyễn Văn A" },
        "diaChiIP": "192.168.1.100",
        "ngayThucHien": "2026-05-21T08:00:00"
      }
    ],
    "total": 5000,
    "page": 1,
    "pageSize": 20,
    "totalPages": 250
  }
}
```

---

## GET /api/audit-log/goi-thau/{id}

Audit log theo gói thầu.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "hanhDong": "INSERT",
      "noiDung": "Tạo gói thầu",
      "nguoiThucHien": { "id": 10, "hoTen": "Nguyễn Văn A" },
      "ngayThucHien": "2026-05-20T10:30:00"
    },
    {
      "id": 2,
      "hanhDong": "START_WORKFLOW",
      "noiDung": "Bắt đầu workflow #1",
      "nguoiThucHien": { "id": 10, "hoTen": "Nguyễn Văn A" },
      "ngayThucHien": "2026-05-21T08:00:00"
    }
  ]
}
```
