using SecureLink.Api.Core.Entities;

namespace SecureLink.Api.Core.Interfaces;

/// <summary>
/// Unified service for managing both files and folders as filesystem items
/// </summary>
public interface IFileSystemService
{
    /// <summary>
    /// Get a filesystem item (file or folder) by ID
    /// </summary>
    Task<IFileSystemItem?> GetItemAsync(Guid id);
    
    /// <summary>
    /// Get all children of a parent item (or root if parentId is null)
    /// </summary>
    Task<IEnumerable<IFileSystemItem>> GetChildrenAsync(Guid? parentId, string? userId = null);
    
    /// <summary>
    /// Calculate total size of an item (for folders, includes all children recursively)
    /// </summary>
    Task<long> CalculateSizeAsync(Guid itemId);
    
    /// <summary>
    /// Delete an item (for folders, deletes recursively)
    /// </summary>
    Task DeleteAsync(Guid itemId);
    
    /// <summary>
    /// Check if a user can access an item
    /// </summary>
    Task<bool> CanAccessAsync(Guid itemId, string? userId, string? shareToken = null);
    
    /// <summary>
    /// Move an item to a new parent
    /// </summary>
    Task<IFileSystemItem> MoveAsync(Guid itemId, Guid? newParentId);
    
    /// <summary>
    /// Get path from root to item (breadcrumb trail)
    /// </summary>
    Task<List<IFileSystemItem>> GetPathAsync(Guid itemId);
    
    /// <summary>
    /// Archive an item (soft delete)
    /// </summary>
    Task ArchiveAsync(Guid itemId);
    
    /// <summary>
    /// Restore an archived item
    /// </summary>
    Task RestoreAsync(Guid itemId);
}

