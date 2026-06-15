using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLichSuTrangThaiGoiThau : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LichSuTrangThaiGoiThau",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GoiThauId = table.Column<int>(type: "int", nullable: false),
                    TrangThaiCu = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TrangThaiMoi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NguoiThayDoiId = table.Column<int>(type: "int", nullable: true),
                    ThoiGianThayDoi = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LichSuTrangThaiGoiThau", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LichSuTrangThaiGoiThau_GoiThau_GoiThauId",
                        column: x => x.GoiThauId,
                        principalTable: "GoiThau",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LichSuTrangThaiGoiThau_NguoiDung_NguoiThayDoiId",
                        column: x => x.NguoiThayDoiId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LichSuTrangThaiGoiThau_GoiThauId_ThoiGianThayDoi",
                table: "LichSuTrangThaiGoiThau",
                columns: new[] { "GoiThauId", "ThoiGianThayDoi" });

            migrationBuilder.CreateIndex(
                name: "IX_LichSuTrangThaiGoiThau_NguoiThayDoiId",
                table: "LichSuTrangThaiGoiThau",
                column: "NguoiThayDoiId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LichSuTrangThaiGoiThau");
        }
    }
}
