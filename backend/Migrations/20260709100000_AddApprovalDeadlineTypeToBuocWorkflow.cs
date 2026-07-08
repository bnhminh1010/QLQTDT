using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using QLQTDT.Api.Data;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260709100000_AddApprovalDeadlineTypeToBuocWorkflow")]
    public partial class AddApprovalDeadlineTypeToBuocWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LoaiHanKyDuyet",
                table: "BuocWorkflow",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "CANH_BAO");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LoaiHanKyDuyet",
                table: "BuocWorkflow");
        }
    }
}
