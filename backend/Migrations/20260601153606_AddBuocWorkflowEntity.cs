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
            // Tạo BuocWorkflow không có WorkflowDuocChonThuCong và LyDoChonWorkflow
            // (hai cột đó được thêm sau bởi migration AlignSchemaWithDbschema)
            migrationBuilder.CreateTable(
                name: "BuocWorkflow",
                columns: table => new
                {
                    Id                = table.Column<int>(type: "int", nullable: false)
                                             .Annotation("SqlServer:Identity", "1, 1"),
                    WorkflowId        = table.Column<int>(type: "int", nullable: false),
                    MaBuoc            = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TenBuoc           = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    LoaiBuoc          = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    VaiTroXuLyId      = table.Column<int>(type: "int", nullable: true),
                    KhoaPhongXuLyId   = table.Column<int>(type: "int", nullable: true),
                    SoNgaySLA         = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    ChoPhepTuChoi     = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ChoPhepBoQua      = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BuocWorkflow", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BuocWorkflow_Workflow_WorkflowId",
                        column: x => x.WorkflowId,
                        principalTable: "Workflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BuocWorkflow_VaiTro_VaiTroXuLyId",
                        column: x => x.VaiTroXuLyId,
                        principalTable: "VaiTro",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BuocWorkflow_KhoaPhong_KhoaPhongXuLyId",
                        column: x => x.KhoaPhongXuLyId,
                        principalTable: "KhoaPhong",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BuocWorkflow_WorkflowId_MaBuoc",
                table: "BuocWorkflow",
                columns: new[] { "WorkflowId", "MaBuoc" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BuocWorkflow_VaiTroXuLyId",
                table: "BuocWorkflow",
                column: "VaiTroXuLyId");

            migrationBuilder.CreateTable(
                name: "ChuyenTiepWorkflow",
                columns: table => new
                {
                    Id        = table.Column<int>(type: "int", nullable: false)
                                     .Annotation("SqlServer:Identity", "1, 1"),
                    TuBuocId  = table.Column<int>(type: "int", nullable: false),
                    DenBuocId = table.Column<int>(type: "int", nullable: false),
                    HanhDong  = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DieuKien  = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChuyenTiepWorkflow", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChuyenTiepWorkflow_BuocWorkflow_TuBuocId",
                        column: x => x.TuBuocId,
                        principalTable: "BuocWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChuyenTiepWorkflow_BuocWorkflow_DenBuocId",
                        column: x => x.DenBuocId,
                        principalTable: "BuocWorkflow",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenTiepWorkflow_TuBuocId",
                table: "ChuyenTiepWorkflow",
                column: "TuBuocId");

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenTiepWorkflow_DenBuocId",
                table: "ChuyenTiepWorkflow",
                column: "DenBuocId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ChuyenTiepWorkflow");
            migrationBuilder.DropTable(name: "BuocWorkflow");
        }
    }
}
