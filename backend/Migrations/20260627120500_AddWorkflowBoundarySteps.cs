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
            migrationBuilder.AddColumn<int>(
                name: "BuocBatDauId",
                table: "Workflow",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BuocKetThucId",
                table: "Workflow",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuocBatDauId",
                table: "Workflow");

            migrationBuilder.DropColumn(
                name: "BuocKetThucId",
                table: "Workflow");
        }
    }
}
