using System.Security.Claims;
using Microsoft.Identity.Web;

namespace SecureLink.Api.Middleware;

public class MsalAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MsalAuthenticationMiddleware> _logger;

    public MsalAuthenticationMiddleware(RequestDelegate next, ILogger<MsalAuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
        {
            var token = authHeader.Substring("Bearer ".Length).Trim();
            
            try
            {
                var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                
                if (jwtToken != null)
                {
                    _logger.LogInformation("JWT Token Claims: {Claims}", 
                        string.Join(", ", jwtToken.Claims.Select(c => $"{c.Type}={c.Value}")));
                    
                    var email = jwtToken.Claims.FirstOrDefault(c => 
                        c.Type == "preferred_username" || 
                        c.Type == "upn" || 
                        c.Type == "email" ||
                        c.Type == "unique_name")?.Value;
                    
                    var name = jwtToken.Claims.FirstOrDefault(c => c.Type == "name")?.Value;
                    var oid = jwtToken.Claims.FirstOrDefault(c => c.Type == "oid")?.Value;
                    
                    if (!string.IsNullOrEmpty(email))
                    {
                        var claims = new List<Claim>
                        {
                            new Claim(ClaimTypes.Name, email),
                            new Claim(ClaimTypes.Email, email),
                            new Claim(ClaimTypes.NameIdentifier, oid ?? email)
                        };

                        if (!string.IsNullOrEmpty(name))
                        {
                            claims.Add(new Claim("displayName", name));
                        }
                        
                        if (!string.IsNullOrEmpty(oid))
                        {
                            claims.Add(new Claim("oid", oid));
                        }

                        var identity = new ClaimsIdentity(claims, "Bearer");
                        context.User = new ClaimsPrincipal(identity);
                        
                        _logger.LogInformation("✅ Authenticated user: {Email} (OID: {Oid})", email, oid);
                    }
                    else
                    {
                        _logger.LogWarning("❌ No email claim found in token");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to parse JWT token");
            }
        }

        await _next(context);
    }
}
