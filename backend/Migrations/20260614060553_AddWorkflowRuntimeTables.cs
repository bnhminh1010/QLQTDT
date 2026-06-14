using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowRuntimeTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ─── 1. Fix GoiThauId: BIGINT → INT (Dbschema: BIGINT, EF model: INT) ──
            // This is the root cause of InvalidCastException (Int64 → Int32) at ProcessStep
            migrationBuilder.Sql(@"
                IF EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'WorkflowInstance')
                      AND name = N'GoiThauId'
                      AND system_type_id = 127 /* BIGINT */)
                BEGIN
                    -- Must drop FK references first before altering column type
                    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_WorkflowInstance_GoiThau_GoiThauId')
                        ALTER TABLE WorkflowInstance DROP CONSTRAINT FK_WorkflowInstance_GoiThau_GoiThauId;

                    ALTER TABLE WorkflowInstance ALTER COLUMN GoiThauId INT NOT NULL;

                    ALTER TABLE WorkflowInstance
                        ADD CONSTRAINT FK_WorkflowInstance_GoiThau_GoiThauId
                        FOREIGN KEY (GoiThauId) REFERENCES GoiThau(Id) ON DELETE CASCADE;
                END");

            // ─── 2. WorkflowStepInstance (if not exists) ──────────────────────────
            if (!migrationBuilder.IsSqlServer())
                return;
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'WorkflowStepInstance') IS NULL
                BEGIN
                    CREATE TABLE WorkflowStepInstance (
                        Id BIGINT IDENTITY(1,1) NOT NULL,
                        WorkflowInstanceId BIGINT NOT NULL,
                        BuocWorkflowId INT NOT NULL,
                        TrangThai NVARCHAR(50) NOT NULL DEFAULT N'DANG_XU_LY',
                        NgayBatDau DATETIME2 NOT NULL DEFAULT GETDATE(),
                        NgayHoanThanh DATETIME2 NULL,
                        NguoiXuLyId INT NULL,
                        GhiChu NVARCHAR(1000) NULL,
                        RowVersion ROWVERSION NULL,
                        CONSTRAINT PK_WorkflowStepInstance PRIMARY KEY (Id),
                        CONSTRAINT FK_WorkflowStepInstance_WorkflowInstance
                            FOREIGN KEY (WorkflowInstanceId) REFERENCES WorkflowInstance(Id) ON DELETE CASCADE,
                        CONSTRAINT FK_WorkflowStepInstance_BuocWorkflow
                            FOREIGN KEY (BuocWorkflowId) REFERENCES BuocWorkflow(Id) ON DELETE CASCADE,
                        CONSTRAINT FK_WorkflowStepInstance_NguoiDung
                            FOREIGN KEY (NguoiXuLyId) REFERENCES NguoiDung(Id) ON DELETE SET NULL
                    );
                END");

            // ─── 3. WorkflowAssignment (if not exists) ────────────────────────────
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'WorkflowAssignment') IS NULL
                BEGIN
                    CREATE TABLE WorkflowAssignment (
                        Id BIGINT IDENTITY(1,1) NOT NULL,
                        WorkflowStepInstanceId BIGINT NOT NULL,
                        NguoiDuocGiaoId INT NOT NULL,
                        DaXuLy BIT NOT NULL DEFAULT 0,
                        NgayGiao DATETIME2 NOT NULL DEFAULT GETDATE(),
                        NgayXuLy DATETIME2 NULL,
                        GhiChu NVARCHAR(1000) NULL,
                        CONSTRAINT PK_WorkflowAssignment PRIMARY KEY (Id),
                        CONSTRAINT FK_WorkflowAssignment_WorkflowStepInstance
                            FOREIGN KEY (WorkflowStepInstanceId) REFERENCES WorkflowStepInstance(Id) ON DELETE CASCADE,
                        CONSTRAINT FK_WorkflowAssignment_NguoiDung
                            FOREIGN KEY (NguoiDuocGiaoId) REFERENCES NguoiDung(Id)
                    );
                END");

            // ─── 4. WorkflowActionHistory (if not exists) ─────────────────────────
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'WorkflowActionHistory') IS NULL
                BEGIN
                    CREATE TABLE WorkflowActionHistory (
                        Id BIGINT IDENTITY(1,1) NOT NULL,
                        WorkflowInstanceId BIGINT NOT NULL,
                        WorkflowStepInstanceId BIGINT NULL,
                        HanhDong NVARCHAR(50) NOT NULL,
                        GhiChu NVARCHAR(1000) NULL,
                        NguoiThucHienId INT NOT NULL,
                        ThoiGian DATETIME2 NOT NULL DEFAULT GETDATE(),
                        CONSTRAINT PK_WorkflowActionHistory PRIMARY KEY (Id),
                        CONSTRAINT FK_WorkflowActionHistory_WorkflowInstance
                            FOREIGN KEY (WorkflowInstanceId) REFERENCES WorkflowInstance(Id),
                        CONSTRAINT FK_WorkflowActionHistory_WorkflowStepInstance
                            FOREIGN KEY (WorkflowStepInstanceId) REFERENCES WorkflowStepInstance(Id) ON DELETE SET NULL
                    );
                END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ─── Reverse: drop tables if they exist ──────────────────────────────
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'WorkflowAssignment') IS NOT NULL
                    DROP TABLE WorkflowAssignment;
                IF OBJECT_ID(N'WorkflowActionHistory') IS NOT NULL
                    DROP TABLE WorkflowActionHistory;
                IF OBJECT_ID(N'WorkflowStepInstance') IS NOT NULL
                    DROP TABLE WorkflowStepInstance;
            ");
        }
    }
}
