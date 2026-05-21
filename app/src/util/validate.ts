import * as yup from "yup";

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = yup.object({
  username: yup.string().required("Vui lòng nhập tên đăng nhập"),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
  rememberMe: yup.boolean().default(false),
});

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerSchema = yup.object({
  ho: yup.string().required("Vui lòng nhập họ và tên đệm"),
  ten: yup.string().required("Vui lòng nhập tên"),
  email: yup
    .string()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ")
    .matches(/@bvungbuou\.vn$/, "Phải dùng email công vụ @bvungbuou.vn"),
  phone: yup.string().default(""),
  maNhanVien: yup.string().required("Vui lòng nhập mã nhân viên"),
  phong: yup.string().required("Vui lòng chọn phòng/khoa"),
  vaiTro: yup.string().required("Vui lòng chọn vai trò"),
  lyDo: yup.string().default(""),
  password: yup
    .string()
    .required("Vui lòng nhập mật khẩu")
    .min(8, "Mật khẩu tối thiểu 8 ký tự"),
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu không khớp"),
  terms: yup
    .boolean()
    .required()
    .oneOf([true], "Bạn phải đồng ý với điều khoản sử dụng"),
});
