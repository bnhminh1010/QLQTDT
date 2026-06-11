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

Lấy thông tin user hiện tại (bao gồm danh sách quyền để Frontend phân quyền UI).

**Response 200:**
```json
{
  "idCongKhai": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tenDangNhap": "admin",
  "hoTen": "Nguyễn Văn A",
  "email": "a@benhvien.vn",
  "trangThaiHoatDong": true,
  "ngayTao": "2026-01-15T08:00:00",
  "avatarUrl": null,
  "roles": [
    {
      "khoaPhongId": 5,
      "tenKhoaPhong": "Nội tổng hợp",
      "maKhoaPhong": "NTH",
      "vaiTroId": 2,
      "tenVaiTro": "PHONG_QLDT",
      "laChinh": true
    }
  ],
  "quyen": [
    "DEXUAT.APPROVE",
    "DEXUAT.CREATE",
    "DEXUAT.DELETE",
    "DEXUAT.EDIT",
    "DEXUAT.SUBMIT",
    "DEXUAT.VIEW",
    "GOITHAU.VIEW"
  ]
}
```

### Trường `quyen` — Hướng dẫn Frontend (Task [BE][008])

Mảng `quyen` chứa danh sách `MaQuyen` (string) của user hiện tại. Đặc điểm:
- **Sorted alphabetically** — thứ tự ổn định giữa các lần gọi.
- **Distinct** — không bao giờ có quyền trùng lặp.
- **Mảng rỗng `[]`** nếu user bị khóa (`trangThaiHoatDong = false`).
- **Lọc soft-delete** — quyền và vai trò đã bị xoá mềm sẽ không xuất hiện.

**Cách sử dụng trên Frontend:**
```javascript
const res = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
const user = await res.json();

// 1. Render menu theo quyền
if (user.quyen.includes("DEXUAT.VIEW")) showMenu("Đề xuất mua sắm");

// 2. Ẩn/hiện button chức năng
if (user.quyen.includes("DEXUAT.CREATE")) showButton("Tạo đề xuất");

// 3. Kiểm tra quyền trước khi gọi API
if (user.quyen.includes("DEXUAT.APPROVE")) enableApproveAction();
```

> **Lưu ý**: Mảng `quyen` cũng được trả về trong response của `POST /api/auth/login` và `POST /api/auth/google` (nằm trong `user.quyen`), nên Frontend có thể cache ngay sau khi đăng nhập mà không cần gọi thêm `/api/auth/me`.

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token không hợp lệ |

---//

## GET /api/auth/permissions

*(Phương án dự phòng)*: Lấy trực tiếp danh sách quyền của người dùng hiện tại mà không kèm thông tin tài khoản (trả về mảng JSON string thẳng).

**Response 200:**
```json
[
  "DEXUAT.APPROVE",
  "DEXUAT.CREATE",
  "DEXUAT.DELETE",
  "DEXUAT.EDIT",
  "DEXUAT.SUBMIT",
  "DEXUAT.VIEW"
]
```

> **Lưu ý**: Endpoint này có cùng đặc điểm với mảng `quyen` của `GET /api/auth/me` (đã sort, không trùng, mảng rỗng nếu bị khóa). Khuyến nghị Frontend ưu tiên dùng dữ liệu trả về từ `/api/auth/me` để tối ưu số lần gọi API.

**Errors:**
| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token không hợp lệ |
