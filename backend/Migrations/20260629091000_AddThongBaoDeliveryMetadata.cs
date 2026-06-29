using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    public partial class AddThongBaoDeliveryMetadata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.ThongBao', N'WorkflowStepInstanceId') IS NULL
                    ALTER TABLE [ThongBao] ADD [WorkflowStepInstanceId] bigint NULL;
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.ThongBao', N'NotificationKey') IS NULL
                    ALTER TABLE [ThongBao] ADD [NotificationKey] nvarchar(200) NULL;
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = N'FK_ThongBao_WorkflowStepInstances_WorkflowStepInstanceId'
                        AND parent_object_id = OBJECT_ID(N'dbo.ThongBao')
                )
                ALTER TABLE [ThongBao] ADD CONSTRAINT [FK_ThongBao_WorkflowStepInstances_WorkflowStepInstanceId]
                    FOREIGN KEY ([WorkflowStepInstanceId]) REFERENCES [WorkflowStepInstance] ([Id]) ON DELETE SET NULL;
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = N'IX_ThongBao_WorkflowStepInstanceId'
                        AND object_id = OBJECT_ID(N'dbo.ThongBao')
                )
                CREATE INDEX [IX_ThongBao_WorkflowStepInstanceId] ON [ThongBao] ([WorkflowStepInstanceId]);
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = N'IX_ThongBao_NguoiDungId_NotificationKey'
                        AND object_id = OBJECT_ID(N'dbo.ThongBao')
                )
                CREATE UNIQUE INDEX [IX_ThongBao_NguoiDungId_NotificationKey]
                    ON [ThongBao] ([NguoiDungId], [NotificationKey])
                    WHERE [NotificationKey] IS NOT NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = N'IX_ThongBao_NguoiDungId_NotificationKey'
                        AND object_id = OBJECT_ID(N'dbo.ThongBao')
                )
                DROP INDEX [IX_ThongBao_NguoiDungId_NotificationKey] ON [ThongBao];
                """);

            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = N'IX_ThongBao_WorkflowStepInstanceId'
                        AND object_id = OBJECT_ID(N'dbo.ThongBao')
                )
                DROP INDEX [IX_ThongBao_WorkflowStepInstanceId] ON [ThongBao];
                """);

            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = N'FK_ThongBao_WorkflowStepInstances_WorkflowStepInstanceId'
                        AND parent_object_id = OBJECT_ID(N'dbo.ThongBao')
                )
                ALTER TABLE [ThongBao] DROP CONSTRAINT [FK_ThongBao_WorkflowStepInstances_WorkflowStepInstanceId];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.ThongBao', N'NotificationKey') IS NOT NULL
                    ALTER TABLE [ThongBao] DROP COLUMN [NotificationKey];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.ThongBao', N'WorkflowStepInstanceId') IS NOT NULL
                    ALTER TABLE [ThongBao] DROP COLUMN [WorkflowStepInstanceId];
                """);
        }
    }
}
