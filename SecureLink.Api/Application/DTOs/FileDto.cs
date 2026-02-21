using System.ComponentModel.DataAnnotations;

namespace SecureLink.Api.Application.DTOs;

public class FileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    public Guid? FolderId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool BurnAfterDownload { get; set; }
    public bool HasPin { get; set; }
    public string OwnerId { get; set; } = string.Empty;
}

public class UploadFileRequest
{
    [Required(ErrorMessage = "File is required")]
    public IFormFile File { get; set; } = null!;
    
    public Guid? FolderId { get; set; }
    
    [Range(1, 365, ErrorMessage = "Expiry days must be between 1 and 365")]
    public int? ExpiryDays { get; set; }
    
    public bool BurnAfterDownload { get; set; }
    
    [StringLength(20, MinimumLength = 4, ErrorMessage = "PIN must be between 4 and 20 characters")]
    public string? Pin { get; set; }
    
    public string? ShareToken { get; set; }
}

public class FileUploadResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Message { get; set; } = "File uploaded successfully";
}

