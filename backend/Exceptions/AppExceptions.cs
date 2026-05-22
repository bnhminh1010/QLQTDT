namespace QLQTDT.Api.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; }
    public string ErrorType { get; }

    public AppException(int statusCode, string errorType, string message) : base(message)
    {
        StatusCode = statusCode;
        ErrorType = errorType;
    }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(409, "Conflict", message) { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message) : base(401, "Unauthorized", message) { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message) : base(403, "Forbidden", message) { }
}

public class TooManyRequestsException : AppException
{
    public TooManyRequestsException(string message) : base(429, "Too Many Requests", message) { }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message) : base(400, "Bad Request", message) { }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(404, "Not Found", message) { }
}
