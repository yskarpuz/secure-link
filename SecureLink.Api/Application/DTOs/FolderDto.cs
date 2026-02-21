using System.ComponentModel.DataAnnotations;

namespace SecureLink.Api.Application.DTOs;

public class FolderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
    public string OwnerId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool HasPin { get; set; }
}

public class CreateFolderRequest
{
    [Required(ErrorMessage = "Folder name is required")]
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Folder name must be between 1 and 255 characters")]
    public string Name { get; set; } = string.Empty;
    
    public Guid? ParentFolderId { get; set; }
    
    [StringLength(20, MinimumLength = 4, ErrorMessage = "PIN must be between 4 and 20 characters")]
    public string? Pin { get; set; }
    
    public bool AllowAnonymousDownload { get;  set; }
    public bool AllowAnonymousUpload { get;  set; }
    public bool AllowAnonymousView { get;  set; }
    
    [DataType(DataType.DateTime)]
    public DateTime? ExpiresAt { get;  set; }
}

public class UpdateFolderRequest
{
    [StringLength(255, MinimumLength = 1, ErrorMessage = "Folder name must be between 1 and 255 characters")]
    public string? Name { get; set; }
    
    [StringLength(20, MinimumLength = 4, ErrorMessage = "PIN must be between 4 and 20 characters")]
    public string? Pin { get; set; }
    
    public bool? AllowAnonymousView { get; set; }
    public bool? AllowAnonymousUpload { get; set; }
    public bool? AllowAnonymousDownload { get; set; }
    
    [DataType(DataType.DateTime)]
    public DateTime? ExpiresAt { get; set; }
}

