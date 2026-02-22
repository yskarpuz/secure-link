param environment string
param location string
param apiManagedIdentityPrincipalId string

resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: 'securelink${environment}acr'
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// Grant the API container app's managed identity pull access to ACR
var acrPullRole = '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
resource acrRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, apiManagedIdentityPrincipalId, acrPullRole)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRole)
    principalId: apiManagedIdentityPrincipalId
    principalType: 'ServicePrincipal'
  }
}

output loginServer string = acr.properties.loginServer
output acrName string = acr.name
