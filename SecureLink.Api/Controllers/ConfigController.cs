using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace SecureLink.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet("auth")]
    public ActionResult<object> GetAuthConfig()
    {
        return Ok(new
        {
            ClientId = _configuration["AzureAd:ClientId"],
            TenantId = _configuration["AzureAd:TenantId"],
            Instance = _configuration["AzureAd:Instance"]
        });
    }

    [HttpGet("version")]
    public ActionResult<object> GetVersion()
    {
        var version = _configuration["AppVersion"] ?? "dev";
        return Ok(new
        {
            Version = version,
            Api = version,
            Environment = _configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production"
        });
    }
      [HttpGet("branding")]
    public ActionResult<object> GetBranding()
    {
        return Ok(new
        {
            AppName = _configuration["Branding:AppName"] ?? "SecureShare",
            LogoUrl = _configuration["Branding:LogoUrl"]
        });
    }
}
