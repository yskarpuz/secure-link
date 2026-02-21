using SecureLink.Api.Application.Services;
using SecureLink.Api.Core.Interfaces;
using SecureLink.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace SecureLink.Api.Application;

public class CleanupService : BackgroundService, IHostedLifecycleService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<CleanupService> _logger;
    private bool _isReady = false;

    public CleanupService(IServiceProvider services, ILogger<CleanupService> logger)
    {
        _services = services;
        _logger = logger;
    }

    public Task StartingAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("CleanupService: Starting (waiting for app to be fully initialized)...");
        return Task.CompletedTask;
    }

    public async Task StartedAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("CleanupService: App started, verifying database is ready...");
        
        // Wait briefly and verify database is ready
        await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
        
        using (var scope = _services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<FileShareDbContext>();
            if (await context.Database.CanConnectAsync(cancellationToken))
            {
                var pendingMigrations = await context.Database.GetPendingMigrationsAsync(cancellationToken);
                if (!pendingMigrations.Any())
                {
                    _isReady = true;
                    _logger.LogInformation("✅ CleanupService: Database is ready");
                    return;
                }
            }
        }
        
        _logger.LogWarning("⚠️ CleanupService: Database not ready, will retry");
    }

    public Task StoppingAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("CleanupService: Stopping...");
        return Task.CompletedTask;
    }

    public Task StoppedAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("CleanupService: Stopped");
        return Task.CompletedTask;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait until service is ready
        while (!_isReady && !stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("CleanupService: Waiting for database to be ready...");
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            
            // Retry check
            using (var scope = _services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<FileShareDbContext>();
                if (await context.Database.CanConnectAsync(stoppingToken))
                {
                    var pendingMigrations = await context.Database.GetPendingMigrationsAsync(stoppingToken);
                    if (!pendingMigrations.Any())
                    {
                        _isReady = true;
                        break;
                    }
                }
            }
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Cleanup service running at: {time}", DateTimeOffset.Now);

            try
            {
                using (var scope = _services.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<FileShareDbContext>();
                    var storageProvider = scope.ServiceProvider.GetRequiredService<IStorageProvider>();
                    
                    // Verify database is ready
                    if (!await context.Database.CanConnectAsync(stoppingToken))
                    {
                        _logger.LogWarning("Database not ready, skipping cleanup cycle");
                        await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                        continue;
                    }
                    
                    // Cleanup expired files
                    var expiredFiles = await context.Files
                        .Where(f => f.ExpiresAt != null && f.ExpiresAt < DateTime.UtcNow)
                        .ToListAsync(stoppingToken);

                    foreach (var file in expiredFiles)
                    {
                        try
                        {
                            await storageProvider.DeleteAsync(file.StorageProviderId);
                            _logger.LogInformation("Deleted expired file: {fileName} (ID: {fileId})", file.Name, file.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error deleting expired file {fileId} from storage", file.Id);
                        }
                        
                        context.Files.Remove(file);
                    }

                    // Cleanup burned files (accessed burn-after-download files)
                    var burnedFiles = await context.Files
                        .Where(f => f.BurnAfterDownload && f.IsAccessed)
                        .ToListAsync(stoppingToken);

                    foreach (var file in burnedFiles)
                    {
                        try
                        {
                            await storageProvider.DeleteAsync(file.StorageProviderId);
                            _logger.LogInformation("Deleted burned file: {fileName} (ID: {fileId})", file.Name, file.Id);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error deleting burned file {fileId} from storage", file.Id);
                        }
                        
                        context.Files.Remove(file);
                    }

                    // Cleanup expired text snippets
                    var expiredSnippets = await context.TextSnippets
                        .Where(s => s.ExpiresAt != null && s.ExpiresAt < DateTime.UtcNow)
                        .ToListAsync(stoppingToken);

                    foreach (var snippet in expiredSnippets)
                    {
                        context.TextSnippets.Remove(snippet);
                        _logger.LogInformation("Deleted expired snippet: {title} (ID: {snippetId})", snippet.Title, snippet.Id);
                    }

                    var changeCount = await context.SaveChangesAsync(stoppingToken);
                    
                    if (changeCount > 0)
                    {
                        _logger.LogInformation("Cleanup completed: {count} items removed", changeCount);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cleanup service execution");
            }

            // Run cleanup every hour
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
