using System.Text;
using QLQTDT.Api.Models.Entities;

namespace QLQTDT.Api.Tests.Models;

public class UserSessionTests
{
    [Fact]
    public void UserSession_NewSession_IsActive()
    {
        var session = new UserSession
        {
            NguoiDungId = 1,
            Jti = Guid.NewGuid().ToString()
        };
        Assert.True(session.IsActive);
    }

    [Fact]
    public void UserSession_Revoked_IsNotActive()
    {
        var session = new UserSession
        {
            NguoiDungId = 1,
            Jti = Guid.NewGuid().ToString(),
            RevokedAt = DateTime.UtcNow
        };
        Assert.False(session.IsActive);
    }

    [Fact]
    public void RefreshToken_NewToken_IsActive()
    {
        var token = new RefreshToken
        {
            Token = "hash123",
            NguoiDungId = 1,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        Assert.True(token.IsActive);
        Assert.False(token.IsExpired);
    }

    [Fact]
    public void RefreshToken_Revoked_IsNotActive()
    {
        var token = new RefreshToken
        {
            Token = "hash123",
            NguoiDungId = 1,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            RevokedAt = DateTime.UtcNow
        };
        Assert.False(token.IsActive);
    }

    [Fact]
    public void RefreshToken_Expired_IsExpired()
    {
        var token = new RefreshToken
        {
            Token = "hash123",
            NguoiDungId = 1,
            ExpiresAt = DateTime.UtcNow.AddDays(-1)
        };
        Assert.True(token.IsExpired);
        Assert.False(token.IsActive);
    }
}
