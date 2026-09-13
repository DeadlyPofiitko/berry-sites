
namespace Backend.Data;

public class Admin
{
    public Guid Id {get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public string? ProviderId { get; set; }
    public string? Picture { get; set; }
}