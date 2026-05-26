# Module Workflow Runtime (8 APIs)

## GET /api/workflow/pending

Danh sách pending tasks của user hiện tại.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "goiThauId": 1,
      "maGoiThau": "GT-2026-0001",
      "tenGoiThau": "Mua sắm máy siêu âm",
      "buocTen": "Phê duyệt gói thầu",
      "ngayGiao": "2026-05-21T08:00:00",
      "hanXuLy": "2026-05-24T08:00:00",
      "quaHan": false
    }
  ]
}
```

---

## GET /api/workflow/{instanceId}

Chi tiết workflow instance.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "goiThau": { "id": 1, "maGoiThau": "GT-2026-0001" },
    "workflow": { "id": 1, "tenWorkflow": "Quy trình đấu thầu chỉ định" },
    "trangThai": "ACTIVE",
    "buocHienTaiId": 2,
    "ngayBatDau": "2026-05-21T08:00:00",
    "ngayKetThuc": null,
    "lichSuHanhDong": [
      {
        "id": 1,
        "hanhDong": "START",
        "nguoiThucHien": { "id": 10, "hoTen": "Nguyễn Văn A" },
        "noiDung": "Khởi tạo workflow",
        "ngayThucHien": "2026-05-21T08:00:00"
      }
    ]
  }
}
```

---

## GET /api/workflow/{instanceId}/steps

Danh sách steps + trạng thái.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "buocWorkflowId": 1,
      "tenBuoc": "Lập gói thầu",
      "soThuTu": 1,
      "trangThai": "COMPLETED",
      "nguoiXuLy": { "id": 10, "hoTen": "Nguyễn Văn A" },
      "ngayBatDau": "2026-05-21T08:00:00",
      "ngayHoanThanh": "2026-05-21T08:30:00"
    },
    {
      "id": 2,
      "buocWorkflowId": 2,
      "tenBuoc": "Phê duyệt gói thầu",
      "soThuTu": 2,
      "trangThai": "PENDING",
      "nguoiXuLy": [{ "id": 5, "hoTen": "Trần Văn B" }],
      "ngayBatDau": "2026-05-21T08:30:00",
      "ngayHoanThanh": null
    }
  ]
}
```

---

## POST /api/workflow/{instanceId}/process

Xử lý bước (approve/reject).

**Request:**
```json
{
  "hanhDong": "APPROVE",
  "ghiChu": "Đã phê duyệt gói thầu",
  "dinhKemFileIds": [1, 2]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "buocTiepTheo": { "id": 3, "tenBuoc": "Tổ chức đấu thầu" },
    "nguoiXuLyTiep": [{ "id": 7, "hoTen": "Lê Văn C" }]
  },
  "message": "Đã phê duyệt"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_ACTION | Hành động không hợp lệ |
| 403 | NOT_ASSIGNED | Bạn không được gán xử lý bước này |
| 400 | INVALID_TRANSITION | Không thể chuyển từ bước hiện tại |

---

## POST /api/workflow/{instanceId}/rollback

Rollback về bước trước.

**Request:**
```json
{
  "lyDo": "Cần sửa thông tin gói thầu"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "buocRollback": { "id": 1, "tenBuoc": "Lập gói thầu" },
    "nguoiXuLy": { "id": 10, "hoTen": "Nguyễn Văn A" }
  },
  "message": "Đã rollback về bước Lập gói thầu"
}
```

---

## POST /api/workflow/{instanceId}/skip

Bỏ qua bước (nếu optional).

**Response 200:**
```json
{
  "success": true,
  "message": "Đã bỏ qua bước hiện tại"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | CANNOT_SKIP | Bước này không được phép bỏ qua |

---

## POST /api/workflow/{instanceId}/reassign

Chuyển người xử lý.

**Request:**
```json
{
  "nguoiDuocGiaoMoiId": 15,
  "lyDo": "Người cũ đang nghỉ phép"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Đã chuyển người xử lý cho Trần Văn D"
}
```

---

## GET /api/workflow/overdue

Danh sách steps quá hạn (dành cho admin).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "workflowInstanceId": 1,
      "maGoiThau": "GT-2026-0001",
      "buocTen": "Phê duyệt gói thầu",
      "nguoiXuLy": { "id": 5, "hoTen": "Trần Văn B" },
      "hanXuLy": "2026-05-24T08:00:00",
      "soNgayQuaHan": 2
    }
  ]
}
```
