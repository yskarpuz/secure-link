using SecureLink.Api.Core.Entities;
using SecureLink.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace SecureLink.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShareController : ControllerBase
{
    private readonly FileShareDbContext _context;
    private readonly ILogger<ShareController> _logger;

    public ShareController(FileShareDbContext context, ILogger<ShareController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Generate a share link for a folder
    /// </summary>
    [HttpPost("folder/{folderId}")]
    [Authorize]
    public async Task<ActionResult<object>> CreateFolderShareLink(
        Guid folderId,
        [FromBody] ShareLinkRequest request)
    {
        try
        {
            var userId = User.Identity?.Name ?? "system";
            var folder = await _context.Folders.FindAsync(folderId);

            if (folder == null) 
            {
                _logger.LogWarning("Share link creation failed: Folder {FolderId} not found", folderId);
                return NotFound("Folder not found");
            }
            
            if (folder.OwnerId != userId && userId != "system") 
            {
                _logger.LogWarning("Share link creation failed: User {UserId} attempted to share folder {FolderId} owned by {OwnerId}", 
                    userId, folderId, folder.OwnerId);
                return Forbid("You don't have permission to share this folder");
            }

        // Generate unique share token
        folder.ShareToken = Guid.NewGuid().ToString("N");
        folder.AllowAnonymousView = request.AllowView;
        folder.AllowAnonymousUpload = request.AllowUpload;
        folder.AllowAnonymousDownload = request.AllowDownload;
        
        if (request.ExpiresAt.HasValue)
            folder.ExpiresAt = request.ExpiresAt;

            await _context.SaveChangesAsync();

            var shareUrl = $"{Request.Scheme}://{Request.Host}/share/{folder.ShareToken}";
            
            _logger.LogInformation("Share link created for folder {FolderId} by user {UserId}", folderId, userId);
            
            return Ok(new 
            { 
                shareUrl, 
                token = folder.ShareToken,
                permissions = new
                {
                    canView = folder.AllowAnonymousView,
                    canUpload = folder.AllowAnonymousUpload,
                    canDownload = folder.AllowAnonymousDownload,
                    expiresAt = folder.ExpiresAt
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating share link for folder {FolderId}", folderId);
            return StatusCode(500, new { error = "An error occurred while creating the share link", details = ex.Message });
        }
    }

    /// <summary>
    /// Access a shared folder by token
    /// </summary>
    [HttpGet("folder/{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<object>> GetSharedFolder(string? token = null)
    {
        if (string.IsNullOrEmpty(token))
            return BadRequest("Share token is required");

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.ShareToken == token);

        if (folder == null) 
            return NotFound("Invalid or expired share link");

        if (!folder.AllowAnonymousView)
            return Forbid("This folder does not allow anonymous viewing");

        // Fetch both files AND child folders
        var files = await _context.Files
            .Where(f => f.ParentId == folder.Id && (!f.ExpiresAt.HasValue || f.ExpiresAt > DateTime.UtcNow))
            .Select(f => new
            {
                f.Id,
                f.Name,
                f.Size,
                f.CreatedAt,
                f.ContentType,
                f.BurnAfterDownload,
                FileSystemItemType = 1, // File
                ExpiresAt = f.ExpiresAt.HasValue ? f.ExpiresAt.Value.ToString("yyyy-MM-dd HH:mm:ss") : null,
                CanDownload = folder.AllowAnonymousDownload
            })
            .ToListAsync();

        var childFolders = await _context.Folders
            .Where(f => f.ParentId == folder.Id && !f.IsArchived)
            .Select(f => new
            {
                f.Id,
                f.Name,
                f.CreatedAt,
                FileSystemItemType = 0, // Folder
                f.AllowAnonymousView,
                f.AllowAnonymousUpload,
                f.AllowAnonymousDownload
            })
            .ToListAsync();

        return Ok(new
        {
            folder = new 
            { 
                folder.Id, 
                folder.Name,
                folder.CreatedAt
            },
            files,
            folders = childFolders,
            permissions = new
            {
                canView = folder.AllowAnonymousView,
                canUpload = folder.AllowAnonymousUpload,
                canDownload = folder.AllowAnonymousDownload
            },
            shareToken = token
        });
    }

    /// <summary>
    /// Revoke a folder share link
    /// </summary>
    [HttpDelete("folder/{folderId}")]
    [Authorize]
    public async Task<IActionResult> RevokeShareLink(Guid folderId)
    {
        var userId = User.Identity?.Name ?? "system";
        var folder = await _context.Folders.FindAsync(folderId);

        if (folder == null) return NotFound();
        if (folder.OwnerId != userId) return Forbid();

        // Remove share token and reset permissions
        folder.ShareToken = null;
        folder.AllowAnonymousView = false;
        folder.AllowAnonymousUpload = false;
        folder.AllowAnonymousDownload = false;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Share link revoked successfully" });
    }

    /// <summary>
    /// Get sharing status of a folder
    /// </summary>
    [HttpGet("folder/{folderId}/status")]
    [Authorize]
    public async Task<ActionResult<object>> GetShareStatus(Guid folderId)
    {
        var userId = User.Identity?.Name ?? "system";
        var folder = await _context.Folders.FindAsync(folderId);

        if (folder == null) return NotFound();
        if (folder.OwnerId != userId) return Forbid();

        if (string.IsNullOrEmpty(folder.ShareToken))
        {
            return Ok(new { isShared = false });
        }

        var shareUrl = $"{Request.Scheme}://{Request.Host}/share/{folder.ShareToken}";
        
        return Ok(new
        {
            isShared = true,
            shareUrl,
            token = folder.ShareToken,
            permissions = new
            {
                canView = folder.AllowAnonymousView,
                canUpload = folder.AllowAnonymousUpload,
                canDownload = folder.AllowAnonymousDownload,
                expiresAt = folder.ExpiresAt
            }
        });
    }


}

public class ShareLinkRequest
{
    public bool AllowView { get; set; } = true;
    public bool AllowUpload { get; set; } = false;
    public bool AllowDownload { get; set; } = true;
    public DateTime? ExpiresAt { get; set; } = null;
}

