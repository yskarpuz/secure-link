namespace SecureLink.Api.Application.DTOs;

public class SnippetDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool BurnAfterRead { get; set; }
}

public class CreateSnippetRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? ExpiryDays { get; set; }
    public bool BurnAfterRead { get; set; }
}

