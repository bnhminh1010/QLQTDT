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
    public DbSet<NhatKyKiemToan> NhatKyKiemToans { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // NguoiDung
        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.ToTable("NguoiDung");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IdCongKhai).HasDefaultValueSql("NEWSEQUENTIALID()");
            entity.Property(e => e.TenDangNhap).HasMaxLength(100).IsRequired();
            entity.Property(e => e.MatKhauHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.HoTen).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            entity.Property(e => e.NgayTao).HasColumnType("datetime2(3)").HasDefaultValueSql("GETDATE()");
            entity.HasIndex(e => e.IdCongKhai).IsUnique();
            entity.HasIndex(e => e.TenDangNhap).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.GoogleId).HasMaxLength(100);
            entity.HasIndex(e => e.GoogleId).IsUnique().HasFilter("[GoogleId] IS NOT NULL");
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
            entity.Property(e => e.TenVaiTro).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DaXoa).HasDefaultValue(false);
            entity.HasIndex(e => e.TenVaiTro).IsUnique();
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
            entity.Property(e => e.TrangThaiHoatDong).HasDefaultValue(true);
            entity.HasIndex(e => e.MaSoThue).IsUnique();
            entity.HasOne(e => e.NguoiDung).WithMany().HasForeignKey(e => e.NguoiDungId);
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

        // LoginLockout — Persistent brute-force tracking
        modelBuilder.Entity<LoginLockout>(entity =>
        {
            entity.ToTable("LoginLockout");
            entity.HasKey(e => e.Identifier);
            entity.Property(e => e.Identifier).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FailedAttempts).IsRequired();
            entity.Property(e => e.LockoutEnd).HasColumnType("datetime2(3)");
            entity.Property(e => e.LastFailedAttempt).HasColumnType("datetime2(3)").IsRequired();
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
    }
}
