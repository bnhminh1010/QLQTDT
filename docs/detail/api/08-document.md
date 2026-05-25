# Module Document (4 APIs)

## POST /api/files/upload

Upload file (multipart). Hỗ trợ multiple files.

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
| Field | Type | Description |
|-------|------|-------------|
| files | File[] | Danh sách file cần upload |
| goiThauId | int | ID gói thầu (optional) |
| deXuatId | int | ID đề xuất (optional) |
| loaiTaiLieu | string | Loại tài liệu (HOSO_NANGLUC, HOSO_DUTHAU, HOPDONG, etc) |

**Response 201:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenFileGoc": "ho_so_nang_luc.pdf",
      "tenFileFtp": "2026/05/21/guid.pdf",
      "kichThuoc": 2048576,
      "loaiTaiLieu": "HOSO_NANGLUC"
    }
  ],
  "message": "Upload thành công 1 file"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | FILE_TOO_LARGE | File vượt quá kích thước cho phép (50MB) |
| 400 | INVALID_TYPE | Loại file không được hỗ trợ |
| 500 | FTP_ERROR | Lỗi upload lên FTP server |

---

## GET /api/files/{id}

Download file.

**Response 200:** (Binary file stream)

**Headers:**
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="ho_so_nang_luc.pdf"
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | File không tồn tại |

---

## DELETE /api/files/{id}

Xoá file (soft delete).

**Response 200:**
```json
{
  "success": true,
  "message": "Xoá file thành công"
}
```

---

## GET /api/files

Danh sách file (filter theo đối tượng).

**Query:**
| Param | Type | Description |
|-------|------|-------------|
| goiThauId | int | Lọc theo gói thầu |
| deXuatId | int | Lọc theo đề xuất |
| loaiTaiLieu | string | Lọc theo loại tài liệu |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenFileGoc": "ho_so_nang_luc.pdf",
      "kichThuoc": 2048576,
      "loaiTaiLieu": "HOSO_NANGLUC",
      "nguoiUpload": { "id": 10, "hoTen": "Nguyễn Văn A" },
      "ngayUpload": "2026-05-21T10:00:00"
    }
  ]
}
```
