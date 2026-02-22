param environment string
param location string

// ============================================================
// User-Assigned Managed Identity for the API Container App
// Used to pull images from ACR and read secrets from Key Vault.
// ============================================================
resource apiManagedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'securelink-api-identity-${environment}'
  location: location
}

output apiManagedIdentityId string = apiManagedIdentity.id
output apiManagedIdentityPrincipalId string = apiManagedIdentity.properties.principalId
output apiManagedIdentityClientId string = apiManagedIdentity.properties.clientId
