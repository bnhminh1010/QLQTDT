using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using QLQTDT.Api.Config;

namespace QLQTDT.Api.Services;

public class JwtService
{
    private readonly JwtConfig _config;

    public JwtService(IOptions<JwtConfig> config)
    {
        _config = config.Value;
    }


    public string GenerateToken(int userId, string email, string fullName, List<string> roles, IEnumerable<string>? permissions = null)

    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Name, fullName),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new("permissions", string.Join(",", permissions))
        };

        // Thêm từng role vào claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var permissionList = permissions?
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (permissionList is { Count: > 0 })
        {
            claims.Add(new Claim("permissions", string.Join(",", permissionList)));
        }

        var token = new JwtSecurityToken(
            issuer: _config.Issuer,
            audience: _config.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_config.ExpiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
