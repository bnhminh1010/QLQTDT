# Module Workflow Configuration (12 APIs)

## GET /api/hinh-thuc-dau-thau

Danh sách hình thức đấu thầu.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenHinhThuc": "Chỉ định thầu",
      "moTa": "Chỉ định nhà thầu cho gói thầu đặc thù",
      "giaTriToiDa": 500000000
    },
    {
      "id": 2,
      "tenHinhThuc": "Đấu thầu rộng rãi",
      "moTa": "Công khai mời thầu trên báo",
      "giaTriToiDa": null
    }
  ]
}
```

---

## POST /api/hinh-thuc-dau-thau

Tạo hình thức đấu thầu.

**Request:**
```json
{
  "tenHinhThuc": "Chào hàng cạnh tranh",
  "moTa": "Chào hàng cạnh tranh cho gói thầu nhỏ",
  "giaTriToiDa": 200000000
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 3, "tenHinhThuc": "Chào hàng cạnh tranh" },
  "message": "Tạo hình thức đấu thầu thành công"
}
```

---

## GET /api/workflows

Danh sách workflow template.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenWorkflow": "Quy trình đấu thầu chỉ định",
      "moTa": "Dành cho gói thầu chỉ định dưới 500tr",
      "hinhThucDauThauId": 1,
      "soBuoc": 4,
      "trangThaiHoatDong": true
    }
  ]
}
```

---

## POST /api/workflows

Tạo workflow.

**Request:**
```json
{
  "tenWorkflow": "Quy trình mua sắm thường xuyên",
  "moTa": "Quy trình cho mua sắm hàng hoá thông thường",
  "hinhThucDauThauId": null
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 3, "tenWorkflow": "Quy trình mua sắm thường xuyên" },
  "message": "Tạo workflow thành công"
}
```

---

## PUT /api/workflows/{id}

Cập nhật workflow.

**Request:**
```json
{
  "tenWorkflow": "Quy trình mua sắm thường xuyên (Cập nhật)",
  "moTa": "Mô tả mới"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật workflow thành công"
}
```

---

## DELETE /api/workflows/{id}

Xoá workflow (soft).

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá workflow thành công"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | HAS_INSTANCE | Workflow đang có instance đang chạy |

---

## GET /api/workflows/{id}/steps

Danh sách bước của workflow (theo số thứ tự).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenBuoc": "Lập đề xuất",
      "soThuTu": 1,
      "vaiTroXuLyId": 2,
      "choPhepBoQua": false,
      "soNgaySLA": 2,
      "moTa": "Khoa/phòng lập đề xuất mua sắm"
    },
    {
      "id": 2,
      "tenBuoc": "Phê duyệt đề xuất",
      "soThuTu": 2,
      "vaiTroXuLyId": 3,
      "choPhepBoQua": false,
      "soNgaySLA": 3,
      "moTa": "Ban lãnh đạo phê duyệt"
    }
  ]
}
```

---

## POST /api/workflows/{id}/steps

Thêm bước vào workflow.

**Request:**
```json
{
  "tenBuoc": "Tổ chức đấu thầu",
  "soThuTu": 3,
  "vaiTroXuLyId": 4,
  "choPhepBoQua": false,
  "soNgaySLA": 7,
  "moTa": "Phòng đấu thầu tổ chức"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 3, "tenBuoc": "Tổ chức đấu thầu" },
  "message": "Thêm bước thành công"
}
```

---

## PUT /api/workflows/steps/{id}

Cập nhật bước.

**Request:**
```json
{
  "tenBuoc": "Tổ chức đấu thầu (sửa)",
  "soNgaySLA": 10
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật bước thành công"
}
```

---

## DELETE /api/workflows/steps/{id}

Xoá bước.

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá bước thành công"
}
```

---

## POST /api/workflows/{id}/transitions

Tạo transition giữa 2 bước.

**Request:**
```json
{
  "tuBuocId": 1,
  "denBuocId": 2,
  "tenHanhDong": "APPROVE",
  "dieuKien": "tongDuToan < 500000000"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Tạo transition thành công"
}
```

---

## GET /api/workflows/{id}/transitions

Danh sách transition.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "tuBuoc": { "id": 1, "tenBuoc": "Lập đề xuất" },
      "denBuoc": { "id": 2, "tenBuoc": "Phê duyệt đề xuất" },
      "tenHanhDong": "APPROVE",
      "dieuKien": null
    }
  ]
}
```
