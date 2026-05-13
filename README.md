# QLQTDT — Quản Lý Quy Trình Đấu Thầu

![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

## Tổng quan

Hệ thống quản lý quy trình mua sắm / đấu thầu nội bộ, áp dụng quy trình
QTT.TCKT.29. Hỗ trợ theo dõi toàn bộ vòng đời gói thầu từ đề xuất nhu cầu
đến nghiệm thu, thanh lý, quyết toán.

Xử lý linh hoạt 10 hình thức mua sắm với luồng riêng cho từng loại.
Tích hợp báo đến hạn, cảnh báo chậm tiến độ, báo cáo theo ngày / tháng / quý / năm.

## Luồng quy trình chính

Vòng đời gói thầu chia 5 chặng:

| Chặng | Nội dung |
|-------|----------|
| A. Khởi tạo nhu cầu | Đề xuất mua sắm / sửa chữa, trình chủ trương |
| B. Lấy giá - lập dự toán | Yêu cầu báo giá, kiểm tra, chốt dự toán |
| C. Chọn hình thức mua sắm | Quyết định hình thức (chỉ định / chào hàng / đấu thầu / ...) |
| D. Ký kết và triển khai | Phê duyệt kết quả, ký hợp đồng, quản lý thực hiện |
| E. Kết thúc hợp đồng | Nghiệm thu, thanh lý, quyết toán, xử lý vi phạm |

## Các hình thức mua sắm

Hệ thống hỗ trợ 10 hình thức, mỗi hình thức có workflow riêng:

| Hình thức | Đặc điểm |
|-----------|----------|
| Chỉ định thầu tự quyết định | Gói <= 50 triệu, siêu ngắn |
| Chỉ định thầu rút gọn | Có dự toán + KH LCNT |
| Chỉ định thầu thông thường | Có tổ chuyên gia, hồ sơ yêu cầu |
| Chào hàng cạnh tranh | Gói <= 10 tỷ, thực hiện qua mạng |
| Đấu thầu rộng rãi | >= 18 ngày phát hành, quy trình đầy đủ |
| Mua sắm trực tiếp | Dựa trên hợp đồng tương tự đã ký |
| Chào giá trực tuyến rút gọn | Thời gian chào tính bằng giờ |
| Chào giá trực tuyến thông thường | >= 5 ngày E-HSMT |
| Mua sắm trực tuyến | Đặt mua trên hệ thống |
| Đặt hàng | Xây dựng phương án đặt hàng, mời nhà cung cấp |

## Kiến trúc

- Backend: .NET MVC (C#) — mô hình Model-View-Controller
- Frontend: HTML + CSS thuần, không JS framework
- Workflow động: mỗi hình thức mua sắm là một state machine riêng
- Phân quyền: role-based (khoa/phòng sử dụng, mua sắm, lãnh đạo, tổ chuyên gia, nhà thầu...)
- Chứng từ: quản lý file đính kèm theo từng bước quy trình

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | .NET MVC (C#) |
| Frontend | HTML5, CSS3 |
| Database | SQL Server |
| CI/CD | GitHub Actions |

## CI/CD

Pipeline tự động gồm: build .NET + SHA256 checksums, CodeQL,
Gitleaks (quét secret), SonarQube (quét CVE và chất lượng code).

## Giấy phép

MIT License — xem file [LICENSE](LICENSE).
