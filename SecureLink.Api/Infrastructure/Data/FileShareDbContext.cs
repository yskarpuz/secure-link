using SecureLink.Api.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace SecureLink.Api.Infrastructure.Data;

public class FileShareDbContext : DbContext
{
    public FileShareDbContext(DbContextOptions<FileShareDbContext> options) : base(options)
    {
    }

    public DbSet<FileEntity> Files { get; set; } = null!;
    public DbSet<FolderEntity> Folders { get; set; } = null!;
    public DbSet<TextSnippet> TextSnippets { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Primary Keys
        modelBuilder.Entity<FileEntity>().HasKey(f => f.Id);
        modelBuilder.Entity<FolderEntity>().HasKey(f => f.Id);
        modelBuilder.Entity<AuditLog>().HasKey(a => a.Id);
        modelBuilder.Entity<TextSnippet>().HasKey(t => t.Id);

        // FileEntity Indexes (for performance)
        modelBuilder.Entity<FileEntity>()
            .HasIndex(f => f.ParentId)
            .HasDatabaseName("IX_Files_ParentId");
        
        modelBuilder.Entity<FileEntity>()
            .HasIndex(f => new { f.OwnerId, f.IsArchived })
            .HasDatabaseName("IX_Files_OwnerId_IsArchived");
        
        modelBuilder.Entity<FileEntity>()
            .HasIndex(f => f.ExpiresAt)
            .HasDatabaseName("IX_Files_ExpiresAt");
        
        modelBuilder.Entity<FileEntity>()
            .HasIndex(f => new { f.BurnAfterDownload, f.IsAccessed })
            .HasDatabaseName("IX_Files_BurnAfterDownload_IsAccessed");
        
        modelBuilder.Entity<FileEntity>()
            .HasIndex(f => f.Name)
            .HasDatabaseName("IX_Files_Name");

        // FolderEntity Indexes
        modelBuilder.Entity<FolderEntity>()
            .HasIndex(f => f.ParentId)
            .HasDatabaseName("IX_Folders_ParentId");
        
        modelBuilder.Entity<FolderEntity>()
            .HasIndex(f => new { f.OwnerId, f.IsArchived })
            .HasDatabaseName("IX_Folders_OwnerId_IsArchived");
        
        modelBuilder.Entity<FolderEntity>()
            .HasIndex(f => f.ShareToken)
            .IsUnique()
            .HasFilter("\"ShareToken\" IS NOT NULL")
            .HasDatabaseName("IX_Folders_ShareToken");
        
        modelBuilder.Entity<FolderEntity>()
            .HasIndex(f => f.ExpiresAt)
            .HasDatabaseName("IX_Folders_ExpiresAt");
        
        modelBuilder.Entity<FolderEntity>()
            .HasIndex(f => f.Name)
            .HasDatabaseName("IX_Folders_Name");

        // TextSnippet Indexes
        modelBuilder.Entity<TextSnippet>()
            .HasIndex(t => t.ExpiresAt)
            .HasDatabaseName("IX_TextSnippets_ExpiresAt");
        
        modelBuilder.Entity<TextSnippet>()
            .HasIndex(t => t.OwnerId)
            .HasDatabaseName("IX_TextSnippets_OwnerId");

        // AuditLog Indexes
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.UserId)
            .HasDatabaseName("IX_AuditLogs_UserId");
        
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => new { a.EntityType, a.EntityId })
            .HasDatabaseName("IX_AuditLogs_EntityType_EntityId");
        
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.Timestamp)
            .HasDatabaseName("IX_AuditLogs_Timestamp");
    }
}
