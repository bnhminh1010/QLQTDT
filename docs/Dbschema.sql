-- =====================================================
-- HỆ THỐNG QUẢN LÝ ĐẤU THẦU BỆNH VIỆN
-- Enterprise Workflow-Driven Database Design
-- =====================================================

-- =====================================================
-- 1. AUTHENTICATION & AUTHORIZATION
-- =====================================================

CREATE TABLE KhoaPhong (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IdCongKhai UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL,
    MaKhoaPhong VARCHAR(50) NOT NULL UNIQUE,
    TenKhoaPhong NVARCHAR(255) NOT NULL,

    DaXoa BIT DEFAULT 0,
    NgayTao DATETIME2 DEFAULT GETDATE(),
    NgayCapNhat DATETIME2 NULL
);
GO

CREATE TABLE NguoiDung (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IdCongKhai UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL,

    TenDangNhap VARCHAR(100) NOT NULL UNIQUE,
    MatKhauHash VARCHAR(255) NOT NULL,
    HoTen NVARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    SoDienThoai VARCHAR(20) NULL,

    TrangThaiHoatDong BIT DEFAULT 1,

    NgayDangNhapCuoi DATETIME2 NULL,
    NgayTao DATETIME2 DEFAULT GETDATE(),
    NgayCapNhat DATETIME2 NULL,

    DaXoa BIT DEFAULT 0
);
GO

CREATE TABLE VaiTro (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MaVaiTro VARCHAR(50) UNIQUE NOT NULL,
    TenVaiTro NVARCHAR(255) NOT NULL,
    MoTa NVARCHAR(MAX),

    DaXoa BIT DEFAULT 0
);
GO

CREATE TABLE Quyen (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MaQuyen VARCHAR(100) UNIQUE NOT NULL,
    TenQuyen NVARCHAR(255) NOT NULL,
    MoTa NVARCHAR(MAX) NULL,

    DaXoa BIT DEFAULT 0
);
GO

CREATE TABLE VaiTro_Quyen (
    VaiTroId INT NOT NULL,
    QuyenId INT NOT NULL,

    PRIMARY KEY (VaiTroId, QuyenId),

    FOREIGN KEY (VaiTroId) REFERENCES VaiTro(Id),
    FOREIGN KEY (QuyenId) REFERENCES Quyen(Id)
);
GO

CREATE TABLE NguoiDung_KhoaPhong_VaiTro (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    NguoiDungId INT NOT NULL,
    KhoaPhongId INT NOT NULL,
    VaiTroId INT NOT NULL,

    LaChinh BIT DEFAULT 1,

    FOREIGN KEY (NguoiDungId) REFERENCES NguoiDung(Id),
    FOREIGN KEY (KhoaPhongId) REFERENCES KhoaPhong(Id),
    FOREIGN KEY (VaiTroId) REFERENCES VaiTro(Id),

    CONSTRAINT UQ_UserDepartmentRole UNIQUE (
        NguoiDungId,
        KhoaPhongId,
        VaiTroId
    )
);
GO

-- =====================================================
-- 2. PROCUREMENT REQUEST DOMAIN
-- =====================================================

CREATE TABLE DeXuatMuaSam (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    IdCongKhai UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL,

    MaDeXuat VARCHAR(50) NOT NULL UNIQUE,
    TieuDe NVARCHAR(500) NOT NULL,
    MoTa NVARCHAR(MAX) NULL,

    KhoaPhongId INT NOT NULL,
    NguoiDeXuatId INT NOT NULL,

    TongDuToan DECIMAL(18,0) NOT NULL,

    TrangThai VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    NgayDeXuat DATETIME2 DEFAULT GETDATE(),
    NgayCapNhat DATETIME2 NULL,

    DaXoa BIT DEFAULT 0,

    FOREIGN KEY (KhoaPhongId) REFERENCES KhoaPhong(Id),
    FOREIGN KEY (NguoiDeXuatId) REFERENCES NguoiDung(Id)
);
GO

CREATE TABLE ChiTietDeXuat (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    DeXuatId BIGINT NOT NULL,

    MaVatTu VARCHAR(50) NOT NULL,
    TenVatTu NVARCHAR(255) NOT NULL,

    DonViTinh NVARCHAR(50) NULL,

    SoLuong DECIMAL(18,2) NOT NULL,
    DonGiaDuToan DECIMAL(18,0) NOT NULL,

    ThanhTien AS (SoLuong * DonGiaDuToan),

    FOREIGN KEY (DeXuatId)
        REFERENCES DeXuatMuaSam(Id)
        ON DELETE CASCADE
);
GO

-- =====================================================
-- 3. WORKFLOW ENGINE
-- =====================================================

CREATE TABLE HinhThucDauThau (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    MaHinhThuc VARCHAR(50) UNIQUE NOT NULL,
    TenHinhThuc NVARCHAR(255) NOT NULL,

    HanMucToiDa DECIMAL(18,0) NULL,

    TrangThaiHoatDong BIT DEFAULT 1
);
GO

CREATE TABLE Workflow (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    MaWorkflow VARCHAR(50) UNIQUE NOT NULL,
    TenWorkflow NVARCHAR(255) NOT NULL,

    HinhThucId INT NOT NULL,

    TrangThaiHoatDong BIT DEFAULT 1,

    FOREIGN KEY (HinhThucId)
        REFERENCES HinhThucDauThau(Id)
);
GO

CREATE TABLE BuocWorkflow (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    WorkflowId INT NULL,

    WorkflowDuocChonThuCong BIT DEFAULT 0,
    LyDoChonWorkflow NVARCHAR(MAX) NULL,

    MaBuoc VARCHAR(50) NOT NULL,
    TenBuoc NVARCHAR(255) NOT NULL,

    LoaiBuoc VARCHAR(50) NOT NULL,

    VaiTroXuLyId INT NULL,
    KhoaPhongXuLyId INT NULL,

    SoNgaySLA INT DEFAULT 0,

    ChoPhepTuChoi BIT DEFAULT 1,
    ChoPhepBoQua BIT DEFAULT 0,

    FOREIGN KEY (WorkflowId)
        REFERENCES Workflow(Id),

    FOREIGN KEY (VaiTroXuLyId)
        REFERENCES VaiTro(Id),

    FOREIGN KEY (KhoaPhongXuLyId)
        REFERENCES KhoaPhong(Id)
);
GO

CREATE TABLE WorkflowRule (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    WorkflowId INT NOT NULL,

    DieuKien NVARCHAR(MAX) NULL,

    DoUuTien INT DEFAULT 0,

    ChoPhepTuChon BIT DEFAULT 1,

    FOREIGN KEY (WorkflowId)
        REFERENCES Workflow(Id)
);
GO

CREATE TABLE ChuyenTiepWorkflow (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    TuBuocId INT NOT NULL,
    DenBuocId INT NOT NULL,

    HanhDong VARCHAR(50) NOT NULL,
    DieuKien NVARCHAR(MAX) NULL,

    FOREIGN KEY (TuBuocId)
        REFERENCES BuocWorkflow(Id),

    FOREIGN KEY (DenBuocId)
        REFERENCES BuocWorkflow(Id)
);
GO

-- =====================================================
-- 4. TENDER PACKAGE DOMAIN
-- =====================================================

CREATE TABLE GoiThau (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    IdCongKhai UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL,

    MaGoiThau VARCHAR(50) UNIQUE NOT NULL,
    TenGoiThau NVARCHAR(500) NOT NULL,

    DeXuatId BIGINT NULL,

    KhoaPhongId INT NOT NULL,
    NguoiTaoId INT NOT NULL,

    HinhThucId INT NOT NULL,
    WorkflowId INT NOT NULL,

    NganSach DECIMAL(18,0) NOT NULL,

    TrangThai VARCHAR(50) NOT NULL,

    NgayTao DATETIME2 DEFAULT GETDATE(),
    NgayCapNhat DATETIME2 NULL,

    FOREIGN KEY (DeXuatId)
        REFERENCES DeXuatMuaSam(Id),

    FOREIGN KEY (KhoaPhongId)
        REFERENCES KhoaPhong(Id),

    FOREIGN KEY (NguoiTaoId)
        REFERENCES NguoiDung(Id),

    FOREIGN KEY (HinhThucId)
        REFERENCES HinhThucDauThau(Id),

    FOREIGN KEY (WorkflowId)
        REFERENCES Workflow(Id)
);
GO

CREATE TABLE ChiTietGoiThau (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    GoiThauId BIGINT NOT NULL,

    MaVatTu VARCHAR(50) NOT NULL,
    TenVatTu NVARCHAR(255) NOT NULL,

    SoLuong DECIMAL(18,2) NOT NULL,
    DonGiaDuToan DECIMAL(18,0) NOT NULL,

    FOREIGN KEY (GoiThauId)
        REFERENCES GoiThau(Id)
        ON DELETE CASCADE
);
GO

-- =====================================================
-- 5. WORKFLOW RUNTIME ENGINE
-- =====================================================

CREATE TABLE WorkflowInstance (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    GoiThauId BIGINT NOT NULL,
    WorkflowId INT NOT NULL,

    BuocHienTaiId INT NULL,

    TrangThai VARCHAR(50) NOT NULL,

    NgayBatDau DATETIME2 DEFAULT GETDATE(),
    NgayHoanThanh DATETIME2 NULL,

    FOREIGN KEY (GoiThauId)
        REFERENCES GoiThau(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (WorkflowId)
        REFERENCES Workflow(Id),

    FOREIGN KEY (BuocHienTaiId)
        REFERENCES BuocWorkflow(Id)
);
GO

CREATE TABLE WorkflowStepInstance (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    WorkflowInstanceId BIGINT NOT NULL,
    BuocWorkflowId INT NOT NULL,

    NguoiXuLyId INT NULL,

    TrangThai VARCHAR(50) NOT NULL,

    NgayBatDau DATETIME2 NULL,
    NgayHoanThanh DATETIME2 NULL,

    HanXuLy DATETIME2 NULL,
    QuaHan BIT DEFAULT 0,

    FOREIGN KEY (WorkflowInstanceId)
        REFERENCES WorkflowInstance(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (BuocWorkflowId)
        REFERENCES BuocWorkflow(Id),

    FOREIGN KEY (NguoiXuLyId)
        REFERENCES NguoiDung(Id)
);
GO

CREATE TABLE WorkflowAssignment (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    WorkflowStepInstanceId BIGINT NOT NULL,

    NguoiDuocGiaoId INT NOT NULL,

    NgayGiao DATETIME2 DEFAULT GETDATE(),

    DaXuLy BIT DEFAULT 0,

    FOREIGN KEY (WorkflowStepInstanceId)
        REFERENCES WorkflowStepInstance(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (NguoiDuocGiaoId)
        REFERENCES NguoiDung(Id)
);
GO

CREATE TABLE WorkflowActionHistory (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    WorkflowInstanceId BIGINT NOT NULL,
    StepInstanceId BIGINT NOT NULL,

    NguoiThucHienId INT NOT NULL,

    HanhDong VARCHAR(50) NOT NULL,
    GhiChu NVARCHAR(MAX) NULL,

    ThoiGianThucHien DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (WorkflowInstanceId)
        REFERENCES WorkflowInstance(Id),

    FOREIGN KEY (StepInstanceId)
        REFERENCES WorkflowStepInstance(Id),

    FOREIGN KEY (NguoiThucHienId)
        REFERENCES NguoiDung(Id)
);
GO

-- =====================================================
-- 6. DOCUMENT MANAGEMENT
-- =====================================================

CREATE TABLE TaiLieuHoSo (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    IdCongKhai UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() NOT NULL,

    GoiThauId BIGINT NULL,
    DeXuatId BIGINT NULL,

    LoaiTaiLieu VARCHAR(50) NOT NULL,

    TenFile NVARCHAR(255) NOT NULL,
    DuongDanFile VARCHAR(1000) NOT NULL,

    DungLuongFile BIGINT NOT NULL,
    MaCheckSum VARCHAR(64) NULL,

    PhienBan INT DEFAULT 1,

    NguoiTaiUpId INT NOT NULL,

    NgayTaiUp DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (GoiThauId)
        REFERENCES GoiThau(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (DeXuatId)
        REFERENCES DeXuatMuaSam(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (NguoiTaiUpId)
        REFERENCES NguoiDung(Id)
);
GO

CREATE TABLE ChuKySo (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    TaiLieuId BIGINT NOT NULL,
    NguoiKyId INT NOT NULL,

    SignatureProvider VARCHAR(255) NOT NULL,
    SignatureHash VARCHAR(MAX) NOT NULL,

    SignedAt DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (TaiLieuId)
        REFERENCES TaiLieuHoSo(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (NguoiKyId)
        REFERENCES NguoiDung(Id)
);
GO

-- =====================================================
-- 7. VENDOR MANAGEMENT
-- =====================================================

CREATE TABLE NhaThau (
    Id INT IDENTITY(1,1) PRIMARY KEY,

    MaSoThue VARCHAR(20) NOT NULL UNIQUE,
    TenCongTy NVARCHAR(255) NOT NULL,

    DiaChi NVARCHAR(MAX) NULL,
    NguoiDaiDien NVARCHAR(255) NULL,
    Email VARCHAR(100) NULL,
    SoDienThoai VARCHAR(20) NULL,

    TrangThaiHoatDong BIT DEFAULT 1
);
GO

CREATE TABLE HoSoNangLuc (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    NhaThauId INT NOT NULL,

    LoaiTaiLieu VARCHAR(100) NOT NULL,

    TenFile NVARCHAR(255) NOT NULL,
    DuongDanFile VARCHAR(1000) NOT NULL,

    NgayHetHan DATE NULL,

    FOREIGN KEY (NhaThauId)
        REFERENCES NhaThau(Id)
        ON DELETE CASCADE
);
GO

CREATE TABLE HoSoDuThau (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    GoiThauId BIGINT NOT NULL,
    NhaThauId INT NOT NULL,

    GiaDuThau DECIMAL(18,0) NOT NULL,

    TrangThai VARCHAR(50) NOT NULL,

    NgayNop DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (GoiThauId)
        REFERENCES GoiThau(Id)
        ON DELETE CASCADE,

    FOREIGN KEY (NhaThauId)
        REFERENCES NhaThau(Id)
);
GO

-- =====================================================
-- 8. CONTRACT MANAGEMENT
-- =====================================================

CREATE TABLE HopDong (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    GoiThauId BIGINT NOT NULL,
    NhaThauId INT NOT NULL,

    SoHopDong VARCHAR(100) UNIQUE NOT NULL,

    TongGiaTri DECIMAL(18,0) NOT NULL,

    NgayKy DATE NULL,
    NgayHetHan DATE NULL,

    TrangThaiHopDong VARCHAR(50) NOT NULL,

    FOREIGN KEY (GoiThauId)
        REFERENCES GoiThau(Id),

    FOREIGN KEY (NhaThauId)
        REFERENCES NhaThau(Id)
);
GO

CREATE TABLE PhuLucHopDong (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    HopDongId BIGINT NOT NULL,

    SoPhuLuc VARCHAR(100) NOT NULL,
    NoiDung NVARCHAR(MAX) NULL,

    GiaTriDieuChinh DECIMAL(18,0) NULL,

    NgayKy DATE NULL,

    FOREIGN KEY (HopDongId)
        REFERENCES HopDong(Id)
        ON DELETE CASCADE
);
GO

CREATE TABLE NghiemThu (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    HopDongId BIGINT NOT NULL,

    NgayNghiemThu DATE NOT NULL,

    KetQua NVARCHAR(MAX) NULL,

    FOREIGN KEY (HopDongId)
        REFERENCES HopDong(Id)
        ON DELETE CASCADE
);
GO

CREATE TABLE QuyetToan (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    HopDongId BIGINT NOT NULL,

    TongGiaTriQuyetToan DECIMAL(18,0) NOT NULL,

    NgayQuyetToan DATE NULL,

    FOREIGN KEY (HopDongId)
        REFERENCES HopDong(Id)
        ON DELETE CASCADE
);
GO

-- =====================================================
-- 9. NOTIFICATION SYSTEM
-- =====================================================

CREATE TABLE ThongBao (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    NguoiNhanId INT NOT NULL,

    TieuDe NVARCHAR(255) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,

    LoaiThongBao VARCHAR(50) NOT NULL,

    LinkDieuHuong VARCHAR(500) NULL,

    DaDoc BIT DEFAULT 0,

    NgayTao DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (NguoiNhanId)
        REFERENCES NguoiDung(Id)
);
GO

-- =====================================================
-- 10. AUDIT & LOGGING
-- =====================================================

CREATE TABLE NhatKyKiemToan (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    GoiThauId BIGINT NULL,

    HanhDong VARCHAR(100) NOT NULL,

    MoTaChiTiet NVARCHAR(MAX) NOT NULL,

    NguoiThucHienId INT NOT NULL,

    ThoiGianThucHien DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (GoiThauId)
        REFERENCES GoiThau(Id),

    FOREIGN KEY (NguoiThucHienId)
        REFERENCES NguoiDung(Id)
);
GO

CREATE TRIGGER TRG_Chan_CapNhat_Xoa_NhatKy
ON NhatKyKiemToan
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    THROW 51000,
          N'Audit trail bất biến, không sửa/xóa được!',
          1;
END;
GO

-- =====================================================
-- 11. EXTERNAL INTEGRATION
-- =====================================================

CREATE TABLE IntegrationLog (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,

    HeThong VARCHAR(100) NOT NULL,

    LoaiDongBo VARCHAR(100) NOT NULL,

    RequestPayload NVARCHAR(MAX) NULL,
    ResponsePayload NVARCHAR(MAX) NULL,

    TrangThai VARCHAR(50) NOT NULL,

    ThoiGianDongBo DATETIME2 DEFAULT GETDATE()
);
GO

-- =====================================================
-- 12. INDEXES
-- =====================================================

CREATE INDEX IX_GoiThau_TrangThai
ON GoiThau(TrangThai);
GO

CREATE INDEX IX_GoiThau_KhoaPhong
ON GoiThau(KhoaPhongId);
GO

CREATE INDEX IX_WorkflowStepInstance_TrangThai
ON WorkflowStepInstance(TrangThai);
GO

CREATE INDEX IX_ThongBao_NguoiNhan
ON ThongBao(NguoiNhanId, DaDoc);
GO

CREATE INDEX IX_Audit_GoiThau
ON NhatKyKiemToan(GoiThauId);
GO
