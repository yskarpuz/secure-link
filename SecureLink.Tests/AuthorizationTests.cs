using System.Net;
using System.Text;
using Xunit;

namespace SecureLink.Tests;

public class AuthorizationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthorizationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_ShareLink_Without_Token_Returns_401()
    {
        var folderId = Guid.NewGuid();
        var content = new StringContent("{}", Encoding.UTF8, "application/json");
        var response = await _client.PostAsync($"/api/share/folder/{folderId}", content);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_ShareLink_Without_Token_Returns_401()
    {
        var folderId = Guid.NewGuid();
        var response = await _client.DeleteAsync($"/api/share/folder/{folderId}");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Config_Auth_Endpoint_Is_Publicly_Accessible()
    {
        var response = await _client.GetAsync("/api/config/auth");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
