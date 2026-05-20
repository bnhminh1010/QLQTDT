using Microsoft.EntityFrameworkCore;

namespace QLQTDT.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Entities will be added here after scaffolding from database
    // public DbSet<KhoaPhong> KhoaPhongs { get; set; }
    // public DbSet<NguoiDung> NguoiDungs { get; set; }
    // public DbSet<GioThau> GioThaus { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
