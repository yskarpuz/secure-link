using SecureLink.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace SecureLink.Api.Application;

public class MigrationStartupCheck : IHealthCheck
{
    private readonly FileShareDbContext _context;
    private readonly ILogger<MigrationStartupCheck> _logger;

    public MigrationStartupCheck(FileShareDbContext context, ILogger<MigrationStartupCheck> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!await _context.Database.CanConnectAsync(cancellationToken))
            {
                return HealthCheckResult.Unhealthy("Database connection failed");
            }

            var pendingMigrations = await _context.Database.GetPendingMigrationsAsync(cancellationToken);
            if (pendingMigrations.Any())
            {
                return HealthCheckResult.Unhealthy($"Pending migrations: {string.Join(", ", pendingMigrations)}");
            }

            return HealthCheckResult.Healthy("Database is ready and migrations are complete");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Migration health check failed");
            return HealthCheckResult.Unhealthy("Migration health check failed", ex);
        }
    }
}

