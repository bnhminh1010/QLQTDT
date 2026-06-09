using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHinhThucDauThauEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HinhThucDauThau",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                                              .Annotation("SqlServer:Identity", "1, 1"),
                    MaHinhThuc = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenHinhThuc = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    HanMucToiDa = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    TrangThaiHoatDong = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HinhThucDauThau", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HinhThucDauThau_MaHinhThuc",
                table: "HinhThucDauThau",
                column: "MaHinhThuc",
                unique: true);

            migrationBuilder.CreateTable(
                name: "NhatKyKiemToan",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                                             .Annotation("SqlServer:Identity", "1, 1"),
                    GoiThauId = table.Column<long>(type: "bigint", nullable: true),
                    HanhDong = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MoTaChiTiet = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguoiThucHienId = table.Column<int>(type: "int", nullable: false),
                    ThoiGianThucHien = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NhatKyKiemToan", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NhatKyKiemToan_NguoiDung_NguoiThucHienId",
                        column: x => x.NguoiThucHienId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NhatKyKiemToan_NguoiThucHienId",
                table: "NhatKyKiemToan",
                column: "NguoiThucHienId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "NhatKyKiemToan");
            migrationBuilder.DropTable(name: "HinhThucDauThau");
        }
    }
}
