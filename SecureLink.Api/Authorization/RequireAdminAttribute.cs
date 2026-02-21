using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace SecureLink.Api.Authorization;

public class RequireAdminAttribute : TypeFilterAttribute
{
    public RequireAdminAttribute() : base(typeof(AdminAuthorizationFilter))
    {
    }
}

public class AdminAuthorizationFilter : IAuthorizationFilter
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminAuthorizationFilter> _logger;

    public AdminAuthorizationFilter(IConfiguration configuration, ILogger<AdminAuthorizationFilter> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var adminEmailsConfig = _configuration["AdminEmails"] ?? "";
        var adminEmails = adminEmailsConfig
            .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(e => e.Trim().ToLowerInvariant())
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .ToHashSet();

        if (adminEmails.Count == 0)
        {
            _logger.LogWarning("⚠️ No admin emails configured. Set AdminEmails in App Settings.");
            context.Result = new ForbidResult();
            return;
        }

        var userEmail = user.FindFirst(ClaimTypes.Email)?.Value 
            ?? user.FindFirst(ClaimTypes.Name)?.Value 
            ?? user.FindFirst("preferred_username")?.Value;

        if (!string.IsNullOrEmpty(userEmail) && adminEmails.Contains(userEmail.ToLowerInvariant()))
        {
            _logger.LogInformation("✅ Admin access granted for {Email}", userEmail);
            return;
        }

        _logger.LogWarning("❌ Admin access denied for user {Email}. Configured admins: {Count}", userEmail ?? "Unknown", adminEmails.Count);
        context.Result = new ForbidResult();
    }
}

