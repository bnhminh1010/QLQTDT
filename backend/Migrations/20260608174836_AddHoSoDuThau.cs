using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHoSoDuThau : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cleanup partial state từ các lần migration thất bại trước
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId')
                    ALTER TABLE [TaiLieuHoSo] DROP CONSTRAINT [FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId];
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_GoiThau_GoiThauId')
                    ALTER TABLE [TaiLieuHoSo] DROP CONSTRAINT [FK_TaiLieuHoSo_GoiThau_GoiThauId];
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = N'HoSoDuThau')
                    DROP TABLE [HoSoDuThau];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_HoSoDuThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                    DROP INDEX [IX_TaiLieuHoSo_HoSoDuThauId] ON [TaiLieuHoSo];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_GoiThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                    DROP INDEX [IX_TaiLieuHoSo_GoiThauId] ON [TaiLieuHoSo];
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'TaiLieuHoSo') AND name = N'HoSoDuThauId')
                    ALTER TABLE [TaiLieuHoSo] DROP COLUMN [HoSoDuThauId];
            ");

            // Thêm cột HoSoDuThauId vào TaiLieuHoSo nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'TaiLieuHoSo') AND name = N'HoSoDuThauId'
                )
                ALTER TABLE [TaiLieuHoSo] ADD [HoSoDuThauId] int NULL;
            ");

            // Tạo bảng HoSoDuThau nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'HoSoDuThau')
                CREATE TABLE [HoSoDuThau] (
                    [Id] int NOT NULL IDENTITY(1,1),
                    [GoiThauId] int NOT NULL,
                    [NhaThauId] int NOT NULL,
                    [GiaDuThau] decimal(18,0) NOT NULL,
                    [GiaTrungThau] decimal(18,0) NULL,
                    [TrangThai] nvarchar(50) NOT NULL,
                    [GhiChu] nvarchar(1000) NULL,
                    [NgayNop] datetime2(3) NOT NULL DEFAULT (GETDATE()),
                    [NgayCapNhat] datetime2(3) NULL,
                    CONSTRAINT [PK_HoSoDuThau] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_HoSoDuThau_GoiThau_GoiThauId] FOREIGN KEY ([GoiThauId])
                        REFERENCES [GoiThau] ([Id]) ON DELETE NO ACTION,
                    CONSTRAINT [FK_HoSoDuThau_NhaThau_NhaThauId] FOREIGN KEY ([NhaThauId])
                        REFERENCES [NhaThau] ([Id]) ON DELETE NO ACTION
                );
            ");

            // Index IX_TaiLieuHoSo_GoiThauId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_GoiThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                CREATE INDEX [IX_TaiLieuHoSo_GoiThauId] ON [TaiLieuHoSo] ([GoiThauId]);
            ");

            // Index IX_TaiLieuHoSo_HoSoDuThauId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_HoSoDuThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                CREATE INDEX [IX_TaiLieuHoSo_HoSoDuThauId] ON [TaiLieuHoSo] ([HoSoDuThauId]);
            ");

            // Index unique IX_HoSoDuThau_GoiThauId_NhaThauId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_HoSoDuThau_GoiThauId_NhaThauId' AND object_id = OBJECT_ID(N'HoSoDuThau'))
                CREATE UNIQUE INDEX [IX_HoSoDuThau_GoiThauId_NhaThauId] ON [HoSoDuThau] ([GoiThauId], [NhaThauId]);
            ");

            // Index IX_HoSoDuThau_NhaThauId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_HoSoDuThau_NhaThauId' AND object_id = OBJECT_ID(N'HoSoDuThau'))
                CREATE INDEX [IX_HoSoDuThau_NhaThauId] ON [HoSoDuThau] ([NhaThauId]);
            ");

            // FK từ TaiLieuHoSo → GoiThau
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_GoiThau_GoiThauId')
                ALTER TABLE [TaiLieuHoSo] ADD CONSTRAINT [FK_TaiLieuHoSo_GoiThau_GoiThauId]
                    FOREIGN KEY ([GoiThauId]) REFERENCES [GoiThau] ([Id]) ON DELETE NO ACTION;
            ");

            // FK từ TaiLieuHoSo → HoSoDuThau
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId')
                ALTER TABLE [TaiLieuHoSo] ADD CONSTRAINT [FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId]
                    FOREIGN KEY ([HoSoDuThauId]) REFERENCES [HoSoDuThau] ([Id]) ON DELETE SET NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_GoiThau_GoiThauId')
                ALTER TABLE [TaiLieuHoSo] DROP CONSTRAINT [FK_TaiLieuHoSo_GoiThau_GoiThauId];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId')
                ALTER TABLE [TaiLieuHoSo] DROP CONSTRAINT [FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = N'HoSoDuThau')
                DROP TABLE [HoSoDuThau];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_GoiThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                DROP INDEX [IX_TaiLieuHoSo_GoiThauId] ON [TaiLieuHoSo];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_HoSoDuThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                DROP INDEX [IX_TaiLieuHoSo_HoSoDuThauId] ON [TaiLieuHoSo];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'TaiLieuHoSo') AND name = N'HoSoDuThauId')
                ALTER TABLE [TaiLieuHoSo] DROP COLUMN [HoSoDuThauId];
            ");
        }
    }
}
