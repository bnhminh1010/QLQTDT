namespace QLQTDT.Api.Services;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetToken);
}
