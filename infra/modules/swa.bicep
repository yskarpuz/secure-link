param environment string

resource swa 'Microsoft.Web/staticSites@2023-12-01' = {
  name: 'securelink-web-${environment}'
  location: 'eastus2'
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

output url string = 'https://${swa.properties.defaultHostname}'
output swaName string = swa.name
