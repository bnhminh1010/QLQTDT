using System.Text.Json;
using Microsoft.AspNetCore.Http;
using QLQTDT.Api.Config;
using QLQTDT.Api.Models.DTOs.Auth;
using QLQTDT.Api.Security;

namespace QLQTDT.Api.Tests.Security;

public class AuthSecurityContractTests
{
    [Fact]
    public void LoginResponse_DoesNotSerializeAccessOrRefreshToken()
    {
        var dto = new LoginResponseDto
        {
            Message = "ok",
            Token = "access-token",
            RefreshToken = "refresh-token",
            CsrfToken = "csrf-token",
            User = CreateUser()
        };

        using var json = JsonDocument.Parse(JsonSerializer.Serialize(dto, JsonOptions()));

        Assert.False(json.RootElement.TryGetProperty("token", out _));
        Assert.False(json.RootElement.TryGetProperty("refreshToken", out _));
        Assert.True(json.RootElement.TryGetProperty("csrfToken", out _));
    }

    [Fact]
    public void RefreshResponse_DoesNotSerializeAccessOrRefreshToken()
    {
        var dto = new RefreshTokenResponseDto
        {
            Message = "ok",
            Token = "access-token",
            RefreshToken = "refresh-token",
            CsrfToken = "csrf-token",
            User = CreateUser()
        };

        using var json = JsonDocument.Parse(JsonSerializer.Serialize(dto, JsonOptions()));

        Assert.False(json.RootElement.TryGetProperty("token", out _));
        Assert.False(json.RootElement.TryGetProperty("refreshToken", out _));
        Assert.True(json.RootElement.TryGetProperty("csrfToken", out _));
    }

    [Theory]
    [InlineData("Production", false, false)]
    [InlineData("Production", true, true)]
    [InlineData("Development", false, true)]
    [InlineData("Testing", false, true)]
    public void BearerHeader_IsRejectedInProductionUnlessExplicitlyAllowed(
        string environmentName,
        bool allowBearerInProduction,
        bool expected)
    {
        var actual = AuthTokenTransport.AllowBearerHeader(environmentName, allowBearerInProduction);

        Assert.Equal(expected, actual);
    }

    [Fact]
    public void RefreshCookieOptions_AreHttpOnlySecureAndScopedToAuthEndpoints()
    {
        var options = AuthCookieOptionsFactory.CreateRefreshCookieOptions(
            new JwtConfig { RefreshTokenExpiryDays = 7 },
            isDevelopment: false);

        Assert.True(options.HttpOnly);
        Assert.True(options.Secure);
        Assert.Equal(SameSiteMode.None, options.SameSite);
        Assert.Equal("/api/auth", options.Path);
        Assert.Equal(TimeSpan.FromDays(7), options.MaxAge);
    }

    private static UserDto CreateUser() => new()
    {
        IdCongKhai = Guid.NewGuid(),
        TenDangNhap = "user",
        HoTen = "User",
        Email = "user@example.test",
        TrangThaiHoatDong = true,
        NgayTao = DateTime.UtcNow
    };

    private static JsonSerializerOptions JsonOptions() => new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}
