using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddIntegrationLogEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IntegrationLog",
                columns: table => new
                {
                    Id              = table.Column<long>(type: "bigint", nullable: false)
                                           .Annotation("SqlServer:Identity", "1, 1"),
                    HeThong         = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LoaiDongBo      = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RequestPayload  = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResponsePayload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrangThai       = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ThoiGianDongBo  = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntegrationLog", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "IntegrationLog");
        }
    }
}
