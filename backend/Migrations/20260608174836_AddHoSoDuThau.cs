using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHoSoDuThau : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HoSoDuThauId",
                table: "TaiLieuHoSo",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NguoiDungId",
                table: "NhaThau",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HoSoDuThau",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoiThauId = table.Column<int>(type: "int", nullable: false),
                    NhaThauId = table.Column<int>(type: "int", nullable: false),
                    GiaDuThau = table.Column<decimal>(type: "decimal(18,0)", nullable: false),
                    GiaTrungThau = table.Column<decimal>(type: "decimal(18,0)", nullable: true),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NgayNop = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoSoDuThau", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HoSoDuThau_GoiThau_GoiThauId",
                        column: x => x.GoiThauId,
                        principalTable: "GoiThau",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HoSoDuThau_NhaThau_NhaThauId",
                        column: x => x.NhaThauId,
                        principalTable: "NhaThau",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaiLieuHoSo_GoiThauId",
                table: "TaiLieuHoSo",
                column: "GoiThauId");

            migrationBuilder.CreateIndex(
                name: "IX_TaiLieuHoSo_HoSoDuThauId",
                table: "TaiLieuHoSo",
                column: "HoSoDuThauId");

            migrationBuilder.CreateIndex(
                name: "IX_HoSoDuThau_GoiThauId_NhaThauId",
                table: "HoSoDuThau",
                columns: new[] { "GoiThauId", "NhaThauId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HoSoDuThau_NhaThauId",
                table: "HoSoDuThau",
                column: "NhaThauId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaiLieuHoSo_GoiThau_GoiThauId",
                table: "TaiLieuHoSo",
                column: "GoiThauId",
                principalTable: "GoiThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId",
                table: "TaiLieuHoSo",
                column: "HoSoDuThauId",
                principalTable: "HoSoDuThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaiLieuHoSo_GoiThau_GoiThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropForeignKey(
                name: "FK_TaiLieuHoSo_HoSoDuThau_HoSoDuThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropTable(
                name: "HoSoDuThau");

            migrationBuilder.DropIndex(
                name: "IX_TaiLieuHoSo_GoiThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropIndex(
                name: "IX_TaiLieuHoSo_HoSoDuThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropColumn(
                name: "HoSoDuThauId",
                table: "TaiLieuHoSo");

            migrationBuilder.DropColumn(
                name: "NguoiDungId",
                table: "NhaThau");
        }
    }
}
