using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using QLQTDT.Api.Data;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260707215500_BackfillTwoPhaseWorkflowDeadlines")]
    public partial class BackfillTwoPhaseWorkflowDeadlines : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE WorkflowStepInstance
                SET HanXuLyHoSo = COALESCE(HanXuLyHoSo, HanXuLy)
                WHERE HanXuLy IS NOT NULL
                  AND (PhaHienTai IS NULL OR PhaHienTai = N'LAP_HO_SO');

                UPDATE WorkflowStepInstance
                SET HanKyDuyet = COALESCE(HanKyDuyet, HanXuLy)
                WHERE HanXuLy IS NOT NULL
                  AND PhaHienTai = N'KY_DUYET';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
