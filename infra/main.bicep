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

@description('Globally unique ACR name (5-50 lowercase alphanumeric). Example: securelinkpub')
param acrName string

@description('Full container image reference in publisher ACR')
param containerImage string = '${acrName}.azurecr.io/securelink-api:latest'

@description('ACR pull token username (repository-scoped, read-only)')
param acrPullTokenUser string = ''

@description('ACR pull token password')
@secure()
param acrPullTokenPassword string = ''

module acr 'modules/acr.bicep' = {
  name: 'acr'
  params: {
    acrName: acrName
    location: location
  }
}

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
    acrServer: acr.outputs.loginServer
    acrPullTokenUser: acrPullTokenUser
    acrPullTokenPassword: acrPullTokenPassword
  }
}

output apiUrl string = containerApps.outputs.apiUrl
output acrLoginServer string = acr.outputs.loginServer
