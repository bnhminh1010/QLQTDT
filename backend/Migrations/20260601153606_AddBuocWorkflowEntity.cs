using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBuocWorkflowEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Tables BuocWorkflow + ChuyenTiepWorkflow da ton tai trong DB tu schema goc (Dbschema.sql).
            // Migration nay chi de cap nhat model snapshot cho EF Core.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
