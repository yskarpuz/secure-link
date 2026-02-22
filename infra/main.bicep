targetScope = 'resourceGroup'

@description('Environment name (prod, staging, dev)')
param environment string = 'prod'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Azure AD tenant ID for authentication')
param azureAdTenantId string

@description('Azure AD client ID (publisher multi-tenant app registration)')
param azureAdClientId string

@description('PostgreSQL administrator password')
@secure()
param dbAdminPassword string

@description('Full container image reference, e.g. ghcr.io/org/securelink-api:latest')
param containerImage string = 'ghcr.io/YOUR_ORG/securelink-api:latest'

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    environment: environment
    location: location
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

module containerApps 'modules/containerApps.bicep' = {
  name: 'containerApps'
  params: {
    environment: environment
    location: location
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    logAnalyticsPrimarySharedKey: monitoring.outputs.logAnalyticsPrimarySharedKey
    containerImage: containerImage
    azureAdTenantId: azureAdTenantId
    azureAdClientId: azureAdClientId
    dbConnectionString: database.outputs.connectionString
    blobConnectionString: storage.outputs.connectionString
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
  }
}

output apiUrl string = containerApps.outputs.apiUrl
