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
            migrationBuilder.AddColumn<int>(
                name: "BuocHienTaiId",
                table: "WorkflowInstance",
                type: "int",
                nullable: true);

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

            migrationBuilder.DropColumn(
                name: "BuocHienTaiId",
                table: "WorkflowInstance");
        }
    }
}
