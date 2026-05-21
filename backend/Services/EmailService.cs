using MailKit.Net.Smtp;
using MimeKit;

namespace QLQTDT.Api.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken)
    {
        var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
        var smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT"), out var p) ? p : 587;
        var smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? "";
        var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? "";
        var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:5173";

        var resetLink = $"{frontendUrl}/reset-password?token={resetToken}";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Hệ thống QLQTDT", smtpUser));
        message.To.Add(new MailboxAddress(fullName, toEmail));
        message.Subject = "Yêu cầu đặt lại mật khẩu - Hệ thống QLQTDT";

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = $"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1890ff;">Đặt lại mật khẩu</h2>
                    <p>Xin chào <strong>{fullName}</strong>,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
                    <a href="{resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1890ff; color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">
                        Đặt lại mật khẩu
                    </a>
                    <p style="color: #888; font-size: 13px;">Liên kết này sẽ hết hạn sau 30 phút.</p>
                    <p style="color: #888; font-size: 13px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="color: #aaa; font-size: 12px;">Hệ thống Quản Lý Quy Trình Đấu Thầu (QLQTDT)</p>
                </div>
                """
        };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUser, smtpPass);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
            // Không throw lỗi để tránh rò rỉ thông tin email có tồn tại hay không
        }
    }
}
