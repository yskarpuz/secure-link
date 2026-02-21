namespace SecureLink.Api.Application.DTOs;

public class FileSystemItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FileSystemItemType { get; set; } // 0 = Folder, 1 = File
    public Guid? ParentId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsArchived { get; set; }
    
    // File-specific properties
    public long Size { get; set; }
    public string? ContentType { get; set; }
    public bool BurnAfterDownload { get; set; }
    
    // Folder-specific properties
    public bool AllowAnonymousView { get; set; }
    public bool AllowAnonymousUpload { get; set; }
    public bool AllowAnonymousDownload { get; set; }
    public string? ShareToken { get; set; }
}

