using SecureLink.Api.Core.Entities;
using SecureLink.Api.Core.Interfaces;
using SecureLink.Api.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureLink.Api.Application.Services;
using SecureLink.Api.Infrastructure.Data;
using SecureLink.Api.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace SecureLink.Api.Controllers;

/// <summary>
/// Unified controller for file system operations (files and folders)
/// Demonstrates the "everything is a file" approach
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FileSystemController : ControllerBase
{
    private readonly IFileSystemService _fileSystem;
    private readonly ILogger<FileSystemController> _logger;
    private readonly IStorageProvider _storageProvider;
    private readonly FileShareDbContext _context;
    private readonly IAuditLogService _auditLog;
    private readonly IConfiguration _configuration;

    public FileSystemController(
        IFileSystemService fileSystem,
        ILogger<FileSystemController> logger,
        IStorageProvider storageProvider,
        FileShareDbContext context,
        IAuditLogService auditLog,
        IConfiguration configuration)
    {
        _fileSystem = fileSystem;
        _logger = logger;
        _storageProvider = storageProvider;
        _context = context;
        _auditLog = auditLog;
        _configuration = configuration;
    }

    /// <summary>
    /// Get a filesystem item (file or folder) by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<IFileSystemItem>> GetItem(Guid id, [FromQuery] string? shareToken = null)
    {
        var userId = User.Identity?.Name;

        var item = await _fileSystem.GetItemAsync(id);
        if (item == null)
            return NotFound();

        // Check access
        if (!await _fileSystem.CanAccessAsync(id, userId, shareToken))
            return Forbid();

        return Ok(item);
    }

    /// <summary>
    /// Search files and folders by name
    /// </summary>
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<FileSystemItemDto>>> Search(
        [FromQuery] string query,
        [FromQuery] Guid? parentId = null)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return BadRequest("Search query must be at least 2 characters");

        var userId = User.Identity?.Name ?? "system";

        var files = await _context.Files
            .Where(f => f.OwnerId == userId &&
                        !f.IsArchived &&
                        EF.Functions.ILike(f.Name, $"%{query}%"))
            .Take(50)
            .Select(f => new FileSystemItemDto
            {
                Id = f.Id,
                Name = f.Name,
                FileSystemItemType = 1,
                ParentId = f.ParentId,
                OwnerId = f.OwnerId,
                CreatedAt = f.CreatedAt,
                ExpiresAt = f.ExpiresAt,
                IsArchived = f.IsArchived,
                Size = f.Size,
                ContentType = f.ContentType,
                BurnAfterDownload = f.BurnAfterDownload
            })
            .ToListAsync();

        var folders = await _context.Folders
            .Where(f => f.OwnerId == userId &&
                        !f.IsArchived &&
                        EF.Functions.ILike(f.Name, $"%{query}%"))
            .Take(50)
            .Select(f => new FileSystemItemDto
            {
                Id = f.Id,
                Name = f.Name,
                FileSystemItemType = 0,
                ParentId = f.ParentId,
                OwnerId = f.OwnerId,
                CreatedAt = f.CreatedAt,
                ExpiresAt = f.ExpiresAt,
                IsArchived = f.IsArchived,
                AllowAnonymousView = f.AllowAnonymousView,
                AllowAnonymousUpload = f.AllowAnonymousUpload,
                AllowAnonymousDownload = f.AllowAnonymousDownload,
                ShareToken = f.ShareToken,
                Size = 0
            })
            .ToListAsync();

        var results = folders.Concat(files).OrderBy(x => x.Name).ToList();
        return Ok(results);
    }

    /// <summary>
    /// Get all children of a parent (or root items if parentId is null)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FileSystemItemDto>>> GetChildren(
        [FromQuery] Guid? parentId = null,
        [FromQuery] string? shareToken = null,
        [FromQuery] bool includeAll = false)
    {
        
        if (includeAll)
        {
            var loggerFactory = HttpContext.RequestServices.GetRequiredService<ILoggerFactory>();
            var adminLogger = loggerFactory.CreateLogger<AdminAuthorizationFilter>();
            var adminFilter = new AdminAuthorizationFilter(_configuration, adminLogger);

            var authContext = new Microsoft.AspNetCore.Mvc.Filters.AuthorizationFilterContext(
                new ActionContext(HttpContext, RouteData, ControllerContext.ActionDescriptor),
                new List<Microsoft.AspNetCore.Mvc.Filters.IFilterMetadata>()
            );

            adminFilter.OnAuthorization(authContext);

            if (authContext.Result != null)
            {
                if (authContext.Result is ForbidResult)
                    return Forbid();
                if (authContext.Result is UnauthorizedResult)
                    return Unauthorized();
                return StatusCode(403);
            }

            var allItems = await _fileSystem.GetChildrenAsync(null, null);

            var allDtos = allItems.Select(item =>
            {
                var dto = new FileSystemItemDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    FileSystemItemType = (int)item.FileSystemItemType,
                    ParentId = item.ParentId,
                    OwnerId = item.OwnerId,
                    CreatedAt = item.CreatedAt,
                    ExpiresAt = item.ExpiresAt,
                    IsArchived = item.IsArchived,
                    AllowAnonymousView = item.AllowAnonymousView,
                    AllowAnonymousDownload = item.AllowAnonymousDownload
                };

                if (item is FileEntity file)
                {
                    dto.Size = file.Size;
                    dto.ContentType = file.ContentType;
                    dto.BurnAfterDownload = file.BurnAfterDownload;
                }
                else if (item is FolderEntity folder)
                {
                    dto.AllowAnonymousUpload = folder.AllowAnonymousUpload;
                    dto.ShareToken = folder.ShareToken;
                    dto.Size = 0;
                }

                return dto;
            }).ToList();

            return Ok(allDtos);
        }

        var userId = User.Identity?.Name ?? "system";
        _logger.LogInformation("GetChildren called by user: {UserId}, IsAuthenticated: {IsAuth}, ParentId: {ParentId}",
            userId, User.Identity?.IsAuthenticated ?? false, parentId);

        // If accessing a specific parent, check permissions
        if (parentId.HasValue)
        {
            if (!await _fileSystem.CanAccessAsync(parentId.Value, userId, shareToken))
                return Forbid();
        }

        var items = await _fileSystem.GetChildrenAsync(parentId, includeAll ? null : userId);

        // Map to DTOs
        var dtos = items.Select(item =>
        {
            var dto = new FileSystemItemDto
            {
                Id = item.Id,
                Name = item.Name,
                FileSystemItemType = (int)item.FileSystemItemType,
                ParentId = item.ParentId,
                OwnerId = item.OwnerId,
                CreatedAt = item.CreatedAt,
                ExpiresAt = item.ExpiresAt,
                IsArchived = item.IsArchived,
                AllowAnonymousView = item.AllowAnonymousView,
                AllowAnonymousDownload = item.AllowAnonymousDownload
            };

            if (item is FileEntity file)
            {
                dto.Size = file.Size;
                dto.ContentType = file.ContentType;
                dto.BurnAfterDownload = file.BurnAfterDownload;
            }
            else if (item is FolderEntity folder)
            {
                dto.AllowAnonymousUpload = folder.AllowAnonymousUpload;
                dto.ShareToken = folder.ShareToken;
                dto.Size = 0; // Folders don't have size in list view
            }

            return dto;
        }).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// Get the size of an item (for folders, calculates total size of all children)
    /// </summary>
    [HttpGet("{id}/size")]
    public async Task<ActionResult<object>> GetSize(Guid id)
    {
        var userId = User.Identity?.Name;

        if (!await _fileSystem.CanAccessAsync(id, userId))
            return Forbid();

        var size = await _fileSystem.CalculateSizeAsync(id);
        return Ok(new { itemId = id, size, sizeFormatted = FormatBytes(size) });
    }

    /// <summary>
    /// Delete a filesystem item (folders are deleted recursively)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.Identity?.Name ?? "system";


        var item = await _fileSystem.GetItemAsync(id);
        if (item == null)
            return NotFound();

        // Only owner can delete
        if (item.OwnerId != userId && userId != "system")
            return Forbid();

        await _fileSystem.DeleteAsync(id);

        _logger.LogInformation("User {UserId} deleted item {ItemId} ({ItemName})",
            userId, id, item.Name);

        await _auditLog.LogAsync(userId, "DELETE", item.FileSystemItemType.ToString(), id.ToString(),
            $"Deleted {item.FileSystemItemType}: {item.Name}");

        return NoContent();
    }

    /// <summary>
    /// Bulk delete items
    /// </summary>
    [HttpPost("bulk/delete")]
    public async Task<IActionResult> BulkDelete([FromBody] List<Guid> ids)
    {
        if (ids == null || ids.Count == 0)
            return BadRequest("No items specified");

        if (ids.Count > 100)
            return BadRequest("Cannot delete more than 100 items at once");

        var userId = User.Identity?.Name ?? "system";
        var deletedCount = 0;
        var errors = new List<string>();

        foreach (var id in ids)
        {
            try
            {
                var item = await _fileSystem.GetItemAsync(id);
                if (item == null)
                {
                    errors.Add($"Item {id} not found");
                    continue;
                }

                if (item.OwnerId != userId && userId != "system")
                {
                    errors.Add($"No permission to delete {item.Name}");
                    continue;
                }

                await _fileSystem.DeleteAsync(id);
                deletedCount++;

                await _auditLog.LogAsync(userId, "BULK_DELETE", item.FileSystemItemType.ToString(), id.ToString(),
                    $"Bulk deleted {item.FileSystemItemType}: {item.Name}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting item {Id}", id);
                errors.Add($"Error deleting item {id}");
            }
        }

        return Ok(new { deletedCount, errors });
    }

    /// <summary>
    /// Move an item to a different parent folder
    /// </summary>
    [HttpPut("{id}/move")]
    public async Task<ActionResult<IFileSystemItem>> Move(Guid id, [FromBody] MoveItemRequest request)
    {
        var userId = User.Identity?.Name ?? "system";

        var item = await _fileSystem.GetItemAsync(id);
        if (item == null)
            return NotFound();

        // Only owner can move
        if (item.OwnerId != userId)
            return Forbid();

        try
        {
            var movedItem = await _fileSystem.MoveAsync(id, request.NewParentId);
            return Ok(movedItem);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Get the path from root to this item (breadcrumb trail)
    /// </summary>
    [HttpGet("{id}/path")]
    [AllowAnonymous]
    public async Task<ActionResult<List<IFileSystemItem>>> GetPath(Guid id)
    {
        var userId = User.Identity?.Name;

        // if (!await _fileSystem.CanAccessAsync(id, userId))
        //     return Forbid();

        var path = await _fileSystem.GetPathAsync(id);
        return Ok(path);
    }

    /// <summary>
    /// Archive an item (soft delete)
    /// </summary>
    [HttpPost("{id}/archive")]
    public async Task<IActionResult> Archive(Guid id)
    {
        var userId = User.Identity?.Name ?? "system";

        var item = await _fileSystem.GetItemAsync(id);
        if (item == null)
            return NotFound();

        if (item.OwnerId != userId)
            return Forbid();

        await _fileSystem.ArchiveAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Restore an archived item
    /// </summary>
    [HttpPost("{id}/restore")]
    public async Task<IActionResult> Restore(Guid id)
    {
        var userId = User.Identity?.Name ?? "system";

        var item = await _fileSystem.GetItemAsync(id);
        if (item == null)
            return NotFound();

        if (item.OwnerId != userId)
            return Forbid();

        await _fileSystem.RestoreAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Upload a file
    /// </summary>
    [HttpPost("upload")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileEntity>> UploadFile([FromForm] UploadFileRequest request)
    {
        if (request.File == null)
            return BadRequest("File is required");

        var userId = User.Identity?.Name;
        var isAuthenticated = !string.IsNullOrEmpty(userId);

        if (!isAuthenticated && request.FolderId.HasValue)
        {
            var folder = await _context.Folders.FindAsync(request.FolderId.Value);

            if (folder == null)
                return NotFound("Folder not found");

            if (folder.ShareToken != request.ShareToken || !folder.AllowAnonymousUpload)
                return Forbid("Anonymous upload not allowed for this folder. Valid share link required.");

            userId = "anonymous";
        }
        else if (!isAuthenticated)
        {
            return Unauthorized("Authentication required for root-level uploads.");
        }

        using var stream = request.File.OpenReadStream();
        var storageId = await _storageProvider.UploadAsync(stream, request.File.FileName, request.File.ContentType);

        DateTime? expiryDate = null;
        if (request.ExpiryDays.HasValue)
        {
            expiryDate = DateTime.UtcNow.AddDays(request.ExpiryDays.Value);
        }
        else if (request.FolderId.HasValue)
        {
            var folder = await _context.Folders.FindAsync(request.FolderId.Value);
            if (folder?.ExpiresAt.HasValue == true)
            {
                expiryDate = folder.ExpiresAt.Value;
            }
        }

        var fileEntity = new FileEntity
        {
            Id = Guid.NewGuid(),
            Name = request.File.FileName,
            ContentType = request.File.ContentType,
            Size = request.File.Length,
            StorageProviderId = storageId,
            ProviderName = _storageProvider.ProviderName,
            ParentId = request.FolderId,
            OwnerId = userId ?? "system",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = expiryDate,
            BurnAfterDownload = request.BurnAfterDownload,
            PinHash = !string.IsNullOrEmpty(request.Pin) ? PasswordHasher.HashPassword(request.Pin) : null
        };

        _context.Files.Add(fileEntity);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(userId ?? "anonymous", "UPLOAD", "File", fileEntity.Id.ToString(),
            $"Uploaded file: {fileEntity.Name} ({FormatBytes(fileEntity.Size)})");

        return Ok(fileEntity);
    }

    [HttpGet("download/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadFile(Guid id, [FromQuery] string? pin, [FromQuery] string? shareToken)
    {
        var file = await _context.Files.FindAsync(id);
        if (file == null) return NotFound();

        if (file.ExpiresAt.HasValue && file.ExpiresAt < DateTime.UtcNow)
        {
            await DeleteFileInternal(file);
            return StatusCode(StatusCodes.Status410Gone, "File has expired");
        }

        var userId = User.Identity?.Name;
        var isOwner = file.OwnerId == userId;
        var isAuthenticated = !string.IsNullOrEmpty(userId);

        if (!isOwner && !isAuthenticated)
        {
            if (file.ParentId.HasValue)
            {
                var folder = await _context.Folders.FindAsync(file.ParentId.Value);

                if (folder == null || folder.ShareToken != shareToken || !folder.AllowAnonymousDownload)
                {
                    return Forbid("Access denied. This file requires authentication or a valid share link.");
                }
            }
            else
            {
                return Forbid("Access denied. Authentication required.");
            }
        }

        if (!string.IsNullOrEmpty(file.PinHash))
        {
            if (string.IsNullOrEmpty(pin) || !PasswordHasher.VerifyPassword(pin, file.PinHash))
            {
                return Unauthorized("Invalid PIN");
            }
        }

        Stream stream;
        try
        {
            stream = await _storageProvider.DownloadAsync(file.StorageProviderId);
        }
        catch (FileNotFoundException)
        {
            _logger.LogWarning("File not found on server: {StorageId} for file {FileName}", file.StorageProviderId, file.Name);
            return NotFound("File not found on server");
        }

        return File(stream, file.ContentType, file.Name);
    }

    [HttpPost("download/{id}/confirm-burn")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmBurnAfterDownload(Guid id, [FromQuery] string? shareToken)
    {
        var file = await _context.Files.FindAsync(id);
        if (file == null) return NotFound();

        var userId = User.Identity?.Name;
        var isOwner = file.OwnerId == userId;
        var isAuthenticated = !string.IsNullOrEmpty(userId);

        if (!isOwner && !isAuthenticated)
        {
            if (file.ParentId.HasValue)
            {
                var folder = await _context.Folders.FindAsync(file.ParentId.Value);
                if (folder == null || folder.ShareToken != shareToken)
                {
                    return Forbid("Access denied.");
                }
            }
            else
            {
                return Forbid("Access denied. Authentication required.");
            }
        }

        if (file.BurnAfterDownload)
        {
            await _fileSystem.ArchiveAsync(file.Id);
            _logger.LogInformation("Archived file after download confirmation: {FileName} (ID: {FileId})", file.Name, file.Id);
            return Ok(new { message = "File archived successfully" });
        }

        return BadRequest("File is not marked for burn-after-download");
    }

    /// <summary>
    /// Create a folder
    /// </summary>
    [HttpPost("folder")]
    public async Task<ActionResult<FolderEntity>> CreateFolder([FromBody] CreateFolderRequest request)
    {
        var userId = User.Identity?.Name ?? "system";
        _logger.LogInformation("CreateFolder called by user: {UserId}, IsAuthenticated: {IsAuth}, FolderName: {FolderName}",
            userId, User.Identity?.IsAuthenticated ?? false, request.Name);

        var folder = new FolderEntity
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            ParentId = request.ParentFolderId,
            AllowAnonymousDownload = request.AllowAnonymousDownload,
            AllowAnonymousUpload = request.AllowAnonymousUpload,
            AllowAnonymousView = request.AllowAnonymousView,
            ExpiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(_configuration.GetValue<int>("FolderSettings:DefaultExpiryDays", 30)),
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow,
            PinHash = !string.IsNullOrEmpty(request.Pin) ? PasswordHasher.HashPassword(request.Pin) : null
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(userId, "CREATE_FOLDER", "Folder", folder.Id.ToString(),
            $"Created folder: {folder.Name}");

        return Ok(folder);
    }

    /// <summary>
    /// Update folder settings
    /// </summary>
    [HttpPut("folder/{id}")]
    public async Task<IActionResult> UpdateFolder(Guid id, [FromBody] UpdateFolderRequest request)
    {
        var userId = User.Identity?.Name ?? "system";
        var folder = await _context.Folders.FindAsync(id);

        if (folder == null) return NotFound();
        if (folder.OwnerId != userId && userId != "system") return Forbid();

        if (!string.IsNullOrEmpty(request.Name))
        {
            folder.Name = request.Name;
        }

        if (request.AllowAnonymousView.HasValue)
            folder.AllowAnonymousView = request.AllowAnonymousView.Value;
        if (request.AllowAnonymousUpload.HasValue)
            folder.AllowAnonymousUpload = request.AllowAnonymousUpload.Value;
        if (request.AllowAnonymousDownload.HasValue)
            folder.AllowAnonymousDownload = request.AllowAnonymousDownload.Value;
        if (request.ExpiresAt.HasValue)
            folder.ExpiresAt = request.ExpiresAt.Value;

        if (request.Pin != null)
        {
            folder.PinHash = !string.IsNullOrEmpty(request.Pin) ? PasswordHasher.HashPassword(request.Pin) : null;
        }

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(userId, "UPDATE_FOLDER", "Folder", folder.Id.ToString(),
            $"Updated folder settings: {folder.Name}");

        return Ok(folder);
    }

    private async Task DeleteFileInternal(FileEntity file)
    {
        await _storageProvider.DeleteAsync(file.StorageProviderId);
        _context.Files.Remove(file);
        await _context.SaveChangesAsync();
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}

public class MoveItemRequest
{
    public Guid? NewParentId { get; set; }
}

