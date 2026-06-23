import * as yup from "yup";
import { getRutGonThreshold, isRutGonHinhThuc } from "@/util/goiThauRutGonValidation";

// ─── Login ────────────────────────────────────────────────────────────────────

const usernameRules = yup
  .string()
  .trim()
  .required("Vui lòng nhập tên đăng nhập")
  .min(3, "Tên đăng nhập tối thiểu 3 ký tự")
  .max(30, "Tên đăng nhập tối đa 30 ký tự")
  .matches(
    /^[a-zA-Z0-9_.]+$/,
    "Tên đăng nhập chỉ gồm chữ không dấu, số, _ và .",
  );

const passwordRules = yup
  .string()
  .required("Vui lòng nhập mật khẩu")
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
  .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
  .matches(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số")
  .matches(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt");

export const loginSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required("Vui lòng nhập tên đăng nhập")
    .matches(/^[a-zA-Z0-9_.]+$/, "Tên đăng nhập không hợp lệ"),
  password: yup.string().required("Vui lòng nhập mật khẩu"),
  rememberMe: yup.boolean().default(false),
});

// ─── Register ─────────────────────────────────────────────────────────────────

const FULL_NAME_REGEX = /^[a-zA-ZÀ-ɏḀ-ỿ\s]+$/;

export const registerSchema = yup.object({
  username: usernameRules,
  ho: yup
    .string()
    .required("Vui lòng nhập họ và tên đệm")
    .matches(FULL_NAME_REGEX, "Họ tên đệm không được chứa số hoặc ký tự đặc biệt"),
  ten: yup
    .string()
    .required("Vui lòng nhập tên")
    .matches(FULL_NAME_REGEX, "Tên không được chứa số hoặc ký tự đặc biệt"),
  email: yup
    .string()
    .required("Vui lòng nhập email")
    .email("Email không hợp lệ"),
  phone: yup
    .string()
    .default("")
    .when((val, schema) =>
      val && val[0]
        ? schema.matches(/^\d{10,11}$/, "Số điện thoại phải từ 10-11 chữ số")
        : schema,
    ),
  maNhanVien: yup
    .string()
    .required("Vui lòng nhập mã nhân viên")
    .matches(/^[A-Za-z0-9]+$/, "Mã nhân viên chỉ được chứa chữ cái và chữ số, không có ký tự đặc biệt"),
  phong: yup.string().required("Vui lòng chọn phòng/khoa"),
  vaiTro: yup.string().required("Vui lòng chọn vai trò"),
  lyDo: yup.string().default(""),
  password: passwordRules,
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("password")], "Mật khẩu không khớp"),
  terms: yup
    .boolean()
    .required()
    .oneOf([true], "Bạn phải đồng ý với điều khoản sử dụng"),
});

// ─── Forgot Password (step 1) ───────────────────────────────────────────────
export const forgotPasswordSchema = yup.object({
  identifier: yup
    .string()
    .trim()
    .required("Vui lòng nhập tên đăng nhập hoặc email")
    .test("valid-identifier", "Email không hợp lệ", (val) => {
      if (!val) return true;
      if (val.includes("@")) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      }
      return true;
    }),
});

// ─── OTP ──────────────────────────────────────────────────────────────────────
export const otpSchema = yup.object({
  otp: yup
    .string()
    .required("Vui lòng nhập mã OTP")
    .matches(/^\d{6}$/, "Mã OTP phải đủ 6 chữ số"),
});

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = yup.object({
  newPassword: passwordRules,
  confirmPassword: yup
    .string()
    .required("Vui lòng xác nhận mật khẩu")
    .oneOf([yup.ref("newPassword")], "Mật khẩu không khớp"),
});

// ─── Tạo Gói Thầu ─────────────────────────────────────────────────────────────

export const taoGoiThauSchema = yup.object({
  ten: yup
    .string()
    .trim()
    .required("Vui lòng nhập tên gói thầu")
    .min(5, "Tên gói thầu phải có ít nhất 5 ký tự")
    .max(255, "Tên gói thầu không được vượt quá 255 ký tự"),
  loaiGoiThau: yup.string().required("Vui lòng chọn loại gói thầu."),
  hinhThuc: yup.string().required("Vui lòng chọn quy trình đấu thầu"),
  giaTriStr: yup
    .string()
    .trim()
    .required("Vui lòng nhập giá trị gói thầu")
    .matches(/^[\d,.]+$/, "Giá trị không đúng định dạng (VD: 320.000.000 hoặc 320,000,000)")
    .test(
      "greater-than-zero",
      "Giá trị gói thầu phải lớn hơn 0",
      (val) => Number((val ?? "").replace(/[^\d]/g, "")) > 0,
    )
    .test(
      "budget-threshold-rut-gon",
      "Giá trị gói thầu vượt hạn mức áp dụng quy trình rút gọn",
      (val, ctx) => {
        const hinhThuc = ctx.parent.hinhThuc as string | undefined;
        const loaiGoiThau = ctx.parent.loaiGoiThau as string | undefined;
        if (!hinhThuc || !isRutGonHinhThuc(hinhThuc)) return true;
        const num = Number((val ?? "").replace(/[^\d]/g, ""));
        const hanMuc = getRutGonThreshold(loaiGoiThau) ?? Infinity;
        return num <= hanMuc;
      },
    ),
  nguonVon: yup.string().required("Vui lòng chọn nguồn vốn"),
  donVi: yup.string().required("Vui lòng chọn đơn vị đề xuất"),
  ngayTao: yup.string().required("Vui lòng chọn ngày tạo"),
  ghiChu: yup
    .string()
    .default("")
    .max(1000, "Ghi chú không được vượt quá 1000 ký tự"),
  canCuApDungRutGon: yup
    .string()
    .default("")
    .max(1000, "Căn cứ áp dụng rút gọn không được vượt quá 1000 ký tự")
    .when("hinhThuc", ([hinhThuc], schema) =>
      isRutGonHinhThuc(hinhThuc as string)
        ? schema.required("Vui lòng nhập căn cứ áp dụng quy trình rút gọn")
        : schema,
    ),
});
