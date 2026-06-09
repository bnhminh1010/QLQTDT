using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHopDong : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Workflow_HinhThucDauThau_HinhThucId",
                table: "Workflow");

            migrationBuilder.AddColumn<int>(
                name: "HopDongId",
                table: "TaiLieuHoSo",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NguoiDungId",
                table: "NhaThau",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HopDong",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoiThauId = table.Column<int>(type: "int", nullable: false),
                    SoHopDong = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TongGiaTri = table.Column<decimal>(type: "decimal(18,0)", nullable: false),
                    NgayKy = table.Column<DateTime>(type: "datetime2(3)", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HopDong", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HopDong_GoiThau_GoiThauId",
                        column: x => x.GoiThauId,
                        principalTable: "GoiThau",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaiLieuHoSo_GoiThauId",
                table: "TaiLieuHoSo",
                column: "GoiThauId");

            migrationBuilder.CreateIndex(
                name: "IX_TaiLieuHoSo_HopDongId",
                table: "TaiLieuHoSo",
                column: "HopDongId");

            migrationBuilder.CreateIndex(
                name: "IX_HopDong_GoiThauId",
                table: "HopDong",
                column: "GoiThauId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HopDong_SoHopDong",
                table: "HopDong",
                column: "SoHopDong",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TaiLieuHoSo_GoiThau_GoiThauId",
                table: "TaiLieuHoSo",
                column: "GoiThauId",
                principalTable: "GoiThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaiLieuHoSo_HopDong_HopDongId",
                table: "TaiLieuHoSo",
                column: "HopDongId",
                principalTable: "HopDong",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Workflow_HinhThucDauThau_HinhThucId",
                table: "Workflow",
                column: "HinhThucId",
                principalTable: "HinhThucDauThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaiLieuHoSo_GoiThau_GoiThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropForeignKey(
                name: "FK_TaiLieuHoSo_HopDong_HopDongId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropForeignKey(
                name: "FK_Workflow_HinhThucDauThau_HinhThucId",
                table: "Workflow");

            migrationBuilder.DropTable(
                name: "HopDong");

            migrationBuilder.DropIndex(
                name: "IX_TaiLieuHoSo_GoiThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropIndex(
                name: "IX_TaiLieuHoSo_HopDongId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropColumn(
                name: "HopDongId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropColumn(
                name: "NguoiDungId",
                table: "NhaThau");

            migrationBuilder.AddForeignKey(
                name: "FK_Workflow_HinhThucDauThau_HinhThucId",
                table: "Workflow",
                column: "HinhThucId",
                principalTable: "HinhThucDauThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
