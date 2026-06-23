using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGoiThauKhoaPhongNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_GoiThau_KhoaPhongId",
                table: "GoiThau",
                column: "KhoaPhongId");

            migrationBuilder.AddForeignKey(
                name: "FK_GoiThau_KhoaPhong_KhoaPhongId",
                table: "GoiThau",
                column: "KhoaPhongId",
                principalTable: "KhoaPhong",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoiThau_KhoaPhong_KhoaPhongId",
                table: "GoiThau");

            migrationBuilder.DropIndex(
                name: "IX_GoiThau_KhoaPhongId",
                table: "GoiThau");
        }
    }
}
