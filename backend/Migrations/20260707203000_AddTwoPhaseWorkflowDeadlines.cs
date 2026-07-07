using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using QLQTDT.Api.Data;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260707203000_AddTwoPhaseWorkflowDeadlines")]
    public partial class AddTwoPhaseWorkflowDeadlines : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "HanKyDuyet",
                table: "WorkflowStepInstance",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HanXuLyHoSo",
                table: "WorkflowStepInstance",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "QuaHanKyDuyet",
                table: "WorkflowStepInstance",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "QuaHanXuLyHoSo",
                table: "WorkflowStepInstance",
                type: "bit",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HanKyDuyet",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "HanXuLyHoSo",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "QuaHanKyDuyet",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "QuaHanXuLyHoSo",
                table: "WorkflowStepInstance");
        }
    }
}
