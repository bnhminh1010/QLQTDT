using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileChangeRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "YeuCauThayDoiThongTinNguoiDung",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCongKhai = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    NguoiDungId = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    GiaTriCuJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GiaTriMoiJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NguoiXuLyId = table.Column<int>(type: "int", nullable: true),
                    NgayTao = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayXuLy = table.Column<DateTime>(type: "datetime2(3)", nullable: true),
                    LyDoTuChoi = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YeuCauThayDoiThongTinNguoiDung", x => x.Id);
                    table.ForeignKey(
                        name: "FK_YeuCauThayDoiThongTinNguoiDung_NguoiDung_NguoiDungId",
                        column: x => x.NguoiDungId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_YeuCauThayDoiThongTinNguoiDung_NguoiDung_NguoiXuLyId",
                        column: x => x.NguoiXuLyId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_YeuCauThayDoiThongTinNguoiDung_IdCongKhai",
                table: "YeuCauThayDoiThongTinNguoiDung",
                column: "IdCongKhai",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_YeuCauThayDoiThongTinNguoiDung_NguoiDungId",
                table: "YeuCauThayDoiThongTinNguoiDung",
                column: "NguoiDungId");

            migrationBuilder.CreateIndex(
                name: "IX_YeuCauThayDoiThongTinNguoiDung_NguoiXuLyId",
                table: "YeuCauThayDoiThongTinNguoiDung",
                column: "NguoiXuLyId");

            migrationBuilder.CreateIndex(
                name: "IX_YeuCauThayDoiThongTinNguoiDung_TrangThai_NgayTao",
                table: "YeuCauThayDoiThongTinNguoiDung",
                columns: new[] { "TrangThai", "NgayTao" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "YeuCauThayDoiThongTinNguoiDung");
        }
    }
}
