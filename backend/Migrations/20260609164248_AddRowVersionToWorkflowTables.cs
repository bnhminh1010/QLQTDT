using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersionToWorkflowTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add RowVersion concurrency token columns missing from existing tables.
            // Entity models + DbContext fluent IsRowVersion() configured but DB tables
            // created in earlier migrations without these columns.

            // WorkflowInstance — created in AddGoiThauEntity migration
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'WorkflowInstance')
                    AND name = 'RowVersion'
                )
                ALTER TABLE WorkflowInstance ADD RowVersion rowversion NULL
            ");

            // WorkflowStepInstance — created in AddWorkflowEngineEntities migration
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'WorkflowStepInstance') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'WorkflowStepInstance')
                    AND name = 'RowVersion'
                )
                ALTER TABLE WorkflowStepInstance ADD RowVersion rowversion NULL
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // RowVersion is managed by SQL Server — no-op Down is intentional.
            // Dropping a rowversion column requires table rebuild and would break
            // existing data. Migration rollback should re-create from scratch.
        }
    }
}
