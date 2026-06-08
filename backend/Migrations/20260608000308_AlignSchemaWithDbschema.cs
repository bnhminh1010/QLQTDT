using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlignSchemaWithDbschema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "NhaThau",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SoDienThoai",
                table: "NhaThau",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "DaXoa",
                table: "NguoiDung",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayCapNhat",
                table: "NguoiDung",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayDangNhapCuoi",
                table: "NguoiDung",
                type: "datetime2(3)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SoDienThoai",
                table: "NguoiDung",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TenGoiThau",
                table: "GoiThau",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "MaGoiThau",
                table: "GoiThau",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<int>(
                name: "HinhThucId",
                table: "GoiThau",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "IdCongKhai",
                table: "GoiThau",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWSEQUENTIALID()");

            migrationBuilder.AddColumn<int>(
                name: "KhoaPhongId",
                table: "GoiThau",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NguoiTaoId",
                table: "GoiThau",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkflowId",
                table: "GoiThau",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoiThau_IdCongKhai",
                table: "GoiThau",
                column: "IdCongKhai",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GoiThau_IdCongKhai",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "NhaThau");

            migrationBuilder.DropColumn(
                name: "SoDienThoai",
                table: "NhaThau");

            migrationBuilder.DropColumn(
                name: "DaXoa",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "NgayCapNhat",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "NgayDangNhapCuoi",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "SoDienThoai",
                table: "NguoiDung");

            migrationBuilder.DropColumn(
                name: "HinhThucId",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "IdCongKhai",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "KhoaPhongId",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "NguoiTaoId",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "WorkflowId",
                table: "GoiThau");

            migrationBuilder.AlterColumn<string>(
                name: "TenGoiThau",
                table: "GoiThau",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "MaGoiThau",
                table: "GoiThau",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);
        }
    }
}
