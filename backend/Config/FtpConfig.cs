namespace QLQTDT.Api.Config;

public class FtpConfig
{
    public string Server { get; set; } = string.Empty;
    public int Port { get; set; } = 21;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool UsePassive { get; set; } = true;
}
