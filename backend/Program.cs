using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLQTDT.Api.Config;
using QLQTDT.Api.Data;
using QLQTDT.Api.Middlewares;
using QLQTDT.Api.Services;
using System.Text;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Load .env
var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (File.Exists(envPath))
{
    foreach (var line in File.ReadAllLines(envPath))
    {
        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
        }
    }
}

// Database
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");

if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer($"Server={dbServer};User Id={dbUser};Password={dbPassword};Database={dbName};TrustServerCertificate=True;"));
}

// JWT
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "DefaultSecretKeyForDevOnly123!@#";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "QLQTDT";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "QLQTDT.Frontend";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["AccessToken"];
                return Task.CompletedTask;
            }
        };
    });

builder.Services.Configure<JwtConfig>(options =>
{
    options.Secret = jwtSecret;
    options.Issuer = jwtIssuer;
    options.Audience = jwtAudience;
    options.ExpiryMinutes = 60;
    options.CookieName = "AccessToken";
});

// FTP
builder.Services.Configure<FtpConfig>(options =>
{
    options.Server = Environment.GetEnvironmentVariable("FTP_SERVER") ?? "";
    options.Port = int.TryParse(Environment.GetEnvironmentVariable("FTP_PORT"), out var p) ? p : 21;
    options.User = Environment.GetEnvironmentVariable("FTP_USER") ?? "";
    options.Password = Environment.GetEnvironmentVariable("FTP_PASSWORD") ?? "";
    options.UsePassive = true;
});

// Google Auth
builder.Services.Configure<GoogleAuthConfig>(options =>
{
    options.ClientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID") ?? "";
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// MemoryCache (cho LoginAttemptGuard và rate limiting)
builder.Services.AddMemoryCache();

// DI — Auth Services
builder.Services.AddScoped<LoginAttemptGuard>();
builder.Services.AddHostedService<LockoutCleanupService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// FluentValidation — đăng ký tất cả validators từ assembly
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Controllers với JSON camelCase
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "QLQTDT API", Version = "v1" });
});

var app = builder.Build();

// Exception Handling Middleware — phải đặt đầu tiên
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed dữ liệu mặc định (vai trò + tài khoản admin gốc)
if (!app.Environment.IsEnvironment("Testing"))
{
    await QLQTDT.Api.Data.DbInitializer.SeedAsync(app.Services);
}

app.Run();

// Cần public partial class cho integration test WebApplicationFactory
public partial class Program { }
