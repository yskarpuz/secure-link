using SecureLink.Api.Application.Services;
using SecureLink.Api.Core.Interfaces;
using SecureLink.Api.Infrastructure.Data;
using SecureLink.Api.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Identity.Web;
using System.Text.Json;
using SecureLink.Api.Application;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// ============================================================================
// ASPIRE SERVICE DEFAULTS
// Adds: OpenTelemetry, Health Checks, Service Discovery, Resilience
// ============================================================================
builder.AddServiceDefaults();

// ============================================================================
// CORE SERVICES
// ============================================================================
builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient(); // Required for MarketplaceController

// ============================================================================
// AUTHENTICATION - Azure AD / Entra ID
// ============================================================================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(options =>
    {
        builder.Configuration.Bind("AzureAd", options);
        var clientId = builder.Configuration["AzureAd:ClientId"];
        if (!string.IsNullOrEmpty(clientId))
        {
            options.TokenValidationParameters.ValidAudiences = new[]
            {
                clientId,
                $"api://{clientId}"
            };
        }
    }, 
    options => builder.Configuration.Bind("AzureAd", options));

// ============================================================================
// DATABASE - PostgreSQL with Entity Framework Core
// Aspire injects connection string as "securelink-db"
// Falls back to "DefaultConnection" for backward compatibility
// ============================================================================
var connectionString = builder.Configuration.GetConnectionString("securelink-db") 
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string is required. Expected 'securelink-db' or 'DefaultConnection'.");

builder.Services.AddDbContext<FileShareDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.MigrationsAssembly("SecureLink.Api");
        npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory");
    });
    
    if (builder.Environment.IsDevelopment())
    {
        options.EnableDetailedErrors();
        options.EnableSensitiveDataLogging();
    }
});

// ============================================================================
// STORAGE PROVIDER - Azure Blob or Local
// Aspire injects connection string as "blobs"
// ============================================================================

builder.Services.AddScoped<IStorageProvider, AzureBlobStorageProvider>();

// ============================================================================
// APPLICATION SERVICES
// ============================================================================
builder.Services.AddScoped<IFileSystemService, FileSystemService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddHostedService<CleanupService>();

// ============================================================================
// HEALTH CHECKS
// Aspire's AddServiceDefaults() already adds basic health checks
// Here we add specific checks for database and storage
// ============================================================================
var healthChecksBuilder = builder.Services.AddHealthChecks();

// Database health check using EF Core context
healthChecksBuilder.AddDbContextCheck<FileShareDbContext>(
    name: "database",
    failureStatus: HealthStatus.Unhealthy,
    tags: new[] { "ready", "db" }
);

// Azure Blob Storage health check
// Aspire injects connection string as "blobs"
var azureStorageConnection = builder.Configuration.GetConnectionString("blobs")
    ?? builder.Configuration["Storage:AzureBlob:ConnectionString"];

if (!string.IsNullOrEmpty(azureStorageConnection))
{
    healthChecksBuilder.AddAzureBlobStorage(
        azureStorageConnection,
        name: "storage",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "ready", "storage" }
    );
}

// ============================================================================
// CORS CONFIGURATION
// In development: Allow all origins (for local testing)
// In production: Restrict to configured origins
// ============================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Allow any origin in development for easier testing
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Restrict to specific origins in production
            var allowedOrigins = builder.Configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>() ?? Array.Empty<string>();
            
            if (allowedOrigins.Length > 0)
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            }
        }
    });
});

// ============================================================================
// BUILD APPLICATION
// ============================================================================
var app = builder.Build();

// ============================================================================
// DATABASE MIGRATIONS
// Apply pending migrations at startup (safer approach than BuildServiceProvider)
// ============================================================================
await using (var scope = app.Services.CreateAsyncScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var context = scope.ServiceProvider.GetRequiredService<FileShareDbContext>();

    try
    {
        logger.LogInformation("Checking for pending database migrations...");
        
        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
        var pendingList = pendingMigrations.ToList();
        
        if (pendingList.Any())
        {
            logger.LogInformation("Applying {Count} pending migration(s): {Migrations}", 
                pendingList.Count, 
                string.Join(", ", pendingList));
            
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully");
        }
        else
        {
            logger.LogInformation("Database is up to date. No migrations needed.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply database migrations");
        throw; // Fail fast if migrations fail
    }
}

// ============================================================================
// EXCEPTION HANDLING
// Global exception handler for unhandled exceptions
// ============================================================================
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        
        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        
        if (exceptionFeature?.Error is not null)
        {
            logger.LogError(
                exceptionFeature.Error, 
                "Unhandled exception occurred. TraceId: {TraceId}", 
                context.TraceIdentifier
            );
            
            var response = new
            {
                error = builder.Environment.IsDevelopment() 
                    ? exceptionFeature.Error.Message 
                    : "An error occurred processing your request.",
                type = exceptionFeature.Error.GetType().Name,
                traceId = context.TraceIdentifier
            };
            
            await context.Response.WriteAsJsonAsync(response);
        }
    });
});

// ============================================================================
// SWAGGER (Development Only)
// ============================================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "SecureLink API v1");
        options.RoutePrefix = "swagger";
    });
}

// ============================================================================
// HTTPS REDIRECTION (Production Only)
// ============================================================================
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// ============================================================================
// STATIC FILES
// Serves static files and default files (index.html)
// ============================================================================
app.UseDefaultFiles();
app.UseStaticFiles();

// ============================================================================
// CORS
// ============================================================================
app.UseCors("FrontendPolicy");

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================
app.UseAuthentication();
app.UseAuthorization();

// ============================================================================
// ROUTING
// ============================================================================
app.MapControllers();

// ============================================================================
// ASPIRE ENDPOINTS
// Maps default Aspire endpoints: /health, /alive, /ready
// These provide health check information for orchestration
// ============================================================================
app.MapDefaultEndpoints();

// ============================================================================
// CUSTOM HEALTH CHECK ENDPOINTS
// Additional detailed health check endpoints for monitoring
// ============================================================================
app.MapHealthChecks("/health/detailed", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        
        var result = JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            timestamp = DateTime.UtcNow,
            checks = report.Entries.Select(entry => new
            {
                name = entry.Key,
                status = entry.Value.Status.ToString(),
                description = entry.Value.Description,
                duration = entry.Value.Duration.TotalMilliseconds,
                tags = entry.Value.Tags,
                exception = entry.Value.Exception?.Message
            }),
            totalDuration = report.TotalDuration.TotalMilliseconds
        }, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        
        await context.Response.WriteAsync(result);
    } 
});

// ============================================================================
// SPA FALLBACK
// For serving the frontend SPA (if hosted within the API)
// ============================================================================
app.MapFallbackToFile("index.html");

// ============================================================================
// START APPLICATION
// ============================================================================
app.Run();