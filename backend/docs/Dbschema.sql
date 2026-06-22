-- ============================================================
-- Workflow Schema (WorkflowStepInstance + related tables)
-- ============================================================

CREATE TABLE NhomVaiTro (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    MaNhom      VARCHAR(50) UNIQUE NOT NULL,
    TenNhom     NVARCHAR(100) NOT NULL,
    DoUuTien    INT DEFAULT 0,
    MoTa        NVARCHAR(MAX) NULL,
    DaXoa       BIT DEFAULT 0
);

INSERT INTO NhomVaiTro (MaNhom, TenNhom, DoUuTien) VALUES
    ('CAP_CAO', N'Cấp cao', 1),
    ('TRUNG_BINH', N'Trung bình', 3),
    ('THAP', N'Thấp', 5);

CREATE TABLE BuocWorkflow (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    WorkflowId      INT NOT NULL REFERENCES Workflow(Id),
    MaBuoc          VARCHAR(50) NOT NULL,
    TenBuoc         NVARCHAR(255) NOT NULL,
    LoaiBuoc        VARCHAR(50) NOT NULL,
    VaiTroXuLyHoSoId INT NULL REFERENCES VaiTro(Id),
    SoNgayLapHoSo   INT NOT NULL DEFAULT 0,
    VaiTroKyDuyetId INT NULL REFERENCES VaiTro(Id),
    SoNgayXuLy      INT NOT NULL DEFAULT 0,
    LoaiHan         VARCHAR(20) NOT NULL DEFAULT 'CANH_BAO',
    NhomSongSong    VARCHAR(50) NULL,
    LaBuocJoin      BIT NOT NULL DEFAULT 0,
    ChoPhepTuChoi   BIT NOT NULL DEFAULT 1,
    ChoPhepBoQua    BIT NOT NULL DEFAULT 0,
    WorkflowDuocChonThuCong BIT NOT NULL DEFAULT 0,
    LyDoChonWorkflow NVARCHAR(MAX) NULL,
    CONSTRAINT UQ_BuocWorkflow_WorkflowId_MaBuoc UNIQUE (WorkflowId, MaBuoc)
);

CREATE TABLE ChuyenTiepWorkflow (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    TuBuocId    INT NOT NULL REFERENCES BuocWorkflow(Id),
    DenBuocId   INT NOT NULL REFERENCES BuocWorkflow(Id),
    HanhDong    VARCHAR(50) NOT NULL,
    CONSTRAINT UQ_ChuyenTiep_TuBuoc_HanhDong UNIQUE (TuBuocId, HanhDong)
);

CREATE TABLE WorkflowInstance (
    Id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    GoiThauId       INT NOT NULL REFERENCES GoiThau(Id),
    WorkflowId      INT NOT NULL REFERENCES Workflow(Id),
    BuocHienTaiId   INT NULL,
    TrangThai       VARCHAR(50) NOT NULL,
    NgayBatDau      DATETIME2 NOT NULL DEFAULT GETDATE(),
    NgayHoanThanh   DATETIME2 NULL,
    RowVersion      ROWVERSION
);

CREATE TABLE WorkflowStepInstance (
    Id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
    WorkflowInstanceId  BIGINT NOT NULL REFERENCES WorkflowInstance(Id),
    BuocWorkflowId      INT NOT NULL REFERENCES BuocWorkflow(Id),
    TrangThai           VARCHAR(50) NOT NULL DEFAULT 'DANG_XU_LY',
    PhaHienTai          VARCHAR(20) NOT NULL DEFAULT 'LAP_HO_SO',
    NgayBatDau          DATETIME2 NOT NULL DEFAULT GETDATE(),
    NgayHoanThanh       DATETIME2 NULL,
    NguoiXuLyId         INT NULL REFERENCES NguoiDung(Id),
    NgayXuLy            DATETIME2 NULL,
    NguoiKyDuyetId      INT NULL REFERENCES NguoiDung(Id),
    NgayKyDuyet         DATETIME2 NULL,
    KetQua              VARCHAR(20) NULL,
    LyDoKhongDuyet      NVARCHAR(1000) NULL,
    TaiLieuDinhKem      NVARCHAR(MAX) NULL,
    HanXuLy             DATETIME2 NULL,
    QuaHan              BIT NULL,
    GhiChu              NVARCHAR(1000) NULL,
    RowVersion          ROWVERSION,
    CONSTRAINT FK_WorkflowStepInstance_BuocWorkflow FOREIGN KEY (BuocWorkflowId) REFERENCES BuocWorkflow(Id)
);

CREATE TABLE WorkflowAssignment (
    Id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    WorkflowStepInstanceId  BIGINT NOT NULL REFERENCES WorkflowStepInstance(Id),
    NguoiDuocGiaoId         INT NOT NULL REFERENCES NguoiDung(Id),
    DaXuLy                  BIT NOT NULL DEFAULT 0,
    NgayGiao                DATETIME2 NOT NULL DEFAULT GETDATE(),
    NgayXuLy                DATETIME2 NULL,
    PhieuKyDuyet            NVARCHAR(500) NULL,
    GhiChu                  NVARCHAR(1000) NULL,
    CONSTRAINT UQ_WorkflowAssignment_Step_Nguoi UNIQUE (WorkflowStepInstanceId, NguoiDuocGiaoId)
);

CREATE TABLE WorkflowActionHistory (
    Id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
    WorkflowInstanceId      BIGINT NOT NULL REFERENCES WorkflowInstance(Id),
    WorkflowStepInstanceId  BIGINT NULL REFERENCES WorkflowStepInstance(Id),
    HanhDong                VARCHAR(50) NOT NULL,
    GhiChu                  NVARCHAR(1000) NULL,
    NguoiThucHienId         INT NOT NULL,
    ThoiGian                DATETIME2 NOT NULL DEFAULT GETDATE()
);
