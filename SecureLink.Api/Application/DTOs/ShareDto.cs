using System.ComponentModel.DataAnnotations;

namespace SecureLink.Api.Application.DTOs;

public class ShareLinkDto
{
    public Guid Id { get; set; }
    public Guid ResourceId { get; set; }
    public string ResourceType { get; set; } = string.Empty; // "File" or "Folder"
    public string ShareToken { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public SharePermissions Permissions { get; set; }
}

public class CreateShareLinkRequest
{
    [Required]
    public Guid ResourceId { get; set; }
    
    [Required]
    [StringLength(50, ErrorMessage = "Resource type must not exceed 50 characters")]
    public string ResourceType { get; set; } = string.Empty;
    
    [Range(1, 365, ErrorMessage = "Expiry days must be between 1 and 365")]
    public int? ExpiryDays { get; set; }
    
    public SharePermissions Permissions { get; set; } = SharePermissions.View;
}

[Flags]
public enum SharePermissions
{
    None = 0,
    View = 1,
    Download = 2,
    Upload = 4,
    Delete = 8,
    FullAccess = View | Download | Upload | Delete
}

