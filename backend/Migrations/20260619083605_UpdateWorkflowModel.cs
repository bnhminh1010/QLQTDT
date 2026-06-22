using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateWorkflowModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_KhoaPhong_KhoaPhongXuLyId",
                table: "BuocWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_VaiTro_VaiTroXuLyId",
                table: "BuocWorkflow");

            migrationBuilder.RenameColumn(
                name: "VaiTroXuLyId",
                table: "BuocWorkflow",
                newName: "VaiTroXuLyHoSoId");

            migrationBuilder.RenameColumn(
                name: "SoNgaySLA",
                table: "BuocWorkflow",
                newName: "SoNgayXuLy");

            migrationBuilder.RenameColumn(
                name: "KhoaPhongXuLyId",
                table: "BuocWorkflow",
                newName: "VaiTroKyDuyetId");

            migrationBuilder.RenameIndex(
                name: "IX_BuocWorkflow_VaiTroXuLyId",
                table: "BuocWorkflow",
                newName: "IX_BuocWorkflow_VaiTroXuLyHoSoId");

            migrationBuilder.RenameIndex(
                name: "IX_BuocWorkflow_KhoaPhongXuLyId",
                table: "BuocWorkflow",
                newName: "IX_BuocWorkflow_VaiTroKyDuyetId");

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "WorkflowStepInstance",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "DANG_XU_LY",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldDefaultValue: "PENDING");

            migrationBuilder.AddColumn<string>(
                name: "KetQua",
                table: "WorkflowStepInstance",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LyDoKhongDuyet",
                table: "WorkflowStepInstance",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayKyDuyet",
                table: "WorkflowStepInstance",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXuLy",
                table: "WorkflowStepInstance",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NguoiKyDuyetId",
                table: "WorkflowStepInstance",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhaHienTai",
                table: "WorkflowStepInstance",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "LAP_HO_SO");

            migrationBuilder.AddColumn<string>(
                name: "TaiLieuDinhKem",
                table: "WorkflowStepInstance",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhieuKyDuyet",
                table: "WorkflowAssignment",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NhomVaiTroId",
                table: "VaiTro",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TheoDoi",
                table: "GoiThau",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LaBuocJoin",
                table: "BuocWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LoaiHan",
                table: "BuocWorkflow",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "CANH_BAO");

            migrationBuilder.AddColumn<string>(
                name: "NhomSongSong",
                table: "BuocWorkflow",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SoNgayLapHoSo",
                table: "BuocWorkflow",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "NhomVaiTro",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaNhom = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenNhom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DoUuTien = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DaXoa = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NhomVaiTro", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStepInstance_NguoiKyDuyetId",
                table: "WorkflowStepInstance",
                column: "NguoiKyDuyetId");

            migrationBuilder.CreateIndex(
                name: "IX_VaiTro_NhomVaiTroId",
                table: "VaiTro",
                column: "NhomVaiTroId");

            migrationBuilder.CreateIndex(
                name: "IX_NhomVaiTro_MaNhom",
                table: "NhomVaiTro",
                column: "MaNhom",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_VaiTro_VaiTroKyDuyetId",
                table: "BuocWorkflow",
                column: "VaiTroKyDuyetId",
                principalTable: "VaiTro",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_VaiTro_VaiTroXuLyHoSoId",
                table: "BuocWorkflow",
                column: "VaiTroXuLyHoSoId",
                principalTable: "VaiTro",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_VaiTro_NhomVaiTro_NhomVaiTroId",
                table: "VaiTro",
                column: "NhomVaiTroId",
                principalTable: "NhomVaiTro",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkflowStepInstance_NguoiDung_NguoiKyDuyetId",
                table: "WorkflowStepInstance",
                column: "NguoiKyDuyetId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_VaiTro_VaiTroKyDuyetId",
                table: "BuocWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_VaiTro_VaiTroXuLyHoSoId",
                table: "BuocWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_VaiTro_NhomVaiTro_NhomVaiTroId",
                table: "VaiTro");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowStepInstance_NguoiDung_NguoiKyDuyetId",
                table: "WorkflowStepInstance");

            migrationBuilder.DropTable(
                name: "NhomVaiTro");

            migrationBuilder.DropIndex(
                name: "IX_WorkflowStepInstance_NguoiKyDuyetId",
                table: "WorkflowStepInstance");

            migrationBuilder.DropIndex(
                name: "IX_VaiTro_NhomVaiTroId",
                table: "VaiTro");

            migrationBuilder.DropColumn(
                name: "KetQua",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "LyDoKhongDuyet",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "NgayKyDuyet",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "NgayXuLy",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "NguoiKyDuyetId",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "PhaHienTai",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "TaiLieuDinhKem",
                table: "WorkflowStepInstance");

            migrationBuilder.DropColumn(
                name: "PhieuKyDuyet",
                table: "WorkflowAssignment");

            migrationBuilder.DropColumn(
                name: "NhomVaiTroId",
                table: "VaiTro");

            migrationBuilder.DropColumn(
                name: "TheoDoi",
                table: "GoiThau");

            migrationBuilder.DropColumn(
                name: "LaBuocJoin",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "LoaiHan",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "NhomSongSong",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "SoNgayLapHoSo",
                table: "BuocWorkflow");

            migrationBuilder.RenameColumn(
                name: "VaiTroXuLyHoSoId",
                table: "BuocWorkflow",
                newName: "VaiTroXuLyId");

            migrationBuilder.RenameColumn(
                name: "VaiTroKyDuyetId",
                table: "BuocWorkflow",
                newName: "KhoaPhongXuLyId");

            migrationBuilder.RenameColumn(
                name: "SoNgayXuLy",
                table: "BuocWorkflow",
                newName: "SoNgaySLA");

            migrationBuilder.RenameIndex(
                name: "IX_BuocWorkflow_VaiTroXuLyHoSoId",
                table: "BuocWorkflow",
                newName: "IX_BuocWorkflow_VaiTroXuLyId");

            migrationBuilder.RenameIndex(
                name: "IX_BuocWorkflow_VaiTroKyDuyetId",
                table: "BuocWorkflow",
                newName: "IX_BuocWorkflow_KhoaPhongXuLyId");

            migrationBuilder.AlterColumn<string>(
                name: "TrangThai",
                table: "WorkflowStepInstance",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "PENDING",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldDefaultValue: "DANG_XU_LY");

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_KhoaPhong_KhoaPhongXuLyId",
                table: "BuocWorkflow",
                column: "KhoaPhongXuLyId",
                principalTable: "KhoaPhong",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_VaiTro_VaiTroXuLyId",
                table: "BuocWorkflow",
                column: "VaiTroXuLyId",
                principalTable: "VaiTro",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
