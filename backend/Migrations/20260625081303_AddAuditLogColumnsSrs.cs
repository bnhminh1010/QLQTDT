using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogColumnsSrs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── Cleanup legacy BuocWorkflow.LoaiBuoc ────────────────
            // Vietnamese → standard codes
            migrationBuilder.Sql("UPDATE BuocWorkflow SET LoaiBuoc = N'BAT_DAU'  WHERE LoaiBuoc = N'Bắt đầu'");
            migrationBuilder.Sql("UPDATE BuocWorkflow SET LoaiBuoc = N'KET_THUC' WHERE LoaiBuoc = N'Kết thúc'");
            migrationBuilder.Sql("UPDATE BuocWorkflow SET LoaiBuoc = N'THUC_HIEN' WHERE LoaiBuoc = N'Thường'");
            // PHE_DUYET → THUC_HIEN + preserve in NhomGiaiDoan
            migrationBuilder.Sql("UPDATE BuocWorkflow SET LoaiBuoc = N'THUC_HIEN', NhomGiaiDoan = N'PHE_DUYET' WHERE LoaiBuoc = N'PHE_DUYET'");
            // KIEM_TRA → THUC_HIEN + preserve in NhomGiaiDoan
            migrationBuilder.Sql("UPDATE BuocWorkflow SET LoaiBuoc = N'THUC_HIEN', NhomGiaiDoan = N'KIEM_TRA' WHERE LoaiBuoc = N'KIEM_TRA'");

            // ── Backfill WorkflowStepInstance.TrangThai ────────────
            // PENDING → DANG_XU_LY nếu đang chờ xử lý
            // PENDING → HOAN_TAT nếu đã có NgayHoanThanh
            // PENDING → CHO_DUYET nếu PhaHienTai = KY_DUYET
            // PENDING → TRE_HAN nếu QuaHan = 1
            migrationBuilder.Sql(@"
UPDATE WorkflowStepInstance SET TrangThai = 'DANG_XU_LY'
WHERE TrangThai = 'PENDING' AND PhaHienTai = 'LAP_HO_SO' AND NgayBatDau IS NOT NULL AND NgayHoanThanh IS NULL
");
            migrationBuilder.Sql(@"
UPDATE WorkflowStepInstance SET TrangThai = 'CHO_DUYET'
WHERE TrangThai = 'PENDING' AND PhaHienTai = 'KY_DUYET' AND NgayHoanThanh IS NULL
");
            migrationBuilder.Sql(@"
UPDATE WorkflowStepInstance SET TrangThai = 'HOAN_TAT'
WHERE TrangThai = 'PENDING' AND NgayHoanThanh IS NOT NULL
");
            migrationBuilder.Sql(@"
UPDATE WorkflowStepInstance SET TrangThai = 'TRE_HAN'
WHERE TrangThai = 'PENDING' AND (QuaHan = 1 OR (HanXuLy IS NOT NULL AND HanXuLy < GETUTCDATE() AND NgayHoanThanh IS NULL))
");
            // Remaining PENDING records → DANG_XU_LY (default active state)
            migrationBuilder.Sql(@"
UPDATE WorkflowStepInstance SET TrangThai = 'DANG_XU_LY'
WHERE TrangThai = 'PENDING'
");

            // ── Audit log columns ───────────────────────────────────
            migrationBuilder.DropForeignKey(
                name: "FK_GoiThau_KhoaPhong_KhoaPhongId",
                table: "GoiThau");
            migrationBuilder.AddColumn<long>(
                name: "BanGhiId",
                table: "NhatKyKiemToan",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Bang",
                table: "NhatKyKiemToan",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DiaChiIP",
                table: "NhatKyKiemToan",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DuLieuCu",
                table: "NhatKyKiemToan",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DuLieuMoi",
                table: "NhatKyKiemToan",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_GoiThau_KhoaPhong_KhoaPhongId",
                table: "GoiThau",
                column: "KhoaPhongId",
                principalTable: "KhoaPhong",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GoiThau_KhoaPhong_KhoaPhongId",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "BanGhiId",
                table: "NhatKyKiemToan");

            migrationBuilder.DropColumn(
                name: "Bang",
                table: "NhatKyKiemToan");

            migrationBuilder.DropColumn(
                name: "DiaChiIP",
                table: "NhatKyKiemToan");

            migrationBuilder.DropColumn(
                name: "DuLieuCu",
                table: "NhatKyKiemToan");

            migrationBuilder.DropColumn(
                name: "DuLieuMoi",
                table: "NhatKyKiemToan");

            migrationBuilder.AddForeignKey(
                name: "FK_GoiThau_KhoaPhong_KhoaPhongId",
                table: "GoiThau",
                column: "KhoaPhongId",
                principalTable: "KhoaPhong",
                principalColumn: "Id");
        }
    }
}
