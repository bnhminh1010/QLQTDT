using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNguonVonLoaiGoiThauToGoiThau : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LoaiGoiThau",
                table: "GoiThau",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NguonVon",
                table: "GoiThau",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoiThau_HinhThucId",
                table: "GoiThau",
                column: "HinhThucId");

            migrationBuilder.AddForeignKey(
                name: "FK_GoiThau_HinhThucDauThau_HinhThucId",
                table: "GoiThau",
                column: "HinhThucId",
                principalTable: "HinhThucDauThau",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoiThau_HinhThucDauThau_HinhThucId",
                table: "GoiThau");

            migrationBuilder.DropIndex(
                name: "IX_GoiThau_HinhThucId",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "LoaiGoiThau",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "NguonVon",
                table: "GoiThau");
        }
    }
}
