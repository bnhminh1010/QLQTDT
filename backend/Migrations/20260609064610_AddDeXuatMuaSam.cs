using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDeXuatMuaSam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DeXuatMuaSam",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCongKhai = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWSEQUENTIALID()"),
                    MaDeXuat = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TieuDe = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    KhoaPhongId = table.Column<int>(type: "int", nullable: false),
                    NguoiDeXuatId = table.Column<int>(type: "int", nullable: false),
                    TongDuToan = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TrangThai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "DRAFT"),
                    NgayDeXuat = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DaXoa = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeXuatMuaSam", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeXuatMuaSam_KhoaPhong_KhoaPhongId",
                        column: x => x.KhoaPhongId,
                        principalTable: "KhoaPhong",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeXuatMuaSam_NguoiDung_NguoiDeXuatId",
                        column: x => x.NguoiDeXuatId,
                        principalTable: "NguoiDung",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });


            migrationBuilder.CreateTable(
                name: "ChiTietDeXuat",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeXuatId = table.Column<long>(type: "bigint", nullable: false),
                    MaVatTu = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenVatTu = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DonViTinh = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SoLuong = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DonGiaDuToan = table.Column<decimal>(type: "decimal(18,0)", nullable: false),
                    ThanhTien = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "[SoLuong] * [DonGiaDuToan]")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChiTietDeXuat", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChiTietDeXuat_DeXuatMuaSam_DeXuatId",
                        column: x => x.DeXuatId,
                        principalTable: "DeXuatMuaSam",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDeXuat_DeXuatId",
                table: "ChiTietDeXuat",
                column: "DeXuatId");

            migrationBuilder.CreateIndex(
                name: "IX_DeXuatMuaSam_IdCongKhai",
                table: "DeXuatMuaSam",
                column: "IdCongKhai",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeXuatMuaSam_KhoaPhongId",
                table: "DeXuatMuaSam",
                column: "KhoaPhongId");

            migrationBuilder.CreateIndex(
                name: "IX_DeXuatMuaSam_MaDeXuat",
                table: "DeXuatMuaSam",
                column: "MaDeXuat",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeXuatMuaSam_NguoiDeXuatId",
                table: "DeXuatMuaSam",
                column: "NguoiDeXuatId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChiTietDeXuat");


            migrationBuilder.DropTable(
                name: "DeXuatMuaSam");
        }
    }
}
