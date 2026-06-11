-- =====================================================
-- [BE][009] CRUD Đề Xuất Mua Sắm — Database Migration
-- Chạy script này để tạo các bảng mới và cột cần thiết
-- =====================================================

USE [QuanlyQTDauThau];
GO

-- 1. Tạo bảng cha DeXuatMuaSam (Đã bao gồm cột DaXoa)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DeXuatMuaSam]') AND type in (N'U'))
BEGIN
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

        DaXoa BIT DEFAULT 0 NOT NULL,

        FOREIGN KEY (KhoaPhongId) REFERENCES KhoaPhong(Id),
        FOREIGN KEY (NguoiDeXuatId) REFERENCES NguoiDung(Id)
    );
    PRINT 'Da tao bang DeXuatMuaSam thanh cong!';
END
ELSE
BEGIN
    -- Trường hợp bảng đã tồn tại từ trước nhưng thiếu cột DaXoa (dành cho môi trường đã có sẵn bảng)
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE object_id = OBJECT_ID('DeXuatMuaSam') AND name = 'DaXoa'
    )
    BEGIN
        ALTER TABLE DeXuatMuaSam ADD DaXoa BIT NOT NULL DEFAULT 0;
        PRINT 'Da bo sung cot DaXoa vao bang DeXuatMuaSam co san!';
    END
    ELSE
    BEGIN
        PRINT 'Bang DeXuatMuaSam va cot DaXoa da ton tai!';
    END
END
GO

-- 2. Tạo bảng con ChiTietDeXuat
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ChiTietDeXuat]') AND type in (N'U'))
BEGIN
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
    PRINT 'Da tao bang ChiTietDeXuat thanh cong!';
END
ELSE
BEGIN
    PRINT 'Bang ChiTietDeXuat da ton tai tu truoc!';
END
GO
