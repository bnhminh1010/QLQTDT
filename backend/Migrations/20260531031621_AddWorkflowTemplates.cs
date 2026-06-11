using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bước 1: Dọn sạch toàn bộ tables + constraints liên quan (idempotent)
            migrationBuilder.Sql(@"
                -- Drop FK constraints đến các bảng sẽ bị xóa
                DECLARE @sql NVARCHAR(MAX) = '';
                SELECT @sql = @sql + 'ALTER TABLE [' + OBJECT_NAME(fk.parent_object_id) + '] DROP CONSTRAINT [' + fk.name + '];'
                FROM sys.foreign_keys fk
                WHERE fk.referenced_object_id IN (
                    OBJECT_ID('BuocQuyTrinh'), OBJECT_ID('MauQuyTrinh'),
                    OBJECT_ID('ChuyenTiepWorkflow'), OBJECT_ID('BuocWorkflow'),
                    OBJECT_ID('WorkflowRule'), OBJECT_ID('Workflow'), OBJECT_ID('HinhThucDauThau')
                ) OR fk.parent_object_id IN (
                    OBJECT_ID('BuocQuyTrinh'), OBJECT_ID('MauQuyTrinh'),
                    OBJECT_ID('ChuyenTiepWorkflow'), OBJECT_ID('BuocWorkflow'),
                    OBJECT_ID('WorkflowRule'), OBJECT_ID('Workflow'), OBJECT_ID('HinhThucDauThau')
                );
                IF LEN(@sql) > 0 EXEC(@sql);

                -- Drop tables nếu tồn tại (đúng thứ tự)
                IF OBJECT_ID('ChuyenTiepWorkflow', 'U') IS NOT NULL DROP TABLE [ChuyenTiepWorkflow];
                IF OBJECT_ID('BuocWorkflow',        'U') IS NOT NULL DROP TABLE [BuocWorkflow];
                IF OBJECT_ID('WorkflowRule',        'U') IS NOT NULL DROP TABLE [WorkflowRule];
                IF OBJECT_ID('Workflow',            'U') IS NOT NULL DROP TABLE [Workflow];
                IF OBJECT_ID('HinhThucDauThau',     'U') IS NOT NULL DROP TABLE [HinhThucDauThau];
                IF OBJECT_ID('BuocQuyTrinh',        'U') IS NOT NULL DROP TABLE [BuocQuyTrinh];
                IF OBJECT_ID('MauQuyTrinh',         'U') IS NOT NULL DROP TABLE [MauQuyTrinh];

                -- Drop constraint mồ côi nếu còn
                DECLARE @cSql NVARCHAR(MAX) = '';
                SELECT @cSql = @cSql + 'ALTER TABLE [' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];'
                FROM sys.key_constraints
                WHERE name IN ('PK_HinhThucDauThau','PK_Workflow','PK_BuocWorkflow','PK_WorkflowRule','PK_ChuyenTiepWorkflow');
                IF LEN(@cSql) > 0 EXEC(@cSql);
            ", suppressTransaction: true);

            // Bước 2: Tạo HinhThucDauThau
            migrationBuilder.Sql(@"
                CREATE TABLE [HinhThucDauThau] (
                    [Id] int NOT NULL IDENTITY,
                    [MaHinhThuc] nvarchar(50) NOT NULL,
                    [TenHinhThuc] nvarchar(255) NOT NULL,
                    [HanMucToiDa] decimal(18,0) NULL,
                    [TrangThaiHoatDong] bit NOT NULL DEFAULT CAST(1 AS bit),
                    CONSTRAINT [PK_HinhThucDauThau] PRIMARY KEY ([Id])
                );
                CREATE UNIQUE INDEX [IX_HinhThucDauThau_MaHinhThuc] ON [HinhThucDauThau] ([MaHinhThuc]);
            ", suppressTransaction: true);

            // Bước 3: Tạo Workflow
            migrationBuilder.Sql(@"
                CREATE TABLE [Workflow] (
                    [Id] int NOT NULL IDENTITY,
                    [MaWorkflow] nvarchar(50) NOT NULL,
                    [TenWorkflow] nvarchar(255) NOT NULL,
                    [HinhThucId] int NOT NULL,
                    [TrangThaiHoatDong] bit NOT NULL DEFAULT CAST(1 AS bit),
                    CONSTRAINT [PK_Workflow] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_Workflow_HinhThucDauThau_HinhThucId] FOREIGN KEY ([HinhThucId])
                        REFERENCES [HinhThucDauThau] ([Id]) ON DELETE NO ACTION
                );
                CREATE UNIQUE INDEX [IX_Workflow_MaWorkflow] ON [Workflow] ([MaWorkflow]);
                CREATE INDEX [IX_Workflow_HinhThucId] ON [Workflow] ([HinhThucId]);
            ", suppressTransaction: true);

            // Bước 4: Tạo BuocWorkflow
            migrationBuilder.Sql(@"
                CREATE TABLE [BuocWorkflow] (
                    [Id] int NOT NULL IDENTITY,
                    [WorkflowId] int NULL,
                    [WorkflowDuocChonThuCong] bit NOT NULL DEFAULT CAST(0 AS bit),
                    [LyDoChonWorkflow] nvarchar(max) NULL,
                    [MaBuoc] nvarchar(50) NOT NULL,
                    [TenBuoc] nvarchar(255) NOT NULL,
                    [LoaiBuoc] nvarchar(50) NOT NULL,
                    [VaiTroXuLyId] int NULL,
                    [KhoaPhongXuLyId] int NULL,
                    [SoNgaySLA] int NOT NULL DEFAULT 0,
                    [ChoPhepTuChoi] bit NOT NULL DEFAULT CAST(1 AS bit),
                    [ChoPhepBoQua] bit NOT NULL DEFAULT CAST(0 AS bit),
                    CONSTRAINT [PK_BuocWorkflow] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_BuocWorkflow_Workflow_WorkflowId] FOREIGN KEY ([WorkflowId])
                        REFERENCES [Workflow] ([Id]) ON DELETE CASCADE,
                    CONSTRAINT [FK_BuocWorkflow_VaiTro_VaiTroXuLyId] FOREIGN KEY ([VaiTroXuLyId])
                        REFERENCES [VaiTro] ([Id]) ON DELETE NO ACTION,
                    CONSTRAINT [FK_BuocWorkflow_KhoaPhong_KhoaPhongXuLyId] FOREIGN KEY ([KhoaPhongXuLyId])
                        REFERENCES [KhoaPhong] ([Id]) ON DELETE NO ACTION
                );
                CREATE INDEX [IX_BuocWorkflow_WorkflowId] ON [BuocWorkflow] ([WorkflowId]);
                CREATE INDEX [IX_BuocWorkflow_VaiTroXuLyId] ON [BuocWorkflow] ([VaiTroXuLyId]);
                CREATE INDEX [IX_BuocWorkflow_KhoaPhongXuLyId] ON [BuocWorkflow] ([KhoaPhongXuLyId]);
            ", suppressTransaction: true);

            // Bước 5: Tạo WorkflowRule
            migrationBuilder.Sql(@"
                CREATE TABLE [WorkflowRule] (
                    [Id] int NOT NULL IDENTITY,
                    [WorkflowId] int NOT NULL,
                    [DieuKien] nvarchar(max) NULL,
                    [DoUuTien] int NOT NULL DEFAULT 0,
                    [ChoPhepTuChon] bit NOT NULL DEFAULT CAST(1 AS bit),
                    CONSTRAINT [PK_WorkflowRule] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_WorkflowRule_Workflow_WorkflowId] FOREIGN KEY ([WorkflowId])
                        REFERENCES [Workflow] ([Id]) ON DELETE CASCADE
                );
                CREATE INDEX [IX_WorkflowRule_WorkflowId] ON [WorkflowRule] ([WorkflowId]);
            ", suppressTransaction: true);

            // Bước 6: Tạo ChuyenTiepWorkflow
            migrationBuilder.Sql(@"
                CREATE TABLE [ChuyenTiepWorkflow] (
                    [Id] int NOT NULL IDENTITY,
                    [TuBuocId] int NOT NULL,
                    [DenBuocId] int NOT NULL,
                    [HanhDong] nvarchar(50) NOT NULL,
                    [DieuKien] nvarchar(max) NULL,
                    CONSTRAINT [PK_ChuyenTiepWorkflow] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_ChuyenTiepWorkflow_BuocWorkflow_TuBuocId] FOREIGN KEY ([TuBuocId])
                        REFERENCES [BuocWorkflow] ([Id]) ON DELETE NO ACTION,
                    CONSTRAINT [FK_ChuyenTiepWorkflow_BuocWorkflow_DenBuocId] FOREIGN KEY ([DenBuocId])
                        REFERENCES [BuocWorkflow] ([Id]) ON DELETE NO ACTION
                );
                CREATE INDEX [IX_ChuyenTiepWorkflow_TuBuocId] ON [ChuyenTiepWorkflow] ([TuBuocId]);
                CREATE INDEX [IX_ChuyenTiepWorkflow_DenBuocId] ON [ChuyenTiepWorkflow] ([DenBuocId]);
            ", suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF OBJECT_ID('ChuyenTiepWorkflow','U') IS NOT NULL DROP TABLE [ChuyenTiepWorkflow];
                IF OBJECT_ID('BuocWorkflow','U')        IS NOT NULL DROP TABLE [BuocWorkflow];
                IF OBJECT_ID('WorkflowRule','U')        IS NOT NULL DROP TABLE [WorkflowRule];
                IF OBJECT_ID('Workflow','U')            IS NOT NULL DROP TABLE [Workflow];
                IF OBJECT_ID('HinhThucDauThau','U')     IS NOT NULL DROP TABLE [HinhThucDauThau];
            ", suppressTransaction: true);
        }
    }
}
