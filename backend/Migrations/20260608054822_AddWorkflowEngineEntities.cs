using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowEngineEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: BuocHienTaiId column already exists from AddGoiThauEntity migration.
            // Only FK + Index need to be added here.

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstance_BuocHienTaiId",
                table: "WorkflowInstance",
                column: "BuocHienTaiId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowInstance_BuocWorkflow_BuocHienTaiId",
                table: "WorkflowInstance",
                column: "BuocHienTaiId",
                principalTable: "BuocWorkflow",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowInstance_BuocWorkflow_BuocHienTaiId",
                table: "WorkflowInstance");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowInstance_BuocHienTaiId",
                table: "WorkflowInstance");
        }
    }
}
