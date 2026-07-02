using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<NguoiDung> NguoiDungs => Set<NguoiDung>();
    public DbSet<KhoaPhong> KhoaPhongs => Set<KhoaPhong>();
    public DbSet<VaiTro> VaiTros => Set<VaiTro>();
    public DbSet<Quyen> Quyens => Set<Quyen>();
    public DbSet<VaiTroQuyen> VaiTroQuyens => Set<VaiTroQuyen>();
    public DbSet<NguoiDungKhoaPhongVaiTro> NguoiDungKhoaPhongVaiTros => Set<NguoiDungKhoaPhongVaiTro>();
    public DbSet<NhaThau> NhaThaus => Set<NhaThau>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<LoginLockout> LoginLockouts => Set<LoginLockout>();
    public DbSet<DeXuatMuaSam> DeXuatMuaSams => Set<DeXuatMuaSam>();
    public DbSet<ChiTietDeXuat> ChiTietDeXuats => Set<ChiTietDeXuat>();
    public DbSet<NhatKyKiemToan> NhatKyKiemToans { get; set; }
    public DbSet<IntegrationLog> IntegrationLogs => Set<IntegrationLog>();
    public DbSet<HinhThucDauThau> HinhThucDauThaus => Set<HinhThucDauThau>();
    public DbSet<Workflow> Workflows => Set<Workflow>();
    public DbSet<BuocWorkflow> BuocWorkflows => Set<BuocWorkflow>();
    public DbSet<ChuyenTiepWorkflow> ChuyenTiepWorkflows => Set<ChuyenTiepWorkflow>();
    public DbSet<WorkflowInstance> WorkflowInstances => Set<WorkflowInstance>();
    public DbSet<GoiThau> GoiThaus => Set<GoiThau>();
    public DbSet<WorkflowStepInstance> WorkflowStepInstances => Set<WorkflowStepInstance>();
    public DbSet<WorkflowAssignment> WorkflowAssignments => Set<WorkflowAssignment>();
    public DbSet<WorkflowActionHistory> WorkflowActionHistories => Set<WorkflowActionHistory>();
    public DbSet<LichSuTrangThaiGoiThau> LichSuTrangThaiGoiThaus => Set<LichSuTrangThaiGoiThau>();
    public DbSet<WorkflowVersionHistory> WorkflowVersionHistories => Set<WorkflowVersionHistory>();
    public DbSet<TaiLieuHoSo> TaiLieuHoSos => Set<TaiLieuHoSo>();
    public DbSet<HoSoNangLuc> HoSoNangLucs => Set<HoSoNangLuc>();
    public DbSet<HoSoDuThau> HoSoDuThaus => Set<HoSoDuThau>();
    public DbSet<NhomVaiTro> NhomVaiTros => Set<NhomVaiTro>();
    public DbSet<HopDong> HopDongs => Set<HopDong>();
    public DbSet<ThongBao> ThongBaos => Set<ThongBao>();
    public DbSet<YeuCauThayDoiThongTinNguoiDung> YeuCauThayDoiThongTinNguoiDungs => Set<YeuCauThayDoiThongTinNguoiDung>();
    public DbSet<NhomNhanhWorkflow> NhomNhanhWorkflows => Set<NhomNhanhWorkflow>();
    public DbSet<NhanhWorkflow> NhanhWorkflows => Set<NhanhWorkflow>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // NguoiDung
        // RefreshToken
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("RefreshToken");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime2(3)");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");

            // Self-referencing: ReplacedTokenId → Id
            entity.HasOne(e => e.ReplacedBy)
                .WithOne(r => r.ReplacedToken)
                .HasForeignKey<RefreshToken>(e => e.ReplacedTokenId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.NguoiDung)
                .WithMany()
                .HasForeignKey(e => e.NguoiDungId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasIndex(e => e.TokenFamilyId);
        });

        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.ToTable("NguoiDung");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.TenDangNhap).HasMaxLength(100).IsRequired();
            entity.Property(e => e.MatKhauHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.HoTen).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(100).IsRequired();
            entity.Property(e => e.SoDienThoai).HasMaxLength(20);
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.Property(e => e.NgayDangNhapCuoi).HasColumnType("datetime2(3)");
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayCapNhat).HasColumnType("datetime2(3)");
            entity.HasIndex(e => e.IdCongKhai).IsUnique();
            entity.HasIndex(e => e.TenDangNhap).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
        });

        // KhoaPhong
        modelBuilder.Entity<KhoaPhong>(entity =>
        {
            entity.ToTable("KhoaPhong");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.TenKhoaPhong).HasMaxLength(255).IsRequired();
            entity.Property(e => e.MaKhoaPhong).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.HasIndex(e => e.IdCongKhai).IsUnique();
            entity.HasIndex(e => e.MaKhoaPhong).IsUnique();
        });

        // VaiTro
        modelBuilder.Entity<VaiTro>(entity =>
        {
            entity.ToTable("VaiTro");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaVaiTro).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenVaiTro).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.HasIndex(e => e.MaVaiTro).IsUnique();
            entity.HasIndex(e => e.TenVaiTro).IsUnique();
            entity.HasOne(e => e.NhomVaiTro)
                .WithMany(n => n.VaiTros)
                .HasForeignKey(e => e.NhomVaiTroId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Quyen
        modelBuilder.Entity<Quyen>(entity =>
        {
            entity.ToTable("Quyen");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaQuyen).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TenQuyen).HasMaxLength(255).IsRequired();
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.HasIndex(e => e.MaQuyen).IsUnique();
        });

        // VaiTro_Quyen (composite key)
        modelBuilder.Entity<VaiTroQuyen>(entity =>
        {
            entity.ToTable("VaiTro_Quyen");
            entity.HasKey(e => new { e.VaiTroId, e.QuyenId });
            entity.HasOne(e => e.VaiTro).WithMany(v => v.VaiTroQuyens).HasForeignKey(e => e.VaiTroId);
            entity.HasOne(e => e.Quyen).WithMany(q => q.VaiTroQuyens).HasForeignKey(e => e.QuyenId);
        });

        // NguoiDung_KhoaPhong_VaiTro
        modelBuilder.Entity<NguoiDungKhoaPhongVaiTro>(entity =>
        {
            entity.ToTable("NguoiDung_KhoaPhong_VaiTro");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LaChinh).HasDefaultValue(true);
            entity.HasOne(e => e.NguoiDung).WithMany(n => n.NguoiDungKhoaPhongVaiTros).HasForeignKey(e => e.NguoiDungId);
            entity.HasOne(e => e.KhoaPhong).WithMany(k => k.NguoiDungKhoaPhongVaiTros).HasForeignKey(e => e.KhoaPhongId);
            entity.HasOne(e => e.VaiTro).WithMany(v => v.NguoiDungKhoaPhongVaiTros).HasForeignKey(e => e.VaiTroId);
            entity.HasIndex(e => new { e.NguoiDungId, e.KhoaPhongId, e.VaiTroId }).IsUnique();
        });

        // NhaThau
        modelBuilder.Entity<NhaThau>(entity =>
        {
            entity.ToTable("NhaThau");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaSoThue).HasMaxLength(20).IsRequired();
            entity.Property(e => e.TenCongTy).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.SoDienThoai).HasMaxLength(20);
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            entity.HasIndex(e => e.MaSoThue).IsUnique();
        });

        // PasswordResetToken
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.ToTable("PasswordResetToken");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ExpiresAt).HasColumnType("datetime2(3)");
            entity.Property(e => e.Used).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.NguoiDung).WithMany(n => n.PasswordResetTokens).HasForeignKey(e => e.NguoiDungId);
        });

        // LoginLockout
        modelBuilder.Entity<LoginLockout>(entity =>
        {
            entity.ToTable("LoginLockout");
            entity.HasKey(e => e.Identifier);
            entity.Property(e => e.Identifier).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FailedAttempts).IsRequired();
            entity.Property(e => e.LockoutEnd).HasColumnType("datetime2(3)");
            entity.Property(e => e.LastFailedAttempt).HasColumnType("datetime2(3)").IsRequired();
        });

        // DeXuatMuaSam
        modelBuilder.Entity<DeXuatMuaSam>(entity =>
        {
            entity.ToTable("DeXuatMuaSam");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.MaDeXuat).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TieuDe).HasMaxLength(500).IsRequired();
            entity.Property(e => e.TongDuToan).HasColumnType("decimal(18,0)");
            entity.Property(e => e.TrangThai).HasMaxLength(50).HasDefaultValue("DRAFT");
            entity.Property(e => e.NgayDeXuat).HasColumnType("datetime2").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayCapNhat).HasColumnType("datetime2");
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.HasIndex(e => e.IdCongKhai).IsUnique();
            entity.HasIndex(e => e.MaDeXuat).IsUnique();
            entity.HasOne(e => e.KhoaPhong).WithMany().HasForeignKey(e => e.KhoaPhongId);
            entity.HasOne(e => e.NguoiDeXuat).WithMany().HasForeignKey(e => e.NguoiDeXuatId);
        });

        // ChiTietDeXuat
        modelBuilder.Entity<ChiTietDeXuat>(entity =>
        {
            entity.ToTable("ChiTietDeXuat");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaVatTu).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenVatTu).HasMaxLength(255).IsRequired();
            entity.Property(e => e.DonViTinh).HasMaxLength(50);
            entity.Property(e => e.SoLuong).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DonGiaDuToan).HasColumnType("decimal(18,0)");
            entity.Property(e => e.ThanhTien)
                .HasColumnType("decimal(18,2)")
                .HasComputedColumnSql("[SoLuong] * [DonGiaDuToan]")
                .ValueGeneratedOnAddOrUpdate();
            entity.HasOne(e => e.DeXuat)
                .WithMany(d => d.ChiTiet)
                .HasForeignKey(e => e.DeXuatId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // NhatKyKiemToan
        modelBuilder.Entity<NhatKyKiemToan>(entity =>
        {
            entity.ToTable("NhatKyKiemToan");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.HanhDong).HasMaxLength(100).IsRequired();
            entity.Property(e => e.MoTaChiTiet).IsRequired();
            entity.Property(e => e.ThoiGianThucHien).HasDefaultValueSql("GETDATE()");
        });

        // IntegrationLog
        modelBuilder.Entity<IntegrationLog>(entity =>
        {
            entity.ToTable("IntegrationLog");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.HeThong).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LoaiDongBo).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TrangThai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ThoiGianDongBo).HasDefaultValueSql("GETDATE()");
        });

        // HinhThucDauThau
        modelBuilder.Entity<HinhThucDauThau>(entity =>
        {
            entity.ToTable("HinhThucDauThau");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaHinhThuc).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenHinhThuc).HasMaxLength(255).IsRequired();
            entity.Property(e => e.HanMucToiDa).HasColumnType("decimal(18,0)");
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            entity.HasIndex(e => e.MaHinhThuc).IsUnique();
        });

        // Workflow
        modelBuilder.Entity<Workflow>(entity =>
        {
            entity.ToTable("Workflow");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaWorkflow).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenWorkflow).HasMaxLength(255).IsRequired();
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            // Designer extensions
            entity.Property(e => e.LoaiHinhDauThau).HasMaxLength(100);
            entity.Property(e => e.PhamViApDung).HasMaxLength(500);
            entity.Property(e => e.MoTaNgan).HasMaxLength(1000);
            entity.Property(e => e.LaQuyTrinhChuan).HasDefaultValue(false);
            entity.HasIndex(e => e.MaWorkflow).IsUnique();
            entity.HasOne(e => e.HinhThuc)
                  .WithMany(h => h.Workflows)
                  .HasForeignKey(e => e.HinhThucId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Workflow shadow properties
        modelBuilder.Entity<Workflow>().Property<DateTime>("NgayTao").HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");

        // BuocWorkflow
        modelBuilder.Entity<BuocWorkflow>(entity =>
        {
            entity.ToTable("BuocWorkflow");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaBuoc).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenBuoc).HasMaxLength(255).IsRequired();
            entity.Property(e => e.LoaiBuoc).HasMaxLength(50).IsRequired();

            // 2-pha fields
            entity.Property(e => e.SoNgayLapHoSo).HasDefaultValue(0);
            entity.Property(e => e.SoNgayXuLy).HasDefaultValue(0);
            entity.Property(e => e.LoaiHan).HasMaxLength(20).IsRequired().HasDefaultValue("CANH_BAO");
            entity.Property(e => e.NhomSongSong).HasMaxLength(50);
            entity.Property(e => e.LaBuocJoin).HasDefaultValue(false);

            // Designer extensions
            entity.Property(e => e.ThuTu).HasDefaultValue(0);
            entity.Property(e => e.NhomGiaiDoan).HasMaxLength(100);
            entity.Property(e => e.MoTa).HasMaxLength(1000);
            entity.Property(e => e.BatBuocGhiChu).HasDefaultValue(false);
            entity.Property(e => e.BatBuocTaiLieu).HasDefaultValue(false);
            entity.Property(e => e.BatBuocKyTruocChuyenBuoc).HasDefaultValue(true);
            entity.Property(e => e.BatBuocDungSLA).HasDefaultValue(false);

            entity.Property(e => e.ChoPhepTuChoi).HasDefaultValue(true);
            entity.Property(e => e.ChoPhepBoQua).HasDefaultValue(false);
            entity.Property(e => e.WorkflowDuocChonThuCong).HasDefaultValue(false);
            entity.Property(e => e.LyDoChonWorkflow);

            entity.HasOne(e => e.Workflow)
                .WithMany(w => w.BuocWorkflows)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.VaiTroXuLyHoSo)
                .WithMany()
                .HasForeignKey(e => e.VaiTroXuLyHoSoId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.VaiTroKyDuyet)
                .WithMany()
                .HasForeignKey(e => e.VaiTroKyDuyetId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.DonViXuLy)
                .WithMany()
                .HasForeignKey(e => e.DonViXuLyId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.DonViKyHoSo)
                .WithMany()
                .HasForeignKey(e => e.DonViKyHoSoId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(e => e.NhanhWorkflow)
                .WithMany(n => n.BuocWorkflows)
                .HasForeignKey(e => e.NhanhWorkflowId)
                .OnDelete(DeleteBehavior.NoAction);
            entity.HasIndex(e => new { e.WorkflowId, e.MaBuoc }).IsUnique();
            entity.HasIndex(e => new { e.WorkflowId, e.ThuTu });
        });

        // ChuyenTiepWorkflow
        modelBuilder.Entity<ChuyenTiepWorkflow>(entity =>
        {
            entity.ToTable("ChuyenTiepWorkflow");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.HanhDong).HasMaxLength(50).IsRequired();
            // Designer extensions
            entity.Property(e => e.DieuKienKichHoat).HasMaxLength(50).HasDefaultValue("LUON");
            entity.Property(e => e.KetQuaApDung).HasMaxLength(50);
            entity.Property(e => e.BatBuocGhiChu).HasDefaultValue(false);
            entity.Property(e => e.BatBuocTaiLieu).HasDefaultValue(false);
            entity.Property(e => e.HuongXuLyKhongDuyet).HasMaxLength(50);
            entity.HasOne(e => e.TuBuoc)
                .WithMany(b => b.ChuyenTiepDi)
                .HasForeignKey(e => e.TuBuocId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.DenBuoc)
                .WithMany(b => b.ChuyenTiepDen)
                .HasForeignKey(e => e.DenBuocId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.VaiTroApDung)
                .WithMany()
                .HasForeignKey(e => e.VaiTroApDungId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(t => new { t.TuBuocId, t.HanhDong }).IsUnique();
        });

        // WorkflowInstance
        modelBuilder.Entity<WorkflowInstance>(entity =>
        {
            entity.ToTable("WorkflowInstance");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TrangThai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.NgayBatDau).HasColumnType("datetime2").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayHoanThanh).HasColumnType("datetime2");
            entity.Property(e => e.RowVersion).IsRowVersion();
            entity.HasOne(e => e.Workflow)
                .WithMany()
                .HasForeignKey(e => e.WorkflowId);
            entity.HasOne(e => e.GoiThau)
                .WithMany()
                .HasForeignKey(e => e.GoiThauId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // WorkflowStepInstance
        modelBuilder.Entity<WorkflowStepInstance>(entity =>
        {
            entity.ToTable("WorkflowStepInstance");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TrangThai).HasMaxLength(50).IsRequired().HasDefaultValue("DANG_XU_LY");
            entity.Property(e => e.NgayBatDau).HasColumnType("datetime2").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayHoanThanh).HasColumnType("datetime2");
            entity.Property(e => e.GhiChu).HasMaxLength(1000);
            entity.Property(e => e.RowVersion).IsRowVersion();

            // 2-pha fields
            entity.Property(e => e.PhaHienTai).HasMaxLength(20).IsRequired().HasDefaultValue("LAP_HO_SO");
            entity.Property(e => e.NgayXuLy).HasColumnType("datetime2");
            entity.Property(e => e.NgayKyDuyet).HasColumnType("datetime2");
            entity.Property(e => e.HanXuLy).HasColumnType("datetime2");
            entity.Property(e => e.QuaHan);
            entity.Property(e => e.NguoiXuLyText).HasMaxLength(200);
            entity.Property(e => e.NguoiKyDuyetText).HasMaxLength(200);
            entity.Property(e => e.KetQua).HasMaxLength(20);
            entity.Property(e => e.LyDoKhongDuyet).HasMaxLength(1000);
            entity.Property(e => e.TaiLieuDinhKem);

            entity.HasOne(e => e.WorkflowInstance)
                .WithMany(wi => wi.WorkflowStepInstances)
                .HasForeignKey(e => e.WorkflowInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.BuocWorkflow)
                .WithMany(b => b.WorkflowStepInstances)
                .HasForeignKey(e => e.BuocWorkflowId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.NguoiXuLy)
                .WithMany()
                .HasForeignKey(e => e.NguoiXuLyId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.NguoiKyDuyet)
                .WithMany()
                .HasForeignKey(e => e.NguoiKyDuyetId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WorkflowAssignment
        modelBuilder.Entity<WorkflowAssignment>(entity =>
        {
            entity.ToTable("WorkflowAssignment");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DaXuLy).HasDefaultValue(false);
            entity.Property(e => e.NgayGiao).HasColumnType("datetime2").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayXuLy).HasColumnType("datetime2");
            entity.Property(e => e.GhiChu).HasMaxLength(1000);
            entity.Property(e => e.PhieuKyDuyet).HasMaxLength(500);
            entity.HasOne(e => e.WorkflowStepInstance)
                .WithMany(wsi => wsi.WorkflowAssignments)
                .HasForeignKey(e => e.WorkflowStepInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.NguoiDuocGiao)
                .WithMany()
                .HasForeignKey(e => e.NguoiDuocGiaoId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.WorkflowStepInstanceId, e.NguoiDuocGiaoId }).IsUnique();
        });

        // WorkflowActionHistory
        modelBuilder.Entity<WorkflowActionHistory>(entity =>
        {
            entity.ToTable("WorkflowActionHistory");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.HanhDong).HasMaxLength(50).IsRequired();
            entity.Property(e => e.GhiChu).HasMaxLength(1000);
            entity.Property(e => e.ThoiGian).HasColumnType("datetime2").HasDefaultValueSql("GETDATE()");
            entity.HasOne(e => e.WorkflowInstance)
                .WithMany(wi => wi.WorkflowActionHistories)
                .HasForeignKey(e => e.WorkflowInstanceId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.WorkflowStepInstance)
                .WithMany()
                .HasForeignKey(e => e.WorkflowStepInstanceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WorkflowVersionHistory
        modelBuilder.Entity<WorkflowVersionHistory>(entity =>
        {
            entity.ToTable("WorkflowVersionHistory");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SnapshotData).IsRequired();
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.HasIndex(e => new { e.WorkflowId, e.VersionNumber }).IsUnique();
            entity.HasOne(e => e.Workflow)
                .WithMany()
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.NguoiTao)
                .WithMany()
                .HasForeignKey(e => e.NguoiTaoId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<GoiThau>(entity =>
        {
            entity.ToTable("GoiThau");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.MaGoiThau).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenGoiThau).HasMaxLength(500).IsRequired();
            entity.Property(e => e.MoTa).HasMaxLength(1000);
            entity.Property(e => e.NganSach).HasColumnType("decimal(18,0)");
            entity.Property(e => e.TrangThai).HasMaxLength(50).IsRequired().HasDefaultValue("DU_THAO");
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayCapNhat).HasColumnType("datetime2(3)");
            entity.Property(e => e.NguonVon).HasMaxLength(200);
            entity.Property(e => e.LoaiGoiThau).HasMaxLength(100);
            entity.Property(e => e.TheoDoi);
            entity.HasOne(e => e.HinhThuc)
                  .WithMany()
                  .HasForeignKey(e => e.HinhThucId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.KhoaPhong)
                  .WithMany()
                  .HasForeignKey(e => e.KhoaPhongId)
                  .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => e.IdCongKhai).IsUnique();
            entity.HasIndex(e => e.MaGoiThau).IsUnique();
            entity.HasIndex(e => e.KhoaPhongId);
        });

        // LichSuTrangThaiGoiThau
        modelBuilder.Entity<LichSuTrangThaiGoiThau>(entity =>
        {
            entity.ToTable("LichSuTrangThaiGoiThau");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TrangThaiCu).HasMaxLength(50);
            entity.Property(e => e.TrangThaiMoi).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ThoiGianThayDoi).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.HasOne<GoiThau>()
                .WithMany()
                .HasForeignKey(e => e.GoiThauId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<NguoiDung>()
                .WithMany()
                .HasForeignKey(e => e.NguoiThayDoiId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => new { e.GoiThauId, e.ThoiGianThayDoi });
        });

        // TaiLieuHoSo
        modelBuilder.Entity<TaiLieuHoSo>(entity =>
        {
            entity.ToTable("TaiLieuHoSo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TenFile).HasMaxLength(500).IsRequired();
            entity.Property(e => e.DuongDanFtp).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.LoaiTaiLieu).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(200).IsRequired();
            entity.Property(e => e.KichThuoc).IsRequired();
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.HasOne<GoiThau>()
                .WithMany()
                .HasForeignKey(e => e.GoiThauId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<HoSoDuThau>()
                .WithMany(h => h.TaiLieus)
                .HasForeignKey(e => e.HoSoDuThauId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne<HopDong>()
                .WithMany(h => h.TaiLieus)
                .HasForeignKey(e => e.HopDongId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // HoSoDuThau
        modelBuilder.Entity<HoSoDuThau>(entity =>
        {
            entity.ToTable("HoSoDuThau");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.GiaDuThau).HasColumnType("decimal(18,0)").IsRequired();
            entity.Property(e => e.GiaTrungThau).HasColumnType("decimal(18,0)");
            entity.Property(e => e.TrangThai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.GhiChu).HasMaxLength(1000);
            entity.Property(e => e.NgayNop).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayCapNhat).HasColumnType("datetime2(3)");
            entity.Property(e => e.DiemDanhGia).HasColumnType("decimal(5,2)");
            entity.Property(e => e.NhanXet).HasMaxLength(1000);
            entity.HasIndex(e => new { e.GoiThauId, e.NhaThauId }).IsUnique();
            entity.HasOne(e => e.GoiThau)
                .WithMany()
                .HasForeignKey(e => e.GoiThauId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.NhaThau)
                .WithMany()
                .HasForeignKey(e => e.NhaThauId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // HopDong
        modelBuilder.Entity<HopDong>(entity =>
        {
            entity.ToTable("HopDong");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SoHopDong).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TongGiaTri).HasColumnType("decimal(18,0)").IsRequired();
            entity.Property(e => e.NgayKy).HasColumnType("datetime2(3)").IsRequired();
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayCapNhat).HasColumnType("datetime2(3)");
            entity.HasIndex(e => e.GoiThauId).IsUnique();
            entity.HasIndex(e => e.SoHopDong).IsUnique();
            entity.HasOne(e => e.GoiThau)
                .WithMany()
                .HasForeignKey(e => e.GoiThauId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // NhomVaiTro
        modelBuilder.Entity<NhomVaiTro>(entity =>
        {
            entity.ToTable("NhomVaiTro");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaNhom).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenNhom).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DoUuTien).HasDefaultValue(0);
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.HasIndex(e => e.MaNhom).IsUnique();
        });

        // HoSoNangLuc
        modelBuilder.Entity<HoSoNangLuc>(entity =>
        {
            entity.ToTable("HoSoNangLuc");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LoaiTaiLieu)
                .HasColumnType("varchar(100)")
                .IsRequired();
            entity.Property(e => e.TenFile)
                .HasMaxLength(255)
                .IsRequired();
            entity.Property(e => e.DuongDanFile)
                .HasColumnType("varchar(1000)")
                .IsRequired();
            entity.Property(e => e.NgayHetHan).HasColumnType("date");
            entity.HasOne(e => e.NhaThau)
                .WithMany()
                .HasForeignKey(e => e.NhaThauId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // NhomNhanhWorkflow (Parallel branch groups)
        modelBuilder.Entity<NhomNhanhWorkflow>(entity =>
        {
            entity.ToTable("NhomNhanhWorkflow");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TenNhom).HasMaxLength(255).IsRequired();
            entity.Property(e => e.DieuKienHopNhat).HasMaxLength(20).HasDefaultValue("ALL");
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayCapNhat).HasColumnType("datetime2(3)");
            entity.HasOne(e => e.Workflow)
                .WithMany(w => w.NhomNhanhWorkflows)
                .HasForeignKey(e => e.WorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.BuocTachNhanh)
                .WithMany()
                .HasForeignKey(e => e.BuocTachNhanhId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.BuocSauHopNhat)
                .WithMany()
                .HasForeignKey(e => e.BuocSauHopNhatId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.WorkflowId, e.BuocTachNhanhId });
        });

        // NhanhWorkflow (Individual branches)
        modelBuilder.Entity<NhanhWorkflow>(entity =>
        {
            entity.ToTable("NhanhWorkflow");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MaNhanh).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TenNhanh).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ThoiHanNgay).HasColumnType("decimal(5,2)").HasDefaultValue(0m);
            entity.Property(e => e.LoaiHan).HasMaxLength(20).HasDefaultValue("CANH_BAO");
            entity.HasOne(e => e.NhomNhanhWorkflow)
                .WithMany(g => g.Nhanhs)
                .HasForeignKey(e => e.NhomNhanhWorkflowId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.DonViXuLy)
                .WithMany()
                .HasForeignKey(e => e.DonViXuLyId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.VaiTroXuLy)
                .WithMany()
                .HasForeignKey(e => e.VaiTroXuLyId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.BuocDauTien)
                .WithMany()
                .HasForeignKey(e => e.BuocDauTienId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.NhomNhanhWorkflowId, e.MaNhanh }).IsUnique();
            entity.HasIndex(e => new { e.NhomNhanhWorkflowId, e.ThuTu });
        });

        // ThongBao
        modelBuilder.Entity<ThongBao>(entity =>
        {
            entity.ToTable("ThongBao");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.LoaiThongBao).HasMaxLength(50);
            entity.Property(e => e.TieuDe).HasMaxLength(255).IsRequired();
            entity.Property(e => e.NoiDung).HasMaxLength(1000).IsRequired(false);
            entity.Property(e => e.DaDoc).HasDefaultValue(false);
            entity.Property(e => e.UrlDieuHuong).HasMaxLength(500);
            entity.Property(e => e.NotificationKey).HasMaxLength(200);
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayDoc).HasColumnType("datetime2(3)");
            entity.HasIndex(e => e.IdCongKhai).IsUnique();
            entity.HasIndex(e => new { e.NguoiDungId, e.DaDoc });
            entity.HasIndex(e => new { e.NguoiDungId, e.NotificationKey })
                .IsUnique()
                .HasFilter("[NotificationKey] IS NOT NULL");
            entity.HasOne(e => e.NguoiDung)
                .WithMany()
                .HasForeignKey(e => e.NguoiDungId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.GoiThau)
                .WithMany()
                .HasForeignKey(e => e.GoiThauId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.WorkflowStepInstance)
                .WithMany()
                .HasForeignKey(e => e.WorkflowStepInstanceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<YeuCauThayDoiThongTinNguoiDung>(entity =>
        {
            entity.ToTable("YeuCauThayDoiThongTinNguoiDung");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.TrangThai).HasMaxLength(20).IsRequired();
            entity.Property(e => e.GiaTriCuJson).IsRequired();
            entity.Property(e => e.GiaTriMoiJson).IsRequired();
            entity.Property(e => e.LyDoTuChoi).HasMaxLength(1000);
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.NgayXuLy).HasColumnType("datetime2(3)");
            entity.HasIndex(e => e.IdCongKhai)
                .IsUnique()
                .HasDatabaseName("IX_YeuCauThayDoiThongTinNguoiDung_IdCongKhai");
            entity.HasIndex(e => new { e.TrangThai, e.NgayTao });
            entity.HasOne(e => e.NguoiDung)
                .WithMany()
                .HasForeignKey(e => e.NguoiDungId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.NguoiXuLy)
                .WithMany()
                .HasForeignKey(e => e.NguoiXuLyId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // UserSession
        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.ToTable("UserSession");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Jti).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DiaChiIP).HasMaxLength(50);
            entity.Property(e => e.UserAgent).HasMaxLength(500);
            entity.Property(e => e.RefreshTokenHash).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.LastActivityAt).HasColumnType("datetime2(3)");
            entity.Property(e => e.RevokedAt).HasColumnType("datetime2(3)");
            entity.HasOne(e => e.NguoiDung)
                .WithMany()
                .HasForeignKey(e => e.NguoiDungId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.NguoiDungId, e.RevokedAt });
            entity.HasIndex(e => e.Jti).IsUnique();
        });
    }
}
