using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowRuntimeEntitiesSrs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "GoiThauId",
                table: "WorkflowInstance",
                type: "int",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "WorkflowInstance",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HoSoNangLuc",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NhaThauId = table.Column<int>(type: "int", nullable: false),
                    LoaiTaiLieu = table.Column<string>(type: "varchar(100)", nullable: false),
                    TenFile = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DuongDanFile = table.Column<string>(type: "varchar(1000)", nullable: false),
                    NgayHetHan = table.Column<DateTime>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoSoNangLuc", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HoSoNangLuc_NhaThau_NhaThauId",
                        column: x => x.NhaThauId,
                        principalTable: "NhaThau",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowStepInstance",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkflowInstanceId = table.Column<long>(type: "bigint", nullable: false),
                    BuocWorkflowId = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    NgayBatDau = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayHoanThanh = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NguoiXuLyId = table.Column<int>(type: "int", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowStepInstance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowStepInstance_BuocWorkflow_BuocWorkflowId",
                        column: x => x.BuocWorkflowId,
                        principalTable: "BuocWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowStepInstance_NguoiDung_NguoiXuLyId",
                        column: x => x.NguoiXuLyId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkflowStepInstance_WorkflowInstance_WorkflowInstanceId",
                        column: x => x.WorkflowInstanceId,
                        principalTable: "WorkflowInstance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowActionHistory",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkflowInstanceId = table.Column<long>(type: "bigint", nullable: false),
                    WorkflowStepInstanceId = table.Column<long>(type: "bigint", nullable: true),
                    HanhDong = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NguoiThucHienId = table.Column<int>(type: "int", nullable: false),
                    ThoiGian = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowActionHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowActionHistory_WorkflowInstance_WorkflowInstanceId",
                        column: x => x.WorkflowInstanceId,
                        principalTable: "WorkflowInstance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActionHistory_WorkflowStepInstance_WorkflowStepInstanceId",
                        column: x => x.WorkflowStepInstanceId,
                        principalTable: "WorkflowStepInstance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowAssignment",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkflowStepInstanceId = table.Column<long>(type: "bigint", nullable: false),
                    NguoiDuocGiaoId = table.Column<int>(type: "int", nullable: false),
                    DaXuLy = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    NgayGiao = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayXuLy = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowAssignment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowAssignment_NguoiDung_NguoiDuocGiaoId",
                        column: x => x.NguoiDuocGiaoId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowAssignment_WorkflowStepInstance_WorkflowStepInstanceId",
                        column: x => x.WorkflowStepInstanceId,
                        principalTable: "WorkflowStepInstance",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstance_BuocHienTaiId",
                table: "WorkflowInstance",
                column: "BuocHienTaiId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstance_GoiThauId",
                table: "WorkflowInstance",
                column: "GoiThauId");

            migrationBuilder.CreateIndex(
                name: "IX_HoSoNangLuc_NhaThauId",
                table: "HoSoNangLuc",
                column: "NhaThauId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActionHistory_WorkflowInstanceId",
                table: "WorkflowActionHistory",
                column: "WorkflowInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActionHistory_WorkflowStepInstanceId",
                table: "WorkflowActionHistory",
                column: "WorkflowStepInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowAssignment_NguoiDuocGiaoId",
                table: "WorkflowAssignment",
                column: "NguoiDuocGiaoId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowAssignment_WorkflowStepInstanceId_NguoiDuocGiaoId",
                table: "WorkflowAssignment",
                columns: new[] { "WorkflowStepInstanceId", "NguoiDuocGiaoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStepInstance_BuocWorkflowId",
                table: "WorkflowStepInstance",
                column: "BuocWorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStepInstance_NguoiXuLyId",
                table: "WorkflowStepInstance",
                column: "NguoiXuLyId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStepInstance_WorkflowInstanceId",
                table: "WorkflowStepInstance",
                column: "WorkflowInstanceId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowInstance_BuocWorkflow_BuocHienTaiId",
                table: "WorkflowInstance",
                column: "BuocHienTaiId",
                principalTable: "BuocWorkflow",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowInstance_GoiThau_GoiThauId",
                table: "WorkflowInstance",
                column: "GoiThauId",
                principalTable: "GoiThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowInstance_BuocWorkflow_BuocHienTaiId",
                table: "WorkflowInstance");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowInstance_GoiThau_GoiThauId",
                table: "WorkflowInstance");

            migrationBuilder.DropTable(
                name: "HoSoNangLuc");

            migrationBuilder.DropTable(
                name: "WorkflowActionHistory");

            migrationBuilder.DropTable(
                name: "WorkflowAssignment");

            migrationBuilder.DropTable(
                name: "WorkflowStepInstance");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowInstance_BuocHienTaiId",
                table: "WorkflowInstance");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowInstance_GoiThauId",
                table: "WorkflowInstance");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "WorkflowInstance");

            migrationBuilder.AlterColumn<long>(
                name: "GoiThauId",
                table: "WorkflowInstance",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");
        }
    }
}
