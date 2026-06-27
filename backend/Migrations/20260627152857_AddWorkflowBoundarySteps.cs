using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowBoundarySteps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.Workflow', N'BuocBatDauId') IS NULL
                    ALTER TABLE [Workflow] ADD [BuocBatDauId] int NULL;
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.Workflow', N'BuocKetThucId') IS NULL
                    ALTER TABLE [Workflow] ADD [BuocKetThucId] int NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.Workflow', N'BuocKetThucId') IS NOT NULL
                    ALTER TABLE [Workflow] DROP COLUMN [BuocKetThucId];
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH(N'dbo.Workflow', N'BuocBatDauId') IS NOT NULL
                    ALTER TABLE [Workflow] DROP COLUMN [BuocBatDauId];
                """);
        }
    }
}
