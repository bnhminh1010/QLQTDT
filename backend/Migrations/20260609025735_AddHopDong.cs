using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHopDong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop FK nếu tồn tại (đổi cascade → restrict)
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Workflow_HinhThucDauThau_HinhThucId')
                    ALTER TABLE [Workflow] DROP CONSTRAINT [FK_Workflow_HinhThucDauThau_HinhThucId];
            ");

            // Thêm HopDongId vào TaiLieuHoSo nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'TaiLieuHoSo') AND name = N'HopDongId')
                    ALTER TABLE [TaiLieuHoSo] ADD [HopDongId] int NULL;
            ");

            // Thêm NguoiDungId vào NhaThau nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'NhaThau') AND name = N'NguoiDungId')
                    ALTER TABLE [NhaThau] ADD [NguoiDungId] int NULL;
            ");

            // Tạo bảng HopDong nếu chưa có
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'HopDong')
                BEGIN
                    CREATE TABLE [HopDong] (
                        [Id]          int            NOT NULL IDENTITY(1,1),
                        [GoiThauId]   int            NOT NULL,
                        [SoHopDong]   nvarchar(100)  NOT NULL,
                        [TongGiaTri]  decimal(18,0)  NOT NULL,
                        [NgayKy]      datetime2(3)   NOT NULL,
                        [NgayTao]     datetime2(3)   NOT NULL CONSTRAINT [DF_HopDong_NgayTao] DEFAULT GETDATE(),
                        [NgayCapNhat] datetime2(3)   NULL,
                        CONSTRAINT [PK_HopDong] PRIMARY KEY ([Id])
                    );
                END
            ");

            // Index IX_TaiLieuHoSo_GoiThauId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_GoiThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                    CREATE INDEX [IX_TaiLieuHoSo_GoiThauId] ON [TaiLieuHoSo] ([GoiThauId]);
            ");

            // Index IX_TaiLieuHoSo_HopDongId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_HopDongId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                    CREATE INDEX [IX_TaiLieuHoSo_HopDongId] ON [TaiLieuHoSo] ([HopDongId]);
            ");

            // Unique index IX_HopDong_GoiThauId
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_HopDong_GoiThauId' AND object_id = OBJECT_ID(N'HopDong'))
                    CREATE UNIQUE INDEX [IX_HopDong_GoiThauId] ON [HopDong] ([GoiThauId]);
            ");

            // Unique index IX_HopDong_SoHopDong
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_HopDong_SoHopDong' AND object_id = OBJECT_ID(N'HopDong'))
                    CREATE UNIQUE INDEX [IX_HopDong_SoHopDong] ON [HopDong] ([SoHopDong]);
            ");

            // FK TaiLieuHoSo → GoiThau
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_GoiThau_GoiThauId')
                    ALTER TABLE [TaiLieuHoSo] ADD CONSTRAINT [FK_TaiLieuHoSo_GoiThau_GoiThauId]
                        FOREIGN KEY ([GoiThauId]) REFERENCES [GoiThau] ([Id]) ON DELETE NO ACTION;
            ");

            // FK TaiLieuHoSo → HopDong
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_HopDong_HopDongId')
                    ALTER TABLE [TaiLieuHoSo] ADD CONSTRAINT [FK_TaiLieuHoSo_HopDong_HopDongId]
                        FOREIGN KEY ([HopDongId]) REFERENCES [HopDong] ([Id]) ON DELETE NO ACTION;
            ");

            // Tái tạo FK Workflow → HinhThucDauThau với RESTRICT
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Workflow_HinhThucDauThau_HinhThucId')
                    ALTER TABLE [Workflow] ADD CONSTRAINT [FK_Workflow_HinhThucDauThau_HinhThucId]
                        FOREIGN KEY ([HinhThucId]) REFERENCES [HinhThucDauThau] ([Id]) ON DELETE NO ACTION;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_GoiThau_GoiThauId')
                    ALTER TABLE [TaiLieuHoSo] DROP CONSTRAINT [FK_TaiLieuHoSo_GoiThau_GoiThauId];
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_TaiLieuHoSo_HopDong_HopDongId')
                    ALTER TABLE [TaiLieuHoSo] DROP CONSTRAINT [FK_TaiLieuHoSo_HopDong_HopDongId];
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Workflow_HinhThucDauThau_HinhThucId')
                    ALTER TABLE [Workflow] DROP CONSTRAINT [FK_Workflow_HinhThucDauThau_HinhThucId];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = N'HopDong') DROP TABLE [HopDong];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_GoiThauId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                    DROP INDEX [IX_TaiLieuHoSo_GoiThauId] ON [TaiLieuHoSo];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TaiLieuHoSo_HopDongId' AND object_id = OBJECT_ID(N'TaiLieuHoSo'))
                    DROP INDEX [IX_TaiLieuHoSo_HopDongId] ON [TaiLieuHoSo];
            ");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'TaiLieuHoSo') AND name = N'HopDongId')
                    ALTER TABLE [TaiLieuHoSo] DROP COLUMN [HopDongId];
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Workflow_HinhThucDauThau_HinhThucId')
                    ALTER TABLE [Workflow] ADD CONSTRAINT [FK_Workflow_HinhThucDauThau_HinhThucId]
                        FOREIGN KEY ([HinhThucId]) REFERENCES [HinhThucDauThau] ([Id]) ON DELETE CASCADE;
            ");
        }
    }
}
