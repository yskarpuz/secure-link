param environment string
param apiBackendResourceId string

// ============================================================
// Azure Static Web Apps - Standard tier
// Hosts the Next.js frontend with built-in global CDN.
// The Standard tier is required for linked backends (API proxy).
// ============================================================
// Note: SWA is only available in a fixed set of regions regardless
// of the main deployment region. eastus2 is the recommended choice.
resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'securelink-web-${environment}'
  location: 'eastus2'
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

// ============================================================
// Linked Backend
// SWA automatically proxies /api/* requests to the linked backend
// (the Container Apps API). No changes needed in staticwebapp.config.json
// for the proxy — it is handled at the Azure platform level.
// ============================================================
resource linkedBackend 'Microsoft.Web/staticSites/linkedBackends@2023-12-01' = {
  parent: swa
  name: 'api-backend'
  properties: {
    backendResourceId: apiBackendResourceId
    region: resourceGroup().location
  }
}

output url string = 'https://${swa.properties.defaultHostname}'
output swaName string = swa.name
