# Module Notification (3 APIs)

## GET /api/thong-bao

Danh sách thông báo của user hiện tại.

**Query:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Trang hiện tại |
| pageSize | int | 20 | Số bản ghi mỗi trang |
| daDoc | bool | - | Lọc đã đọc/chưa đọc |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "tieuDe": "Có việc cần xử lý",
        "noiDung": "Bạn được giao phê duyệt gói thầu GT-2026-0001",
        "loai": "WORKFLOW_ASSIGNMENT",
        "daDoc": false,
        "ngayTao": "2026-05-21T08:00:00",
        "thamChieu": { "loai": "GoiThau", "id": 1 }
      }
    ],
    "total": 15,
    "chuaDoc": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## PATCH /api/thong-bao/{id}/read

Đánh dấu đã đọc.

**Response 200:**
```json
{
  "success": true,
  "message": "Đã đánh dấu đã đọc"
}
```

---

## POST /api/thong-bao/read-all

Đánh dấu tất cả đã đọc.

**Response 200:**
```json
{
  "success": true,
  "message": "Đã đánh dấu tất cả là đã đọc"
}
```
