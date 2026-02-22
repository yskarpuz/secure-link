// ============================================================
// SecureLink - Azure Infrastructure
// Deploys all resources needed for the SaaS offering.
// ============================================================
targetScope = 'resourceGroup'

@description('Environment name (prod, staging, dev)')
param environment string = 'prod'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Azure AD tenant ID for authentication')
param azureAdTenantId string

@description('Azure AD client ID (app registration) for authentication')
param azureAdClientId string

@description('Azure AD domain (e.g. contoso.onmicrosoft.com)')
param azureAdDomain string

@description('PostgreSQL administrator password')
@secure()
param dbAdminPassword string

@description('Container image tag to deploy')
param apiImageTag string = 'latest'

// ============================================================
// MODULES
// ============================================================

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    environment: environment
    location: location
  }
}

module identity 'modules/identity.bicep' = {
  name: 'identity'
  params: {
    environment: environment
    location: location
  }
}

module keyVault 'modules/keyVault.bicep' = {
  name: 'keyVault'
  params: {
    environment: environment
    location: location
    apiManagedIdentityPrincipalId: identity.outputs.apiManagedIdentityPrincipalId
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    environment: environment
    location: location
  }
}

module database 'modules/database.bicep' = {
  name: 'database'
  params: {
    environment: environment
    location: location
    adminPassword: dbAdminPassword
  }
}

module acr 'modules/acr.bicep' = {
  name: 'acr'
  params: {
    environment: environment
    location: location
    apiManagedIdentityPrincipalId: identity.outputs.apiManagedIdentityPrincipalId
  }
}

module containerApps 'modules/containerApps.bicep' = {
  name: 'containerApps'
  params: {
    environment: environment
    location: location
    acrLoginServer: acr.outputs.loginServer
    apiManagedIdentityId: identity.outputs.apiManagedIdentityId
    apiManagedIdentityClientId: identity.outputs.apiManagedIdentityClientId
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    logAnalyticsPrimarySharedKey: monitoring.outputs.logAnalyticsPrimarySharedKey
    apiImageTag: apiImageTag
    azureAdTenantId: azureAdTenantId
    azureAdClientId: azureAdClientId
    azureAdDomain: azureAdDomain
    dbConnectionString: database.outputs.connectionString
    blobConnectionString: storage.outputs.connectionString
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    swaUrl: swa.outputs.url
  }
}

module swa 'modules/swa.bicep' = {
  name: 'swa'
  params: {
    environment: environment
    apiBackendResourceId: containerApps.outputs.apiAppId
  }
}

// ============================================================
// OUTPUTS
// ============================================================

output apiUrl string = containerApps.outputs.apiUrl
output frontendUrl string = swa.outputs.url
output acrLoginServer string = acr.outputs.loginServer
