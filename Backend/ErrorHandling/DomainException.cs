namespace Backend.ErrorHandling;


public class DomainException(string info, int code) : Exception
{
    public string Info { get; } = info;
    public int Code { get; } = code;
}