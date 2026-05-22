namespace Media8.Domain.Common;

/// <summary>
/// Exception thrown when a business rule validation fails.
/// This exception is mapped to HTTP 422 (Unprocessable Entity) by the API middleware.
/// </summary>
public class BusinessRuleException : Exception
{
    /// <summary>
    /// Gets the error code for programmatic handling.
    /// </summary>
    public string ErrorCode { get; }

    public BusinessRuleException() : base("A business rule was violated.")
    {
        ErrorCode = "BUSINESS_RULE_VIOLATION";
    }

    public BusinessRuleException(string message) : base(message)
    {
        ErrorCode = "BUSINESS_RULE_VIOLATION";
    }

    public BusinessRuleException(string message, string errorCode) : base(message)
    {
        ErrorCode = errorCode;
    }

    public BusinessRuleException(string message, Exception innerException) 
        : base(message, innerException)
    {
        ErrorCode = "BUSINESS_RULE_VIOLATION";
    }
}
