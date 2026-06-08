using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaiLieuHoSo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaiLieuHoSo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoiThauId = table.Column<int>(type: "int", nullable: true),
                    TenFile = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DuongDanFtp = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    KichThuoc = table.Column<long>(type: "bigint", nullable: false),
                    LoaiTaiLieu = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NguoiUploadId = table.Column<int>(type: "int", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "GETDATE()"),
                    DaXoa = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaiLieuHoSo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Workflow",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaWorkflow = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenWorkflow = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    HinhThucId = table.Column<int>(type: "int", nullable: false),
                    TrangThaiHoatDong = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Workflow", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Workflow_HinhThucDauThau_HinhThucId",
                        column: x => x.HinhThucId,
                        principalTable: "HinhThucDauThau",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowInstance",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoiThauId = table.Column<long>(type: "bigint", nullable: false),
                    WorkflowId = table.Column<int>(type: "int", nullable: false),
                    BuocHienTaiId = table.Column<int>(type: "int", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NgayBatDau = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayHoanThanh = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowInstance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowInstance_Workflow_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Workflow_HinhThucId",
                table: "Workflow",
                column: "HinhThucId");

            migrationBuilder.CreateIndex(
                name: "IX_Workflow_MaWorkflow",
                table: "Workflow",
                column: "MaWorkflow",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstance_WorkflowId",
                table: "WorkflowInstance",
                column: "WorkflowId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaiLieuHoSo");

            migrationBuilder.DropTable(
                name: "WorkflowInstance");

            migrationBuilder.DropTable(
                name: "Workflow");
        }
    }
}
