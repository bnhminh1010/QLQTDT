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
            // Table HinhThucDauThau + NhatKyKiemToan + index IX_HinhThucDauThau_MaHinhThuc đã tồn tại
            // trong DB từ schema gốc (Dbschema.sql). Migration này chỉ để cập nhật model snapshot.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
