using SecureLink.Api.Infrastructure.Data;
using SecureLink.Api.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace SecureLink.Api.Application.Services;

public interface IAuditLogService
{
    Task LogAsync(string userId, string action, string entityType, string entityId, string? details = null);
    Task<List<AuditLog>> GetUserLogsAsync(string userId, int limit = 100);
    Task<List<AuditLog>> GetEntityLogsAsync(string entityType, string entityId, int limit = 50);
    Task<List<AuditLog>> GetAllLogsAsync(int limit = 1000);
}

public class AuditLogService : IAuditLogService
{
    private readonly FileShareDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(FileShareDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(string userId, string action, string entityType, string entityId, string? details = null)
    {
        try
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                Timestamp = DateTime.UtcNow,
                IpAddress = null
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Audit: User {UserId} performed {Action} on {EntityType} {EntityId}",
                userId, action, entityType, entityId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log for user {UserId}", userId);
        }
    }

    public async Task<List<AuditLog>> GetUserLogsAsync(string userId, int limit = 100)
    {
        return await _context.AuditLogs
            .Where(log => log.UserId == userId)
            .OrderByDescending(log => log.Timestamp)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetEntityLogsAsync(string entityType, string entityId, int limit = 50)
    {
        return await _context.AuditLogs
            .Where(log => log.EntityType == entityType && log.EntityId == entityId)
            .OrderByDescending(log => log.Timestamp)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<List<AuditLog>> GetAllLogsAsync(int limit = 1000)
    {
        return await _context.AuditLogs
            .OrderByDescending(log => log.Timestamp)
            .Take(limit)
            .ToListAsync();
    }
}
