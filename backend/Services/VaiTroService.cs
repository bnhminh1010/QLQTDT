using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;
using QLQTDT.Api.Exceptions;
using QLQTDT.Api.Models.DTOs.Admin;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Services;

public class VaiTroService : IVaiTroService
{
    private readonly AppDbContext _context;
    private readonly ILogger<VaiTroService> _logger;

    public VaiTroService(AppDbContext context, ILogger<VaiTroService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task GanQuyenAsync(int vaiTroId, List<int> permissionIds)
    {
        var vaiTro = await _context.VaiTros
            .FirstOrDefaultAsync(v => v.Id == vaiTroId && !v.DaXoa)
            ?? throw new NotFoundException($"Không tìm thấy vai trò với ID: {vaiTroId}");

        if (permissionIds.Count == 0)
            throw new BadRequestException("permissionIds không được rỗng.");

        // Validate tất cả permissionIds phải tồn tại và chưa bị xóa
        if (permissionIds.Count > 0)
        {
            var distinctIds = permissionIds.Distinct().ToList();
            var existingIds = await _context.Quyens
                .Where(q => distinctIds.Contains(q.Id) && !q.DaXoa)
                .Select(q => q.Id)
                .ToListAsync();

            var invalidIds = distinctIds.Except(existingIds).ToList();
            if (invalidIds.Count > 0)
                throw new BadRequestException($"Quyền không tồn tại hoặc đã bị xóa: {string.Join(", ", invalidIds)}");
        }

        // Bulk replace trong 1 transaction: xóa hết cũ → insert mới
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var existing = await _context.VaiTroQuyens
                .Where(vq => vq.VaiTroId == vaiTroId)
                .ToListAsync();
            _context.VaiTroQuyens.RemoveRange(existing);

            foreach (var permId in permissionIds.Distinct())
            {
                _context.VaiTroQuyens.Add(new VaiTroQuyen
                {
                    VaiTroId = vaiTroId,
                    QuyenId = permId
                });
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Gán {Count} quyền cho vai trò '{TenVaiTro}' (ID: {VaiTroId})",
                permissionIds.Count, vaiTro.TenVaiTro, vaiTroId);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<QuyenDto>> GetQuyenAsync(int vaiTroId)
    {
        var vaiTroExists = await _context.VaiTros
            .AnyAsync(v => v.Id == vaiTroId && !v.DaXoa);

        if (!vaiTroExists)
            throw new NotFoundException($"Không tìm thấy vai trò với ID: {vaiTroId}");

        return await _context.VaiTroQuyens
            .Where(vq => vq.VaiTroId == vaiTroId)
            .Select(vq => new QuyenDto
            {
                Id = vq.Quyen.Id,
                MaQuyen = vq.Quyen.MaQuyen,
                TenQuyen = vq.Quyen.TenQuyen
            })
            .OrderBy(q => q.MaQuyen)
            .ToListAsync();
    }
}
