# Dev #1 — Auth + RBAC + Users & Organization

## APIs cần implement: 29 APIs

| # | API | Module | Priority |
|---|-----|--------|----------|
| 1 | POST /api/auth/login | Auth | P0 |
| 2 | POST /api/auth/logout | Auth | P0 |
| 3 | POST /api/auth/refresh | Auth | P0 |
| 4 | POST /api/auth/forgot-password | Auth | P0 |
| 5 | POST /api/auth/reset-password | Auth | P0 |
| 6 | GET /api/auth/me | Auth | P0 |
| 7 | GET /api/users | Users | P0 |
| 8 | POST /api/users | Users | P0 |
| 9 | GET /api/users/{id} | Users | P0 |
| 10 | PUT /api/users/{id} | Users | P0 |
| 11 | PATCH /api/users/{id}/status | Users | P0 |
| 12 | GET /api/khoa-phong | Org | P1 |
| 13 | POST /api/khoa-phong | Org | P1 |
| 14 | PUT /api/khoa-phong/{id} | Org | P1 |
| 15 | DELETE /api/khoa-phong/{id} | Org | P1 |
| 16 | GET /api/roles | RBAC | P0 |
| 17 | POST /api/roles | RBAC | P0 |
| 18 | PUT /api/roles/{id} | RBAC | P0 |
| 19 | DELETE /api/roles/{id} | RBAC | P0 |
| 20 | GET /api/permissions | RBAC | P0 |
| 21 | POST /api/permissions | RBAC | P0 |
| 22 | PUT /api/permissions/{id} | RBAC | P0 |
| 23 | DELETE /api/permissions/{id} | RBAC | P0 |
| 24 | POST /api/roles/{id}/permissions | RBAC | P0 |
| 25 | GET /api/roles/{id}/permissions | RBAC | P0 |
| 26 | POST /api/users/{id}/assign-role | RBAC | P0 |
| 27 | GET /api/users/{id}/roles | RBAC | P0 |

## Task breakdown

### Phase 1: Auth (6 APIs)
1. Tạo `AuthController.cs`
2. Tạo `IAuthService.cs` / `AuthService.cs`
3. Implement đăng nhập: validate credentials, tạo JWT, set HttpOnly cookie
4. Implement refresh token: refresh token → new access token
5. Implement forgot/reset password: gửi email
6. Implement logout: clear cookie
7. Implement GET /me: decode token → query user info + roles + permissions

### Phase 2: Users + Organization (9 APIs)
1. Tạo `UsersController.cs`, `KhoaPhongController.cs`
2. Tạo `UserService.cs`, `KhoaPhongService.cs`
3. CRUD Users: validate unique username/email, hash password, soft delete
4. CRUD KhoaPhong: validate not in use before delete
5. PATCH status: khoá/mở khoá user

### Phase 3: RBAC (12 APIs)
1. Tạo `RolesController.cs`, `PermissionsController.cs`
2. Tạo `RbacService.cs`
3. CRUD Roles + Permissions (soft delete)
4. Gán quyền cho role (bulk replace)
5. Gán user → khoaphong → role
6. Lấy quyền của user (denormalized permission list for auth/me)

### Audit Log (thêm 2 APIs)
| # | API | Priority |
|---|-----|----------|
| 28 | GET /api/audit-log | P1 |
| 29 | GET /api/audit-log/goi-thau/{id} | P1 |

- Tạo `AuditLogController.cs` + `AuditService.cs`
- AuditLog interceptor (attribute/filter) tự động ghi log cho tất cả bảng
- GET list: phân trang, filter (bang, hanhDong, nguoiThucHienId, date range)
- GET theo goiThauId: trace toàn bộ lịch sử gói thầu

### Cross-cutting
- Tạo `BaseService<T>` CRUD pattern
- Tạo `ResponseFormat` middleware (success/error wrapper)
- Tạo `PagedResult<T>` model
- Xử lý mã hoá mật khẩu (BCrypt)
