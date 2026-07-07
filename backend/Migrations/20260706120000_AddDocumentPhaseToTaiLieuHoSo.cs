using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations;

public partial class AddDocumentPhaseToTaiLieuHoSo : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "WorkflowStepInstanceId",
            table: "TaiLieuHoSo",
            type: "bigint",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "DocumentPhase",
            table: "TaiLieuHoSo",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_TaiLieuHoSo_WorkflowStepInstanceId",
            table: "TaiLieuHoSo",
            column: "WorkflowStepInstanceId");

        migrationBuilder.CreateIndex(
            name: "IX_TaiLieuHoSo_GoiThauId_WorkflowStepInstanceId_DocumentPhase",
            table: "TaiLieuHoSo",
            columns: new[] { "GoiThauId", "WorkflowStepInstanceId", "DocumentPhase" });

        migrationBuilder.AddForeignKey(
            name: "FK_TaiLieuHoSo_WorkflowStepInstance_WorkflowStepInstanceId",
            table: "TaiLieuHoSo",
            column: "WorkflowStepInstanceId",
            principalTable: "WorkflowStepInstance",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_TaiLieuHoSo_WorkflowStepInstance_WorkflowStepInstanceId",
            table: "TaiLieuHoSo");

        migrationBuilder.DropIndex(
            name: "IX_TaiLieuHoSo_WorkflowStepInstanceId",
            table: "TaiLieuHoSo");

        migrationBuilder.DropIndex(
            name: "IX_TaiLieuHoSo_GoiThauId_WorkflowStepInstanceId_DocumentPhase",
            table: "TaiLieuHoSo");

        migrationBuilder.DropColumn(
            name: "WorkflowStepInstanceId",
            table: "TaiLieuHoSo");

        migrationBuilder.DropColumn(
            name: "DocumentPhase",
            table: "TaiLieuHoSo");
    }
}
