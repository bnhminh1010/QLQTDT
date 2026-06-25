using FluentValidation;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLQTDT.Api.Data;
using QLQTDT.Api.Middleware;
using QLQTDT.Api.Middlewares;
using QLQTDT.Api.Services;
using System.Text;
using System.Text.Json;
using QLQTDT.Api.Config;

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

// Database + Audit interceptor
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER");
var dbUser = Environment.GetEnvironmentVariable("DB_USER");
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");

builder.Services.AddSingleton<AuditInterceptor>();
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<AppDbContext>((sp, options) =>
    {
        var interceptor = sp.GetRequiredService<AuditInterceptor>();
        options.UseSqlServer($"Server={dbServer};User Id={dbUser};Password={dbPassword};Database={dbName};TrustServerCertificate=True;")
               .AddInterceptors(interceptor);
    });
}

// JWT — fail-fast nếu thiếu JWT_SECRET trong môi trường non-Development
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtSecret = "DevOnlySecret_" + Guid.NewGuid().ToString("N");
        Console.WriteLine("⚠️  WARNING: JWT_SECRET chưa được cấu hình. Đang dùng secret tạm cho Development.");
    }
    else
    {
        throw new InvalidOperationException(
            "FATAL: JWT_SECRET chưa được cấu hình. " +
            "Set biến môi trường JWT_SECRET trước khi chạy trong môi trường production/staging.");
    }
}
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
                // Ưu tiên đọc từ Header (giúp test Postman dễ dàng bằng Bearer token)
                if (context.Request.Headers.ContainsKey("Authorization"))
                {
                    return Task.CompletedTask; // Middleware tự parse header
                }

                // Fallback sang Cookie nếu không có Header
                if (context.Request.Cookies.TryGetValue("AccessToken", out var token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var dbContext = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var userIdString = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                                ?? context.Principal?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

                if (!int.TryParse(userIdString, out var userId))
                {
                    context.Fail("Token không chứa userId hợp lệ.");
                    return;
                }

                var isActive = await dbContext.NguoiDungs
                    .AsNoTracking()
                    .Where(u => u.Id == userId)
                    .Select(u => u.TrangThaiHoatDong)
                    .FirstOrDefaultAsync();

                if (!isActive)
                {
                    context.Fail("Tài khoản đã bị khóa hoặc không tồn tại.");
                }
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
var ftpServer = Environment.GetEnvironmentVariable("FTP_SERVER") ?? "";
var ftpUser = Environment.GetEnvironmentVariable("FTP_USER") ?? "";
var ftpPassword = Environment.GetEnvironmentVariable("FTP_PASSWORD") ?? "";
var ftpPort = int.TryParse(Environment.GetEnvironmentVariable("FTP_PORT"), out var parsedFtpPort) ? parsedFtpPort : 21;
var ftpBasePath = Environment.GetEnvironmentVariable("FTP_BASE_PATH") ?? "/qlqtdt/uploads";
var ftpEncryptionMode = Environment.GetEnvironmentVariable("FTP_ENCRYPTION_MODE") ?? "None";
var ftpUsePassive = bool.TryParse(Environment.GetEnvironmentVariable("FTP_USE_PASSIVE"), out var parsedUsePassive)
    ? parsedUsePassive
    : true;

if (!builder.Environment.IsEnvironment("Testing"))
{
    if (string.IsNullOrWhiteSpace(ftpServer)
        || string.IsNullOrWhiteSpace(ftpUser)
        || string.IsNullOrWhiteSpace(ftpPassword))
    {
        throw new InvalidOperationException(
            "FATAL: FTP_SERVER, FTP_USER va FTP_PASSWORD chua duoc cau hinh. " +
            "Set bien moi truong FTP_SERVER, FTP_PORT, FTP_USER, FTP_PASSWORD.");
    }

    if (ftpPort is < 1 or > 65535)
    {
        throw new InvalidOperationException("FATAL: FTP_PORT phai nam trong khoang 1-65535.");
    }

    if (!string.Equals(ftpEncryptionMode, "None", StringComparison.OrdinalIgnoreCase)
        && !string.Equals(ftpEncryptionMode, "Explicit", StringComparison.OrdinalIgnoreCase))
    {
        throw new InvalidOperationException("FATAL: FTP_ENCRYPTION_MODE chi ho tro None hoac Explicit.");
    }
}

builder.Services.Configure<FtpConfig>(options =>
{
    options.Server = ftpServer;
    options.Port = ftpPort;
    options.User = ftpUser;
    options.Password = ftpPassword;
    options.UsePassive = ftpUsePassive;
    options.BasePath = ftpBasePath;
    options.EncryptionMode = ftpEncryptionMode;
});

// CORS
var allowedOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS")?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// HTTP context accessor (needed by AuditInterceptor)
builder.Services.AddHttpContextAccessor();

// MemoryCache (cho LoginAttemptGuard và rate limiting)
builder.Services.AddMemoryCache();

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    // Global default: 100 request/phút/IP
    options.AddFixedWindowLimiter("Global", cfg =>
    {
        cfg.PermitLimit = 100;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        cfg.QueueLimit = 5;
    });
    // Login: 20 request/phút/IP
    options.AddFixedWindowLimiter("Login", cfg =>
    {
        cfg.PermitLimit = 20;
        cfg.Window = TimeSpan.FromMinutes(1);
        cfg.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// DataProtection keys — persist trong container volume để cookie/token không mất sau restart
builder.Services.AddDataProtection()
    .SetApplicationName("QLQTDT")
    .PersistKeysToFileSystem(new DirectoryInfo("/app/DataProtection-Keys"));

// DI — Auth Services
builder.Services.AddScoped<LoginAttemptGuard>();
builder.Services.AddHostedService<LockoutCleanupService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IVaiTroService, VaiTroService>();
builder.Services.AddScoped<IQuyenService, QuyenService>();
builder.Services.AddScoped<IUserService, UserService>();
// Các Service từ nhánh develop
builder.Services.AddScoped<INhaThauService, NhaThauService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IIntegrationService, IntegrationService>();
builder.Services.AddScoped<IWorkflowConfigService, WorkflowConfigService>();
builder.Services.AddScoped<IWorkflowEngineService, WorkflowEngineService>();
builder.Services.AddScoped<ITenderAccessService, TenderAccessService>();

builder.Services.AddScoped<IFtpService, FtpService>();
builder.Services.AddScoped<IHinhThucDauThauService, HinhThucDauThauService>();
builder.Services.AddScoped<IBuocWorkflowService, BuocWorkflowService>();
builder.Services.AddScoped<IGoiThauService, GoiThauService>();
builder.Services.AddScoped<ITaiLieuService, TaiLieuService>();
builder.Services.AddScoped<IDeXuatService, DeXuatService>();
builder.Services.AddScoped<IHoSoDuThauService, HoSoDuThauService>();
builder.Services.AddScoped<IHopDongService, HopDongService>();
builder.Services.AddScoped<IThongBaoService, ThongBaoService>();
builder.Services.AddScoped<IWorkflowTemplateService, WorkflowTemplateService>();
builder.Services.AddScoped<IParallelGroupService, ParallelGroupService>();
builder.Services.AddScoped<IBaoCaoService, BaoCaoService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
// FluentValidation — đăng ký tất cả validators từ assembly + bật auto validation

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Controllers với JSON camelCase + ValidationFilter tự động
builder.Services.AddControllers(options =>
    {
        options.Filters.Add<QLQTDT.Api.Helpers.ValidationFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "QLQTDT API", Version = "v1" });
});

var app = builder.Build();

// Exception Handling Middleware
app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("AllowFrontend");

// Security Headers
app.UseMiddleware<SecurityHeadersMiddleware>();

// Rate Limiting
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Ok(new
{
    message = "QLQTDT API is running",
    environment = app.Environment.EnvironmentName,
    health = "/health"
})).AllowAnonymous();
app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    environment = app.Environment.EnvironmentName,
    time = DateTimeOffset.UtcNow
})).AllowAnonymous();

// Seed dữ liệu mặc định (vai trò + tài khoản admin gốc)
if (!app.Environment.IsEnvironment("Testing"))
{
    await QLQTDT.Api.Data.DbInitializer.SeedAsync(app.Services);
}

app.Run();

// Cần public partial class cho integration test WebApplicationFactory
public partial class Program { }
