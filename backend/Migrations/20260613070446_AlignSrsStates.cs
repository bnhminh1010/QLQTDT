using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlignSrsStates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowActionHistory_WorkflowInstance_WorkflowInstanceId",
                table: "WorkflowActionHistory");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowActionHistory_WorkflowInstance_WorkflowInstanceId",
                table: "WorkflowActionHistory",
                column: "WorkflowInstanceId",
                principalTable: "WorkflowInstance",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowActionHistory_WorkflowInstance_WorkflowInstanceId",
                table: "WorkflowActionHistory");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowActionHistory_WorkflowInstance_WorkflowInstanceId",
                table: "WorkflowActionHistory",
                column: "WorkflowInstanceId",
                principalTable: "WorkflowInstance",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
