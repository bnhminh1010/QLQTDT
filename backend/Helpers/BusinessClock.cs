namespace QLQTDT.Api.Helpers;

public static class BusinessClock
{
    private static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();

    public static DateTime VietnamNow =>
        DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone), DateTimeKind.Unspecified);

    public static DateTime ToUtc(DateTime value) =>
        value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };

    public static DateTime? ToUtc(DateTime? value) =>
        value.HasValue ? ToUtc(value.Value) : null;

    public static DateTime ToUtcFromVietnam(DateTime value)
    {
        var vietnamLocal = DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
        var utc = TimeZoneInfo.ConvertTimeToUtc(vietnamLocal, VietnamTimeZone);
        return DateTime.SpecifyKind(utc, DateTimeKind.Utc);
    }

    public static DateTime? ToUtcFromVietnam(DateTime? value) =>
        value.HasValue ? ToUtcFromVietnam(value.Value) : null;

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
    }
}
