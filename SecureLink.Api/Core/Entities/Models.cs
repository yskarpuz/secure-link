namespace SecureLink.Api.Core.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? IpAddress { get; set; }
}

public enum FileSystemItemType
{
    Folder,
    File,
    //Secret
}

public interface IFileSystemItem
{
    Guid Id { get; set; }
    string Name { get; set; }
    FileSystemItemType FileSystemItemType { get; }
    Guid? ParentId { get; set; }
    string OwnerId { get; set; }
    DateTime CreatedAt { get; set; }
    DateTime? ExpiresAt { get; set; }
    bool IsArchived { get; set; }
    string? PinHash { get; set; }
     bool AllowAnonymousView { get; set; }
    bool AllowAnonymousDownload { get; set; }
    
    // Computed property - implementation varies by type
    long GetSize();
}
public class FileEntity : IFileSystemItem
{
    // IFileSystemItem properties
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public FileSystemItemType FileSystemItemType => FileSystemItemType.File;
    public Guid? ParentId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsArchived { get; set; }
    public string? PinHash { get; set; }
    public bool AllowAnonymousView { get; set; } = false;
    public bool AllowAnonymousDownload { get; set; } = false;
    
    // File-specific properties
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string StorageProviderId { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public bool BurnAfterDownload { get; set; }
    public bool IsAccessed { get; set; }
    
    // Computed property
    public long GetSize() => Size;
}

public class FolderEntity : IFileSystemItem
{
    // IFileSystemItem properties
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public FileSystemItemType FileSystemItemType => FileSystemItemType.Folder;
    public Guid? ParentId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool IsArchived { get; set; }
    public string? PinHash { get; set; }
    
    // Folder-specific properties
    public bool AllowAnonymousView { get; set; } = false;
    public bool AllowAnonymousUpload { get; set; } = false;
    public bool AllowAnonymousDownload { get; set; } = false;
    public string? ShareToken { get; set; }
    
    // Computed property - size is calculated from children
    public long GetSize() => 0; // Will be calculated by service
}

public class TextSnippet
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public bool BurnAfterRead { get; set; }
}
