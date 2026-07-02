using Microsoft.EntityFrameworkCore;
using QLQTDT.Api.Data;

namespace QLQTDT.Api.Services;

public class AuthStateInvalidator : IAuthStateInvalidator
{
    private readonly AppDbContext _context;

    public AuthStateInvalidator(AppDbContext context)
    {
        _context = context;
    }

    public async Task RevokeUserAuthStateAsync(int userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var activeTokens = await _context.RefreshTokens
            .Where(rt => rt.NguoiDungId == userId && rt.RevokedAt == null && rt.ExpiresAt > now)
            .ToListAsync(ct);
        foreach (var token in activeTokens)
            token.RevokedAt = now;

        var activeSessions = await _context.UserSessions
            .Where(s => s.NguoiDungId == userId && s.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var session in activeSessions)
            session.RevokedAt = now;

        await _context.SaveChangesAsync(ct);
    }
}
