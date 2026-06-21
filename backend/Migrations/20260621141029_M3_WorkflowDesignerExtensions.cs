using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class M3_WorkflowDesignerExtensions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ThongBao_NguoiDung_NguoiDungId",
                table: "ThongBao");

            migrationBuilder.DropIndex(
                name: "IX_ThongBao_IdCongKhai",
                table: "ThongBao");

            migrationBuilder.DropIndex(
                name: "IX_ThongBao_NguoiDungId_DaDoc_NgayTao",
                table: "ThongBao");

            migrationBuilder.AddColumn<bool>(
                name: "LaQuyTrinhChuan",
                table: "Workflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LoaiHinhDauThau",
                table: "Workflow",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MoTaNgan",
                table: "Workflow",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhamViApDung",
                table: "Workflow",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NoiDung",
                table: "ThongBao",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AddColumn<bool>(
                name: "BatBuocGhiChu",
                table: "ChuyenTiepWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "BatBuocTaiLieu",
                table: "ChuyenTiepWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "DieuKienKichHoat",
                table: "ChuyenTiepWorkflow",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "LUON");

            migrationBuilder.AddColumn<string>(
                name: "HuongXuLyKhongDuyet",
                table: "ChuyenTiepWorkflow",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KetQuaApDung",
                table: "ChuyenTiepWorkflow",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VaiTroApDungId",
                table: "ChuyenTiepWorkflow",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "BatBuocDungSLA",
                table: "BuocWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "BatBuocGhiChu",
                table: "BuocWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "BatBuocKyTruocChuyenBuoc",
                table: "BuocWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "BatBuocTaiLieu",
                table: "BuocWorkflow",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DonViKyHoSoId",
                table: "BuocWorkflow",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DonViXuLyId",
                table: "BuocWorkflow",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MoTa",
                table: "BuocWorkflow",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NhanhWorkflowId",
                table: "BuocWorkflow",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NhomGiaiDoan",
                table: "BuocWorkflow",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ThuTu",
                table: "BuocWorkflow",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "NhomNhanhWorkflow",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkflowId = table.Column<int>(type: "int", nullable: false),
                    BuocTachNhanhId = table.Column<int>(type: "int", nullable: false),
                    TenNhom = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DieuKienHopNhat = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "ALL"),
                    SoNhanhHopNhatToiThieu = table.Column<int>(type: "int", nullable: true),
                    BuocSauHopNhatId = table.Column<int>(type: "int", nullable: false),
                    NgayTao = table.Column<DateTime>(type: "datetime2(3)", nullable: false, defaultValueSql: "GETDATE()"),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2(3)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NhomNhanhWorkflow", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NhomNhanhWorkflow_BuocWorkflow_BuocSauHopNhatId",
                        column: x => x.BuocSauHopNhatId,
                        principalTable: "BuocWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NhomNhanhWorkflow_BuocWorkflow_BuocTachNhanhId",
                        column: x => x.BuocTachNhanhId,
                        principalTable: "BuocWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NhomNhanhWorkflow_Workflow_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NhanhWorkflow",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NhomNhanhWorkflowId = table.Column<int>(type: "int", nullable: false),
                    MaNhanh = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenNhanh = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ThuTu = table.Column<int>(type: "int", nullable: false),
                    DonViXuLyId = table.Column<int>(type: "int", nullable: true),
                    VaiTroXuLyId = table.Column<int>(type: "int", nullable: true),
                    ThoiHanNgay = table.Column<decimal>(type: "decimal(5,2)", nullable: false, defaultValue: 0m),
                    LoaiHan = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "CANH_BAO"),
                    BuocDauTienId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NhanhWorkflow", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NhanhWorkflow_BuocWorkflow_BuocDauTienId",
                        column: x => x.BuocDauTienId,
                        principalTable: "BuocWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NhanhWorkflow_KhoaPhong_DonViXuLyId",
                        column: x => x.DonViXuLyId,
                        principalTable: "KhoaPhong",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NhanhWorkflow_NhomNhanhWorkflow_NhomNhanhWorkflowId",
                        column: x => x.NhomNhanhWorkflowId,
                        principalTable: "NhomNhanhWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NhanhWorkflow_VaiTro_VaiTroXuLyId",
                        column: x => x.VaiTroXuLyId,
                        principalTable: "VaiTro",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_NguoiDungId_DaDoc",
                table: "ThongBao",
                columns: new[] { "NguoiDungId", "DaDoc" });

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenTiepWorkflow_VaiTroApDungId",
                table: "ChuyenTiepWorkflow",
                column: "VaiTroApDungId");

            migrationBuilder.CreateIndex(
                name: "IX_BuocWorkflow_DonViKyHoSoId",
                table: "BuocWorkflow",
                column: "DonViKyHoSoId");

            migrationBuilder.CreateIndex(
                name: "IX_BuocWorkflow_DonViXuLyId",
                table: "BuocWorkflow",
                column: "DonViXuLyId");

            migrationBuilder.CreateIndex(
                name: "IX_BuocWorkflow_NhanhWorkflowId",
                table: "BuocWorkflow",
                column: "NhanhWorkflowId");

            migrationBuilder.CreateIndex(
                name: "IX_BuocWorkflow_WorkflowId_ThuTu",
                table: "BuocWorkflow",
                columns: new[] { "WorkflowId", "ThuTu" });

            migrationBuilder.CreateIndex(
                name: "IX_NhanhWorkflow_BuocDauTienId",
                table: "NhanhWorkflow",
                column: "BuocDauTienId");

            migrationBuilder.CreateIndex(
                name: "IX_NhanhWorkflow_DonViXuLyId",
                table: "NhanhWorkflow",
                column: "DonViXuLyId");

            migrationBuilder.CreateIndex(
                name: "IX_NhanhWorkflow_NhomNhanhWorkflowId_MaNhanh",
                table: "NhanhWorkflow",
                columns: new[] { "NhomNhanhWorkflowId", "MaNhanh" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_NhanhWorkflow_NhomNhanhWorkflowId_ThuTu",
                table: "NhanhWorkflow",
                columns: new[] { "NhomNhanhWorkflowId", "ThuTu" });

            migrationBuilder.CreateIndex(
                name: "IX_NhanhWorkflow_VaiTroXuLyId",
                table: "NhanhWorkflow",
                column: "VaiTroXuLyId");

            migrationBuilder.CreateIndex(
                name: "IX_NhomNhanhWorkflow_BuocSauHopNhatId",
                table: "NhomNhanhWorkflow",
                column: "BuocSauHopNhatId");

            migrationBuilder.CreateIndex(
                name: "IX_NhomNhanhWorkflow_BuocTachNhanhId",
                table: "NhomNhanhWorkflow",
                column: "BuocTachNhanhId");

            migrationBuilder.CreateIndex(
                name: "IX_NhomNhanhWorkflow_WorkflowId_BuocTachNhanhId",
                table: "NhomNhanhWorkflow",
                columns: new[] { "WorkflowId", "BuocTachNhanhId" });

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_KhoaPhong_DonViKyHoSoId",
                table: "BuocWorkflow",
                column: "DonViKyHoSoId",
                principalTable: "KhoaPhong",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_KhoaPhong_DonViXuLyId",
                table: "BuocWorkflow",
                column: "DonViXuLyId",
                principalTable: "KhoaPhong",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BuocWorkflow_NhanhWorkflow_NhanhWorkflowId",
                table: "BuocWorkflow",
                column: "NhanhWorkflowId",
                principalTable: "NhanhWorkflow",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChuyenTiepWorkflow_VaiTro_VaiTroApDungId",
                table: "ChuyenTiepWorkflow",
                column: "VaiTroApDungId",
                principalTable: "VaiTro",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ThongBao_NguoiDung_NguoiDungId",
                table: "ThongBao",
                column: "NguoiDungId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_KhoaPhong_DonViKyHoSoId",
                table: "BuocWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_KhoaPhong_DonViXuLyId",
                table: "BuocWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_BuocWorkflow_NhanhWorkflow_NhanhWorkflowId",
                table: "BuocWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_ChuyenTiepWorkflow_VaiTro_VaiTroApDungId",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropForeignKey(
                name: "FK_ThongBao_NguoiDung_NguoiDungId",
                table: "ThongBao");

            migrationBuilder.DropTable(
                name: "NhanhWorkflow");

            migrationBuilder.DropTable(
                name: "NhomNhanhWorkflow");

            migrationBuilder.DropIndex(
                name: "IX_ThongBao_NguoiDungId_DaDoc",
                table: "ThongBao");

            migrationBuilder.DropIndex(
                name: "IX_ChuyenTiepWorkflow_VaiTroApDungId",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropIndex(
                name: "IX_BuocWorkflow_DonViKyHoSoId",
                table: "BuocWorkflow");

            migrationBuilder.DropIndex(
                name: "IX_BuocWorkflow_DonViXuLyId",
                table: "BuocWorkflow");

            migrationBuilder.DropIndex(
                name: "IX_BuocWorkflow_NhanhWorkflowId",
                table: "BuocWorkflow");

            migrationBuilder.DropIndex(
                name: "IX_BuocWorkflow_WorkflowId_ThuTu",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "LaQuyTrinhChuan",
                table: "Workflow");

            migrationBuilder.DropColumn(
                name: "LoaiHinhDauThau",
                table: "Workflow");

            migrationBuilder.DropColumn(
                name: "MoTaNgan",
                table: "Workflow");

            migrationBuilder.DropColumn(
                name: "PhamViApDung",
                table: "Workflow");

            migrationBuilder.DropColumn(
                name: "BatBuocGhiChu",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropColumn(
                name: "BatBuocTaiLieu",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropColumn(
                name: "DieuKienKichHoat",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropColumn(
                name: "HuongXuLyKhongDuyet",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropColumn(
                name: "KetQuaApDung",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropColumn(
                name: "VaiTroApDungId",
                table: "ChuyenTiepWorkflow");

            migrationBuilder.DropColumn(
                name: "BatBuocDungSLA",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "BatBuocGhiChu",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "BatBuocKyTruocChuyenBuoc",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "BatBuocTaiLieu",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "DonViKyHoSoId",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "DonViXuLyId",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "MoTa",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "NhanhWorkflowId",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "NhomGiaiDoan",
                table: "BuocWorkflow");

            migrationBuilder.DropColumn(
                name: "ThuTu",
                table: "BuocWorkflow");

            migrationBuilder.AlterColumn<string>(
                name: "NoiDung",
                table: "ThongBao",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_IdCongKhai",
                table: "ThongBao",
                column: "IdCongKhai",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThongBao_NguoiDungId_DaDoc_NgayTao",
                table: "ThongBao",
                columns: new[] { "NguoiDungId", "DaDoc", "NgayTao" });

            migrationBuilder.AddForeignKey(
                name: "FK_ThongBao_NguoiDung_NguoiDungId",
                table: "ThongBao",
                column: "NguoiDungId",
                principalTable: "NguoiDung",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
