using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlignSrsVub20 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // MaVaiTro không tồn tại khi InitialAuthSchema tạo VaiTro nên cần AddColumn trước.
            // Dùng raw SQL để xử lý cả hai trường hợp: fresh DB (add) và Dbschema.sql DB (alter).
            // Bước 1: thêm cột nullable nếu chưa tồn tại
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'VaiTro') AND name = N'MaVaiTro')
                    ALTER TABLE [VaiTro] ADD [MaVaiTro] nvarchar(50) NULL;
            ");

            // Bước 2: backfill giá trị từ TenVaiTro (dùng EXEC để tránh compile-time error)
            migrationBuilder.Sql(@"
                EXEC('UPDATE [VaiTro] SET [MaVaiTro] = [TenVaiTro] WHERE [MaVaiTro] IS NULL OR [MaVaiTro] = N''''');
            ");

            // Bước 3: đổi thành NOT NULL nếu đang nullable
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'VaiTro') AND name = N'MaVaiTro' AND is_nullable = 1
                )
                    EXEC('ALTER TABLE [VaiTro] ALTER COLUMN [MaVaiTro] nvarchar(50) NOT NULL');
            ");

            // Bước 4: tạo unique index nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VaiTro_MaVaiTro' AND object_id = OBJECT_ID(N'VaiTro'))
                    CREATE UNIQUE INDEX [IX_VaiTro_MaVaiTro] ON [VaiTro] ([MaVaiTro]);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_VaiTro_MaVaiTro' AND object_id = OBJECT_ID(N'VaiTro'))
                    DROP INDEX [IX_VaiTro_MaVaiTro] ON [VaiTro];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'VaiTro') AND name = N'MaVaiTro')
                    ALTER TABLE [VaiTro] DROP COLUMN [MaVaiTro];
            ");
        }
    }
}
