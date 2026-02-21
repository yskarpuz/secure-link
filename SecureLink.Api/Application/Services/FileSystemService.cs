using SecureLink.Api.Core.Entities;
using SecureLink.Api.Core.Interfaces;
using SecureLink.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SecureLink.Api.Application.Services;

public class FileSystemService : IFileSystemService
{
    private readonly FileShareDbContext _context;
    private readonly IStorageProvider _storage;
    private readonly ILogger<FileSystemService> _logger;

    public FileSystemService(
        FileShareDbContext context,
        IStorageProvider storage,
        ILogger<FileSystemService> logger)
    {
        _context = context;
        _storage = storage;
        _logger = logger;
    }

    public async Task<IFileSystemItem?> GetItemAsync(Guid id)
    {
        // Try file first
        var file = await _context.Files.FindAsync(id);
        if (file != null) return file;

        // Try folder
        var folder = await _context.Folders.FindAsync(id);
        return folder;
    }

    public async Task<IEnumerable<IFileSystemItem>> GetChildrenAsync(Guid? parentId, string? userId = null)
    {
        var items = new List<IFileSystemItem>();

        // Get all files in this parent
        var filesQuery = _context.Files.Where(f => f.ParentId == parentId && !f.IsArchived);
        
        if (!string.IsNullOrEmpty(userId))
        {
            filesQuery = filesQuery.Where(f => f.OwnerId == userId || f.OwnerId == "system" || f.OwnerId == "anonymous");
        }
        
        var files = await filesQuery.ToListAsync();
        items.AddRange(files);

        // Get all folders in this parent
        var foldersQuery = _context.Folders.Where(f => f.ParentId == parentId && !f.IsArchived);
        
        if (!string.IsNullOrEmpty(userId))
        {
            foldersQuery = foldersQuery.Where(f => f.OwnerId == userId || f.OwnerId == "system");
        }
        
        var folders = await foldersQuery.ToListAsync();
        items.AddRange(folders);

        return items.OrderBy(i => i.FileSystemItemType).ThenBy(i => i.Name);
    }

    public async Task<long> CalculateSizeAsync(Guid itemId)
    {
        var item = await GetItemAsync(itemId);
        if (item == null) return 0;

        if (item.FileSystemItemType == FileSystemItemType.File)
        {
            return item.GetSize();
        }
        else
        {
            // Recursively calculate folder size
            var children = await GetChildrenAsync(itemId);
            long totalSize = 0;
            
            foreach (var child in children)
            {
                totalSize += await CalculateSizeAsync(child.Id);
            }
            
            return totalSize;
        }
    }

    public async Task DeleteAsync(Guid itemId)
    {
        var item = await GetItemAsync(itemId);
        if (item == null)
        {
            _logger.LogWarning("Attempted to delete non-existent item: {ItemId}", itemId);
            return;
        }

        if (item.FileSystemItemType == FileSystemItemType.Folder)
        {
            // Recursively delete children
            var children = await GetChildrenAsync(itemId);
            foreach (var child in children)
            {
                await DeleteAsync(child.Id);
            }

            _context.Folders.Remove((FolderEntity)item);
            _logger.LogInformation("Deleted folder: {Name} (ID: {Id})", item.Name, item.Id);
        }
        else
        {
            var file = (FileEntity)item;
            
            // Delete from storage
            try
            {
                await _storage.DeleteAsync(file.StorageProviderId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file from storage: {StorageId}", file.StorageProviderId);
            }
            
            _context.Files.Remove(file);
            _logger.LogInformation("Deleted file: {Name} (ID: {Id})", item.Name, item.Id);
        }

        await _context.SaveChangesAsync();
    }

    public async Task<bool> CanAccessAsync(Guid itemId, string? userId, string? shareToken = null)
    {
        var item = await GetItemAsync(itemId);
        if (item == null) return false;

        if(item.AllowAnonymousView == true) 
            return true;

        // Owner always has access
        if (!string.IsNullOrEmpty(userId) && item.OwnerId == userId)
            return true;

        // System files are accessible
        if (item.OwnerId == "system")
            return true;

        // Check share token access
        if (!string.IsNullOrEmpty(shareToken))
        {
            // For files, check parent folder's share token
            if (item.FileSystemItemType == FileSystemItemType.File && item.ParentId.HasValue)
            {
                var parent = await _context.Folders.FindAsync(item.ParentId.Value);
                if (parent?.ShareToken == shareToken && parent.AllowAnonymousView)
                    return true;
            }

            // For folders, check the folder's own share token
            if (item.FileSystemItemType == FileSystemItemType.Folder)
            {
                var folder = (FolderEntity)item;
                if (folder.ShareToken == shareToken && folder.AllowAnonymousView)
                    return true;
            }
        }

        return false;
    }

    public async Task<IFileSystemItem> MoveAsync(Guid itemId, Guid? newParentId)
    {
        var item = await GetItemAsync(itemId);
        if (item == null)
            throw new KeyNotFoundException($"Item {itemId} not found");

        // Prevent moving a folder into itself or its own children
        if (item.FileSystemItemType == FileSystemItemType.Folder && newParentId.HasValue)
        {
            if (await IsDescendantOfAsync(newParentId.Value, itemId))
            {
                throw new InvalidOperationException("Cannot move a folder into itself or its children");
            }
        }

        item.ParentId = newParentId;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Moved item {Name} (ID: {Id}) to parent {ParentId}", 
            item.Name, item.Id, newParentId);

        return item;
    }

    public async Task<List<IFileSystemItem>> GetPathAsync(Guid itemId)
    {
        var path = new List<IFileSystemItem>();
        var currentItem = await GetItemAsync(itemId);

        while (currentItem != null)
        {
            path.Insert(0, currentItem);
            
            if (!currentItem.ParentId.HasValue)
                break;

            currentItem = await GetItemAsync(currentItem.ParentId.Value);
        }

        return path;
    }

    public async Task ArchiveAsync(Guid itemId)
    {
        var item = await GetItemAsync(itemId);
        if (item == null)
            throw new KeyNotFoundException($"Item {itemId} not found");

        item.IsArchived = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Archived item: {Name} (ID: {Id})", item.Name, item.Id);
    }

    public async Task RestoreAsync(Guid itemId)
    {
        var item = await GetItemAsync(itemId);
        if (item == null)
            throw new KeyNotFoundException($"Item {itemId} not found");

        item.IsArchived = false;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Restored item: {Name} (ID: {Id})", item.Name, item.Id);
    }

    /// <summary>
    /// Check if potentialDescendantId is a descendant of ancestorId
    /// </summary>
    private async Task<bool> IsDescendantOfAsync(Guid potentialDescendantId, Guid ancestorId)
    {
        if (potentialDescendantId == ancestorId)
            return true;

        var item = await GetItemAsync(potentialDescendantId);
        
        while (item?.ParentId.HasValue == true)
        {
            if (item.ParentId.Value == ancestorId)
                return true;

            item = await GetItemAsync(item.ParentId.Value);
        }

        return false;
    }
}

