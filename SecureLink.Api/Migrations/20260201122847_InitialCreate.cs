using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SecureLink.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Action = table.Column<string>(type: "text", nullable: false),
                    EntityType = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<string>(type: "text", nullable: false),
                    Details = table.Column<string>(type: "text", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Files",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    PinHash = table.Column<string>(type: "text", nullable: true),
                    AllowAnonymousView = table.Column<bool>(type: "boolean", nullable: false),
                    AllowAnonymousDownload = table.Column<bool>(type: "boolean", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    StorageProviderId = table.Column<string>(type: "text", nullable: false),
                    ProviderName = table.Column<string>(type: "text", nullable: false),
                    BurnAfterDownload = table.Column<bool>(type: "boolean", nullable: false),
                    IsAccessed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Files", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Folders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false),
                    PinHash = table.Column<string>(type: "text", nullable: true),
                    AllowAnonymousView = table.Column<bool>(type: "boolean", nullable: false),
                    AllowAnonymousUpload = table.Column<bool>(type: "boolean", nullable: false),
                    AllowAnonymousDownload = table.Column<bool>(type: "boolean", nullable: false),
                    ShareToken = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Folders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TextSnippets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    OwnerId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BurnAfterRead = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TextSnippets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityType_EntityId",
                table: "AuditLogs",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Files_BurnAfterDownload_IsAccessed",
                table: "Files",
                columns: new[] { "BurnAfterDownload", "IsAccessed" });

            migrationBuilder.CreateIndex(
                name: "IX_Files_ExpiresAt",
                table: "Files",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Files_Name",
                table: "Files",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Files_OwnerId_IsArchived",
                table: "Files",
                columns: new[] { "OwnerId", "IsArchived" });

            migrationBuilder.CreateIndex(
                name: "IX_Files_ParentId",
                table: "Files",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_ExpiresAt",
                table: "Folders",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_Name",
                table: "Folders",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_OwnerId_IsArchived",
                table: "Folders",
                columns: new[] { "OwnerId", "IsArchived" });

            migrationBuilder.CreateIndex(
                name: "IX_Folders_ParentId",
                table: "Folders",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Folders_ShareToken",
                table: "Folders",
                column: "ShareToken",
                unique: true,
                filter: "\"ShareToken\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TextSnippets_ExpiresAt",
                table: "TextSnippets",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_TextSnippets_OwnerId",
                table: "TextSnippets",
                column: "OwnerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "Files");

            migrationBuilder.DropTable(
                name: "Folders");

            migrationBuilder.DropTable(
                name: "TextSnippets");
        }
    }
}
