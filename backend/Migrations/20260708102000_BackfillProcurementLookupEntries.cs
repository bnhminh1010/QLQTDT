using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using QLQTDT.Api.Data;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260708102000_BackfillProcurementLookupEntries")]
    public partial class BackfillProcurementLookupEntries : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET NOCOUNT ON;

                IF EXISTS (SELECT 1 FROM KhoaPhong WHERE MaKhoaPhong = N'TU_VAN_LCNT')
                BEGIN
                    UPDATE KhoaPhong
                    SET TenKhoaPhong = N'Tư vấn LCNT',
                        DaXoa = 0
                    WHERE MaKhoaPhong = N'TU_VAN_LCNT';
                END
                ELSE IF EXISTS (SELECT 1 FROM KhoaPhong WHERE TenKhoaPhong = N'Tư vấn LCNT')
                BEGIN
                    UPDATE TOP (1) KhoaPhong
                    SET MaKhoaPhong = N'TU_VAN_LCNT',
                        TenKhoaPhong = N'Tư vấn LCNT',
                        DaXoa = 0
                    WHERE TenKhoaPhong = N'Tư vấn LCNT';
                END
                ELSE
                BEGIN
                    INSERT INTO KhoaPhong (MaKhoaPhong, TenKhoaPhong, DaXoa)
                    VALUES (N'TU_VAN_LCNT', N'Tư vấn LCNT', 0);
                END

                IF EXISTS (SELECT 1 FROM KhoaPhong WHERE MaKhoaPhong = N'TO_CHUYEN_GIA')
                BEGIN
                    UPDATE KhoaPhong
                    SET TenKhoaPhong = N'Tổ chuyên gia',
                        DaXoa = 0
                    WHERE MaKhoaPhong = N'TO_CHUYEN_GIA';
                END
                ELSE IF EXISTS (SELECT 1 FROM KhoaPhong WHERE TenKhoaPhong = N'Tổ chuyên gia')
                BEGIN
                    UPDATE TOP (1) KhoaPhong
                    SET MaKhoaPhong = N'TO_CHUYEN_GIA',
                        TenKhoaPhong = N'Tổ chuyên gia',
                        DaXoa = 0
                    WHERE TenKhoaPhong = N'Tổ chuyên gia';
                END
                ELSE
                BEGIN
                    INSERT INTO KhoaPhong (MaKhoaPhong, TenKhoaPhong, DaXoa)
                    VALUES (N'TO_CHUYEN_GIA', N'Tổ chuyên gia', 0);
                END

                IF EXISTS (SELECT 1 FROM KhoaPhong WHERE MaKhoaPhong = N'TO_THAM_DINH')
                BEGIN
                    UPDATE KhoaPhong
                    SET TenKhoaPhong = N'Tổ thẩm định',
                        DaXoa = 0
                    WHERE MaKhoaPhong = N'TO_THAM_DINH';
                END
                ELSE IF EXISTS (SELECT 1 FROM KhoaPhong WHERE TenKhoaPhong = N'Tổ thẩm định')
                BEGIN
                    UPDATE TOP (1) KhoaPhong
                    SET MaKhoaPhong = N'TO_THAM_DINH',
                        TenKhoaPhong = N'Tổ thẩm định',
                        DaXoa = 0
                    WHERE TenKhoaPhong = N'Tổ thẩm định';
                END
                ELSE
                BEGIN
                    INSERT INTO KhoaPhong (MaKhoaPhong, TenKhoaPhong, DaXoa)
                    VALUES (N'TO_THAM_DINH', N'Tổ thẩm định', 0);
                END

                IF EXISTS (SELECT 1 FROM KhoaPhong WHERE MaKhoaPhong = N'TO_KIEM_TRA_GIA')
                BEGIN
                    UPDATE KhoaPhong
                    SET TenKhoaPhong = N'Tổ kiểm tra giá',
                        DaXoa = 0
                    WHERE MaKhoaPhong = N'TO_KIEM_TRA_GIA';
                END
                ELSE IF EXISTS (SELECT 1 FROM KhoaPhong WHERE TenKhoaPhong = N'Tổ kiểm tra giá')
                BEGIN
                    UPDATE TOP (1) KhoaPhong
                    SET MaKhoaPhong = N'TO_KIEM_TRA_GIA',
                        TenKhoaPhong = N'Tổ kiểm tra giá',
                        DaXoa = 0
                    WHERE TenKhoaPhong = N'Tổ kiểm tra giá';
                END
                ELSE
                BEGIN
                    INSERT INTO KhoaPhong (MaKhoaPhong, TenKhoaPhong, DaXoa)
                    VALUES (N'TO_KIEM_TRA_GIA', N'Tổ kiểm tra giá', 0);
                END

                IF EXISTS (SELECT 1 FROM VaiTro WHERE MaVaiTro = N'TU_VAN_LCNT')
                BEGIN
                    UPDATE VaiTro
                    SET TenVaiTro = N'Tư vấn LCNT',
                        MoTa = N'Vai trò tư vấn hỗ trợ lập và triển khai lựa chọn nhà thầu',
                        DaXoa = 0
                    WHERE MaVaiTro = N'TU_VAN_LCNT';
                END
                ELSE IF EXISTS (SELECT 1 FROM VaiTro WHERE TenVaiTro = N'Tư vấn LCNT')
                BEGIN
                    UPDATE VaiTro
                    SET MaVaiTro = N'TU_VAN_LCNT',
                        TenVaiTro = N'Tư vấn LCNT',
                        MoTa = N'Vai trò tư vấn hỗ trợ lập và triển khai lựa chọn nhà thầu',
                        DaXoa = 0
                    WHERE TenVaiTro = N'Tư vấn LCNT';
                END
                ELSE
                BEGIN
                    INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa, DaXoa)
                    VALUES (N'TU_VAN_LCNT', N'Tư vấn LCNT', N'Vai trò tư vấn hỗ trợ lập và triển khai lựa chọn nhà thầu', 0);
                END

                IF EXISTS (SELECT 1 FROM VaiTro WHERE MaVaiTro = N'TO_CHUYEN_GIA')
                BEGIN
                    UPDATE VaiTro
                    SET TenVaiTro = N'Tổ chuyên gia',
                        MoTa = N'Vai trò đánh giá hồ sơ và kết quả lựa chọn nhà thầu',
                        DaXoa = 0
                    WHERE MaVaiTro = N'TO_CHUYEN_GIA';
                END
                ELSE IF EXISTS (SELECT 1 FROM VaiTro WHERE TenVaiTro = N'Tổ chuyên gia')
                BEGIN
                    UPDATE VaiTro
                    SET MaVaiTro = N'TO_CHUYEN_GIA',
                        TenVaiTro = N'Tổ chuyên gia',
                        MoTa = N'Vai trò đánh giá hồ sơ và kết quả lựa chọn nhà thầu',
                        DaXoa = 0
                    WHERE TenVaiTro = N'Tổ chuyên gia';
                END
                ELSE
                BEGIN
                    INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa, DaXoa)
                    VALUES (N'TO_CHUYEN_GIA', N'Tổ chuyên gia', N'Vai trò đánh giá hồ sơ và kết quả lựa chọn nhà thầu', 0);
                END

                IF EXISTS (SELECT 1 FROM VaiTro WHERE MaVaiTro = N'TO_THAM_DINH')
                BEGIN
                    UPDATE VaiTro
                    SET TenVaiTro = N'Tổ thẩm định',
                        MoTa = N'Vai trò thẩm định hồ sơ, phương án và kết quả',
                        DaXoa = 0
                    WHERE MaVaiTro = N'TO_THAM_DINH';
                END
                ELSE IF EXISTS (SELECT 1 FROM VaiTro WHERE TenVaiTro = N'Tổ thẩm định')
                BEGIN
                    UPDATE VaiTro
                    SET MaVaiTro = N'TO_THAM_DINH',
                        TenVaiTro = N'Tổ thẩm định',
                        MoTa = N'Vai trò thẩm định hồ sơ, phương án và kết quả',
                        DaXoa = 0
                    WHERE TenVaiTro = N'Tổ thẩm định';
                END
                ELSE
                BEGIN
                    INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa, DaXoa)
                    VALUES (N'TO_THAM_DINH', N'Tổ thẩm định', N'Vai trò thẩm định hồ sơ, phương án và kết quả', 0);
                END

                IF EXISTS (SELECT 1 FROM VaiTro WHERE MaVaiTro = N'TO_KIEM_TRA_GIA')
                BEGIN
                    UPDATE VaiTro
                    SET TenVaiTro = N'Tổ kiểm tra giá',
                        MoTa = N'Vai trò kiểm tra, đối chiếu và xác minh báo giá',
                        DaXoa = 0
                    WHERE MaVaiTro = N'TO_KIEM_TRA_GIA';
                END
                ELSE IF EXISTS (SELECT 1 FROM VaiTro WHERE TenVaiTro = N'Tổ kiểm tra giá')
                BEGIN
                    UPDATE VaiTro
                    SET MaVaiTro = N'TO_KIEM_TRA_GIA',
                        TenVaiTro = N'Tổ kiểm tra giá',
                        MoTa = N'Vai trò kiểm tra, đối chiếu và xác minh báo giá',
                        DaXoa = 0
                    WHERE TenVaiTro = N'Tổ kiểm tra giá';
                END
                ELSE
                BEGIN
                    INSERT INTO VaiTro (MaVaiTro, TenVaiTro, MoTa, DaXoa)
                    VALUES (N'TO_KIEM_TRA_GIA', N'Tổ kiểm tra giá', N'Vai trò kiểm tra, đối chiếu và xác minh báo giá', 0);
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
