using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLQTDT.Api.Migrations;

public partial class CreateMissingWorkflowRuntimeTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
IF OBJECT_ID(N'WorkflowStepInstance', N'U') IS NULL
BEGIN
    CREATE TABLE WorkflowStepInstance
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WorkflowStepInstance PRIMARY KEY,
        WorkflowInstanceId BIGINT NOT NULL,
        BuocWorkflowId INT NOT NULL,
        TrangThai NVARCHAR(50) NOT NULL CONSTRAINT DF_WorkflowStepInstance_TrangThai DEFAULT (N'PENDING'),
        NgayBatDau DATETIME2 NOT NULL CONSTRAINT DF_WorkflowStepInstance_NgayBatDau DEFAULT (GETDATE()),
        NgayHoanThanh DATETIME2 NULL,
        NguoiXuLyId INT NULL,
        GhiChu NVARCHAR(1000) NULL,
        RowVersion ROWVERSION NOT NULL
    );
END
");

        migrationBuilder.Sql(@"
IF OBJECT_ID(N'WorkflowAssignment', N'U') IS NULL
BEGIN
    CREATE TABLE WorkflowAssignment
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WorkflowAssignment PRIMARY KEY,
        WorkflowStepInstanceId BIGINT NOT NULL,
        NguoiDuocGiaoId INT NOT NULL,
        DaXuLy BIT NOT NULL CONSTRAINT DF_WorkflowAssignment_DaXuLy DEFAULT (0),
        NgayGiao DATETIME2 NOT NULL CONSTRAINT DF_WorkflowAssignment_NgayGiao DEFAULT (GETDATE()),
        NgayXuLy DATETIME2 NULL,
        GhiChu NVARCHAR(1000) NULL
    );
END
");

        migrationBuilder.Sql(@"
IF OBJECT_ID(N'WorkflowActionHistory', N'U') IS NULL
BEGIN
    CREATE TABLE WorkflowActionHistory
    (
        Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WorkflowActionHistory PRIMARY KEY,
        WorkflowInstanceId BIGINT NOT NULL,
        WorkflowStepInstanceId BIGINT NULL,
        HanhDong NVARCHAR(50) NOT NULL,
        GhiChu NVARCHAR(1000) NULL,
        NguoiThucHienId INT NOT NULL,
        ThoiGian DATETIME2 NOT NULL CONSTRAINT DF_WorkflowActionHistory_ThoiGian DEFAULT (GETDATE())
    );
END
");

        migrationBuilder.Sql(@"
IF OBJECT_ID(N'FK_WorkflowStepInstance_WorkflowInstance', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowStepInstance
    ADD CONSTRAINT FK_WorkflowStepInstance_WorkflowInstance
    FOREIGN KEY (WorkflowInstanceId) REFERENCES WorkflowInstance(Id)
    ON DELETE CASCADE;
END

IF OBJECT_ID(N'FK_WorkflowStepInstance_BuocWorkflow', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowStepInstance
    ADD CONSTRAINT FK_WorkflowStepInstance_BuocWorkflow
    FOREIGN KEY (BuocWorkflowId) REFERENCES BuocWorkflow(Id)
    ON DELETE NO ACTION;
END

IF OBJECT_ID(N'FK_WorkflowStepInstance_NguoiDung', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowStepInstance
    ADD CONSTRAINT FK_WorkflowStepInstance_NguoiDung
    FOREIGN KEY (NguoiXuLyId) REFERENCES NguoiDung(Id)
    ON DELETE SET NULL;
END

IF OBJECT_ID(N'FK_WorkflowAssignment_StepInstance', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowAssignment
    ADD CONSTRAINT FK_WorkflowAssignment_StepInstance
    FOREIGN KEY (WorkflowStepInstanceId) REFERENCES WorkflowStepInstance(Id)
    ON DELETE CASCADE;
END

IF OBJECT_ID(N'FK_WorkflowAssignment_NguoiDung', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowAssignment
    ADD CONSTRAINT FK_WorkflowAssignment_NguoiDung
    FOREIGN KEY (NguoiDuocGiaoId) REFERENCES NguoiDung(Id)
    ON DELETE NO ACTION;
END

IF OBJECT_ID(N'FK_WorkflowActionHistory_Instance', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowActionHistory
    ADD CONSTRAINT FK_WorkflowActionHistory_Instance
    FOREIGN KEY (WorkflowInstanceId) REFERENCES WorkflowInstance(Id)
    ON DELETE NO ACTION;
END

IF OBJECT_ID(N'FK_WorkflowActionHistory_StepInstance', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowActionHistory
    ADD CONSTRAINT FK_WorkflowActionHistory_StepInstance
    FOREIGN KEY (WorkflowStepInstanceId) REFERENCES WorkflowStepInstance(Id)
    ON DELETE SET NULL;
END

IF OBJECT_ID(N'FK_WorkflowActionHistory_NguoiDung', N'F') IS NULL
BEGIN
    ALTER TABLE WorkflowActionHistory
    ADD CONSTRAINT FK_WorkflowActionHistory_NguoiDung
    FOREIGN KEY (NguoiThucHienId) REFERENCES NguoiDung(Id)
    ON DELETE NO ACTION;
END
");

        migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowStepInstance_WorkflowInstanceId' AND object_id = OBJECT_ID(N'WorkflowStepInstance'))
    CREATE INDEX IX_WorkflowStepInstance_WorkflowInstanceId ON WorkflowStepInstance(WorkflowInstanceId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowStepInstance_BuocWorkflowId' AND object_id = OBJECT_ID(N'WorkflowStepInstance'))
    CREATE INDEX IX_WorkflowStepInstance_BuocWorkflowId ON WorkflowStepInstance(BuocWorkflowId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowStepInstance_NguoiXuLyId' AND object_id = OBJECT_ID(N'WorkflowStepInstance'))
    CREATE INDEX IX_WorkflowStepInstance_NguoiXuLyId ON WorkflowStepInstance(NguoiXuLyId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowAssignment_WorkflowStepInstanceId_NguoiDuocGiaoId' AND object_id = OBJECT_ID(N'WorkflowAssignment'))
    CREATE UNIQUE INDEX IX_WorkflowAssignment_WorkflowStepInstanceId_NguoiDuocGiaoId ON WorkflowAssignment(WorkflowStepInstanceId, NguoiDuocGiaoId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowActionHistory_WorkflowInstanceId' AND object_id = OBJECT_ID(N'WorkflowActionHistory'))
    CREATE INDEX IX_WorkflowActionHistory_WorkflowInstanceId ON WorkflowActionHistory(WorkflowInstanceId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_WorkflowActionHistory_WorkflowStepInstanceId' AND object_id = OBJECT_ID(N'WorkflowActionHistory'))
    CREATE INDEX IX_WorkflowActionHistory_WorkflowStepInstanceId ON WorkflowActionHistory(WorkflowStepInstanceId);
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
IF OBJECT_ID(N'WorkflowActionHistory', N'U') IS NOT NULL
    DROP TABLE WorkflowActionHistory;

IF OBJECT_ID(N'WorkflowAssignment', N'U') IS NOT NULL
    DROP TABLE WorkflowAssignment;

IF OBJECT_ID(N'WorkflowStepInstance', N'U') IS NOT NULL
    DROP TABLE WorkflowStepInstance;
");
    }
}
