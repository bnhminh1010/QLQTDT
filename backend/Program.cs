using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLQTDT.Api.Config;
using QLQTDT.Api.Data;
using QLQTDT.Api.Middleware;
using System.Text;

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
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    var interceptor = sp.GetRequiredService<AuditInterceptor>();
    options.UseSqlServer($"Server={dbServer};User Id={dbUser};Password={dbPassword};Database={dbName};TrustServerCertificate=True;")
           .AddInterceptors(interceptor);
});

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

// HTTP context accessor (needed by AuditInterceptor)
builder.Services.AddHttpContextAccessor();

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "QLQTDT API", Version = "v1" });
});

var app = builder.Build();

// Exception middleware
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
