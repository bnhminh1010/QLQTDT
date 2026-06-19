using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHanXuLyQuaHan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HanXuLy",
                table: "WorkflowStepInstance",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "QuaHan",
                table: "WorkflowStepInstance",
                type: "bit",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HanXuLy",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "QuaHan",
                table: "WorkflowStepInstance");
        }
    }
}
