using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SecureLink.Api.Controllers;

/// <summary>
/// Azure Marketplace SaaS Fulfillment API integration.
///
/// Required for Azure Marketplace SaaS offers. Microsoft calls these endpoints
/// during the customer subscription lifecycle (purchase, change plan, cancel).
///
/// Setup steps:
///   1. Add NuGet package: Microsoft.Marketplace.SaaS (currently commented — see below)
///   2. Register a SaaS offer in Partner Center with:
///      - Landing page URL: https://your-api.azurecontainerapps.io/marketplace/landing
///      - Webhook URL:      https://your-api.azurecontainerapps.io/marketplace/webhook
///   3. Set environment variable: Marketplace__AadTenantId, Marketplace__AadClientId,
///      Marketplace__AadClientSecret (app registration with access to Marketplace API)
///
/// Docs: https://learn.microsoft.com/en-us/azure/marketplace/partner-center-portal/pc-saas-fulfillment-life-cycle
/// </summary>
[ApiController]
[Route("marketplace")]
public class MarketplaceController : ControllerBase
{
    private readonly ILogger<MarketplaceController> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public MarketplaceController(
        ILogger<MarketplaceController> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Landing page — Microsoft redirects customers here after they click "Get It Now"
    /// in Azure Marketplace. The token query parameter contains a one-time-use purchase token.
    ///
    /// Flow:
    ///   1. Customer clicks "Get It Now" in Marketplace
    ///   2. Microsoft redirects to this endpoint with ?token=...
    ///   3. We resolve the token to get subscription details
    ///   4. We activate the subscription
    ///   5. We redirect the customer to the app
    /// </summary>
    [HttpGet("landing")]
    public async Task<IActionResult> Landing([FromQuery] string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Marketplace landing called without a token");
            return BadRequest(new { error = "Missing marketplace token" });
        }

        _logger.LogInformation("Marketplace landing page called with token");

        try
        {
            var subscription = await ResolveMarketplaceTokenAsync(token);

            if (subscription is null)
            {
                _logger.LogError("Failed to resolve marketplace token");
                return BadRequest(new { error = "Invalid marketplace token" });
            }

            _logger.LogInformation(
                "Resolved marketplace subscription {SubscriptionId} for {PurchaserEmail}",
                subscription.SubscriptionId,
                subscription.PurchaserEmail);

            // Activate the subscription so Microsoft knows onboarding is complete.
            await ActivateSubscriptionAsync(subscription.SubscriptionId, subscription.PlanId);

            _logger.LogInformation("Activated subscription {SubscriptionId}", subscription.SubscriptionId);

            // Redirect the customer to the application.
            // You can use the subscription details to pre-configure their account.
            var appUrl = _configuration["FrontendUrl"] ?? "/";
            return Redirect($"{appUrl}?subscriptionId={subscription.SubscriptionId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing marketplace landing");
            return StatusCode(500, new { error = "Failed to process marketplace subscription" });
        }
    }

    /// <summary>
    /// Webhook — Microsoft POSTs subscription lifecycle events here.
    ///
    /// Events received:
    ///   - ChangePlan: Customer upgraded or downgraded their plan
    ///   - ChangeQuantity: Customer changed the number of seats
    ///   - Suspend: Subscription suspended (e.g. payment failure)
    ///   - Reinstate: Subscription reinstated after suspension
    ///   - Unsubscribe: Customer cancelled the subscription
    ///   - Renew: Subscription renewed for another period
    ///
    /// IMPORTANT: This endpoint MUST return 200 OK within 5 seconds.
    /// Process events asynchronously (queue them) — do not do slow work inline.
    /// </summary>
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] MarketplaceWebhookPayload payload)
    {
        // Return 200 immediately — Microsoft will retry if we time out
        _ = ProcessWebhookEventAsync(payload); // fire-and-forget
        await Task.CompletedTask;

        _logger.LogInformation(
            "Received Marketplace webhook: Action={Action}, SubscriptionId={SubscriptionId}",
            payload.Action,
            payload.SubscriptionId);

        return Ok();
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private async Task<MarketplaceSubscription?> ResolveMarketplaceTokenAsync(string token)
    {
        // The resolve endpoint exchanges a one-time purchase token for subscription details.
        // See: https://learn.microsoft.com/en-us/azure/marketplace/partner-center-portal/pc-saas-fulfillment-subscription-api#resolve-a-subscription
        //
        // To call this you need an access token for the Marketplace API (audience: 20e940b3-4c77-4b0b-9a53-9e16a1b010a7)
        // obtained using the app registration credentials configured in Marketplace__AadClientId / AadClientSecret.
        //
        // TODO: Replace this stub with the Microsoft.Marketplace.SaaS client library calls:
        //   1. Add NuGet: dotnet add package Microsoft.Marketplace.SaaS
        //   2. Register: builder.Services.AddMarketplaceSaaSClient(...)
        //   3. Inject: ISaaSApiClientFactory and call ResolveAsync(token)
        //
        // Stub implementation returns null until the real integration is wired up.
        _logger.LogWarning("MarketplaceController.ResolveMarketplaceTokenAsync is a stub — wire up Microsoft.Marketplace.SaaS");
        await Task.CompletedTask;
        return null;
    }

    private async Task ActivateSubscriptionAsync(string subscriptionId, string planId)
    {
        // The activate endpoint tells Microsoft the subscription is ready.
        // Must be called within the SaaS offer's activation timeout (default: 24 hours).
        //
        // TODO: Replace with:
        //   await _marketplaceClient.FulfillmentOperations.ActivateSubscriptionAsync(
        //       subscriptionId, new ActivateSubscriptionRequest { PlanId = planId });
        _logger.LogWarning("MarketplaceController.ActivateSubscriptionAsync is a stub — wire up Microsoft.Marketplace.SaaS");
        await Task.CompletedTask;
    }

    private async Task ProcessWebhookEventAsync(MarketplaceWebhookPayload payload)
    {
        try
        {
            switch (payload.Action?.ToLowerInvariant())
            {
                case "changeplan":
                    _logger.LogInformation(
                        "Subscription {SubscriptionId} plan changed to {NewPlan}",
                        payload.SubscriptionId, payload.PlanId);
                    // TODO: Update the customer's plan in your database
                    break;

                case "suspend":
                    _logger.LogWarning(
                        "Subscription {SubscriptionId} suspended — restrict access",
                        payload.SubscriptionId);
                    // TODO: Restrict the customer's access (e.g. read-only mode)
                    break;

                case "reinstate":
                    _logger.LogInformation(
                        "Subscription {SubscriptionId} reinstated — restore access",
                        payload.SubscriptionId);
                    // TODO: Restore the customer's full access
                    break;

                case "unsubscribe":
                    _logger.LogInformation(
                        "Subscription {SubscriptionId} cancelled — begin offboarding",
                        payload.SubscriptionId);
                    // TODO: Schedule data deletion after the subscription end date
                    break;

                case "renew":
                    _logger.LogInformation("Subscription {SubscriptionId} renewed", payload.SubscriptionId);
                    break;

                default:
                    _logger.LogWarning(
                        "Unknown marketplace webhook action: {Action}", payload.Action);
                    break;
            }

            // TODO: After processing, acknowledge the operation back to Microsoft:
            //   await _marketplaceClient.FulfillmentOperations.UpdateOperationStatusAsync(
            //       subscriptionId, operationId, new UpdateOperationStatusRequest { Status = UpdateOperationStatusEnum.Success });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing marketplace webhook event {Action} for {SubscriptionId}",
                payload.Action, payload.SubscriptionId);
        }

        await Task.CompletedTask;
    }
}

// -----------------------------------------------------------------------
// DTOs
// -----------------------------------------------------------------------

public class MarketplaceSubscription
{
    public string SubscriptionId { get; set; } = string.Empty;
    public string PlanId { get; set; } = string.Empty;
    public string PurchaserEmail { get; set; } = string.Empty;
    public string SubscriptionName { get; set; } = string.Empty;
}

/// <summary>
/// Payload sent by Microsoft to the webhook endpoint.
/// See: https://learn.microsoft.com/en-us/azure/marketplace/partner-center-portal/pc-saas-fulfillment-webhook
/// </summary>
public class MarketplaceWebhookPayload
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("activityId")]
    public string ActivityId { get; set; } = string.Empty;

    [JsonPropertyName("subscriptionId")]
    public string SubscriptionId { get; set; } = string.Empty;

    [JsonPropertyName("offerId")]
    public string OfferId { get; set; } = string.Empty;

    [JsonPropertyName("publisherId")]
    public string PublisherId { get; set; } = string.Empty;

    [JsonPropertyName("planId")]
    public string PlanId { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string Action { get; set; } = string.Empty;

    [JsonPropertyName("timeStamp")]
    public DateTime TimeStamp { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("operationRequestSource")]
    public string OperationRequestSource { get; set; } = string.Empty;
}
