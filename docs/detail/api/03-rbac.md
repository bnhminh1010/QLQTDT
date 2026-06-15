# Module RBAC (12 APIs)

## GET /api/roles

Danh sách vai trò.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenVaiTro": "QuanTriHeThong",
      "moTa": "Quản trị hệ thống",
      "daXoa": false
    }
  ]
}
```

---

## POST /api/roles

Tạo vai trò.

**Request:**
```json
{
  "tenVaiTro": "KeToan",
  "moTa": "Kế toán thanh toán"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 5, "tenVaiTro": "KeToan" },
  "message": "Tạo vai trò thành công"
}
```

---

## PUT /api/roles/{id}

Cập nhật vai trò.

**Request:**
```json
{
  "tenVaiTro": "KeToanTruong",
  "moTa": "Kế toán trưởng"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật vai trò thành công"
}
```

---

## DELETE /api/roles/{id}

Xoá (soft) vai trò.

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá vai trò thành công"
}
```

---

## GET /api/permissions

Danh sách quyền.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "maQuyen": "DeXuat.Create",
      "tenQuyen": "Tạo đề xuất",
      "nhomQuyen": "DeXuat"
    }
  ]
}
```

---

## POST /api/permissions

Tạo quyền.

**Request:**
```json
{
  "maQuyen": "HopDong.Sign",
  "tenQuyen": "Ký hợp đồng",
  "nhomQuyen": "HopDong"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 20, "maQuyen": "HopDong.Sign" },
  "message": "Tạo quyền thành công"
}
```

---

## PUT /api/permissions/{id}

Cập nhật quyền.

**Request:**
```json
{
  "tenQuyen": "Ký duyệt hợp đồng",
  "nhomQuyen": "HopDong"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật quyền thành công"
}
```

---

## DELETE /api/permissions/{id}

Xoá (soft) quyền.

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá quyền thành công"
}
```

---

## POST /api/roles/{id}/permissions

Gán quyền cho role.

**Request:**
```json
{
  "permissionIds": [1, 2, 3, 5, 8]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật quyền cho vai trò thành công"
}
```

---

## GET /api/roles/{id}/permissions

Lấy quyền của role.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "vaiTro": { "id": 1, "tenVaiTro": "QuanTriHeThong" },
    "quyen": [
      { "id": 1, "maQuyen": "DeXuat.Create" },
      { "id": 2, "maQuyen": "DeXuat.Approve" }
    ]
  }
}
```

---

## POST /api/users/{id}/assign-role

Gán user vào khoa/phòng với vai trò.

**Request:**
```json
{
  "khoaPhongId": 5,
  "vaiTroId": 2
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Phân vai trò thành công"
}
```

---

## GET /api/users/{id}/roles

Lấy roles của user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "khoaPhong": "Nội tổng hợp",
      "vaiTro": { "id": 2, "tenVaiTro": "TruongPhong" },
      "quyen": ["DeXuat.Create", "DeXuat.Approve"]
    }
  ]
}
```
