using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGoogleIdFromNguoiDung : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_NguoiDung_GoogleId",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "NguoiDung");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "NguoiDung",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_NguoiDung_GoogleId",
                table: "NguoiDung",
                column: "GoogleId",
                unique: true,
                filter: "[GoogleId] IS NOT NULL");
        }
    }
}
