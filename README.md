# QLQTDT — Quản Lý Quy Trình Đấu Thầu

![.NET](https://img.shields.io/badge/.NET-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Redux](https://img.shields.io/badge/Redux-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

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

- **Backend:** ASP.NET Core 10 Web API (C#) — RESTful API
- **Frontend:** React + Vite + TypeScript — SPA
- **UI:** Ant Design
- **State:** Redux Toolkit
- **Database:** SQL Server (remote)
- **ORM:** Entity Framework Core 10
- **File Storage:** FTP (passive mode)
- **Auth:** JWT trong HttpOnly Cookie
- **API Docs:** Swagger / OpenAPI
- **Workflow động:** mỗi hình thức mua sắm là một state machine riêng
- **Phân quyền:** role-based (khoa/phòng sử dụng, mua sắm, lãnh đạo, tổ chuyên gia, nhà thầu...)
- **Chứng từ:** quản lý file đính kèm theo từng bước quy trình

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| Backend | ASP.NET Core 10 Web API (C#) |
| Frontend | React + Vite + TypeScript |
| UI | Ant Design |
| State Management | Redux Toolkit |
| API Docs | Swagger / OpenAPI |
| Database | SQL Server |
| ORM | Entity Framework Core |
| File Storage | FTP (passive mode) |

## Cấu trúc thư mục

```
QLQTDT/
├── backend/                # ASP.NET Core Web API
│   ├── Controllers/        # REST endpoints
│   ├── Services/           # Business logic
│   ├── Models/
│   │   ├── Entities/       # DB entities
│   │   └── DTOs/           # Request/Response DTOs
│   ├── Data/               # EF Core DbContext
│   ├── Config/             # JWT, FTP config
│   ├── Program.cs
│   └── QLQTDT.Api.csproj
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/       # API calls
│   │   └── store/          # Redux slices
│   └── package.json
├── docs/                   # DB schema, SRS
└── .env                    # Connection strings (gitignore)
```

## Cài đặt & Chạy local

### Yêu cầu
- .NET SDK 10.0+
- Node.js 18+
- npm hoặc yarn

### Backend

```bash
cd backend
dotnet build
dotnet run
```

API chạy tại `http://localhost:5xxx` (hoặc port cấu hình).
Swagger UI: `http://localhost:5xxx/swagger`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

### Environment

Tạo file `.env` tại thư mục root với nội dung:

```env
DB_SERVER=your_server
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database

FTP_SERVER=your_ftp_server
FTP_PORT=21
FTP_USER=your_ftp_user
FTP_PASSWORD=your_ftp_password
FTP_MODE=passive
```

### Database Migration

```bash
cd backend
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

## Giấy phép

MIT License — xem file [LICENSE](LICENSE).
