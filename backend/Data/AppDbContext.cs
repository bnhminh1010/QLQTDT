using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Models;

namespace QLQTDT.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<NhatKyKiemToan> NhatKyKiemToans { get; set; }

    // Entities will be added here after scaffolding from database
    // public DbSet<KhoaPhong> KhoaPhongs { get; set; }
    // public DbSet<NguoiDung> NguoiDungs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
