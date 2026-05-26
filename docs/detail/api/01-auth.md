# Module Auth (6 APIs)

## POST /api/auth/login

Đăng nhập, trả JWT trong HttpOnly cookie.

**Request:**
```json
{
  "tenDangNhap": "string",
  "matKhau": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "idCongKhai": "guid",
    "hoTen": "Nguyễn Văn A",
    "email": "a@benhvien.vn",
    "vaiTro": ["TruongPhong"],
    "khoaPhong": "Nội tổng hợp",
    "tokenExpires": "2026-05-21T11:00:00"
  }
}
```

**Set-Cookie:** `refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api`

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_CREDENTIALS | Sai tên đăng nhập hoặc mật khẩu |
| 403 | ACCOUNT_LOCKED | Tài khoản đã bị khoá |

---

## POST /api/auth/logout

Đăng xuất, clear cookie.

**Response 200:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

---

## POST /api/auth/refresh

Refresh access token.

**Cookie:** refreshToken

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "expires": "2026-05-21T11:00:00"
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | INVALID_REFRESH_TOKEN | Refresh token không hợp lệ |

---

## POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "a@benhvien.vn"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Email khôi phục mật khẩu đã được gửi"
}
```

---

## POST /api/auth/reset-password

**Request:**
```json
{
  "token": "reset-token",
  "matKhauMoi": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại"
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_TOKEN | Token không hợp lệ hoặc đã hết hạn |
| 400 | WEAK_PASSWORD | Mật khẩu không đủ mạnh |

---

## GET /api/auth/me

Lấy thông tin user hiện tại.

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
    "khoaPhongId": 5,
    "khoaPhong": "Nội tổng hợp",
    "vaiTro": ["TruongPhong"],
    "quyen": ["DeXuat.Create", "DeXuat.Approve"],
    "ngayDangNhapCuoi": "2026-05-20T10:00:00"
  }
}
```

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token không hợp lệ |
