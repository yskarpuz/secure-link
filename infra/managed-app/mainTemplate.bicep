targetScope = 'resourceGroup'

@description('Azure region — passed from createUiDefinition')
param location string = resourceGroup().location

@description('Application name prefix (3–15 lowercase alphanumeric)')
@minLength(3)
@maxLength(15)
param appName string

@description('Administrator email for monitoring alerts')
param adminEmail string

@description('Customer Entra ID tenant ID — auto-populated from subscription context')
param tenantId string

@description('Customer subscription ID — auto-populated from subscription context')
param subscriptionId string = subscription().subscriptionId

@description('Publisher multi-tenant app registration client ID')
param publisherClientId string = 'REPLACE_WITH_YOUR_AZURE_AD_CLIENT_ID'

@description('Publisher ACR login server (e.g. securelinkpub.azurecr.io)')
param acrServer string = 'REPLACE_WITH_YOUR_ACR_LOGIN_SERVER'

@description('ACR pull token username (repository-scoped, read-only)')
param acrPullTokenUser string = 'REPLACE_WITH_ACR_PULL_TOKEN_USERNAME'

@description('ACR pull token password')
@secure()
param acrPullTokenPassword string

@description('Full container image reference in publisher ACR')
param containerImage string = '${acrServer}/securelink-api:latest'

@description('Restrict access to this email domain (e.g. @acme.com). Leave blank to allow all tenant users.')
param allowedEmailDomain string = ''

@description('Maximum file upload size in megabytes')
param maxFileSizeMb string = '500'

@description('Default file expiry in days')
param defaultTtlDays string = '7'

var dbPassword = '${uniqueString(resourceGroup().id, appName, 'securelink-v1')}Xk9!'

module monitoring '../modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    environment: appName
    location: location
  }
}

module storage '../modules/storage.bicep' = {
  name: 'storage'
  params: {
    environment: appName
    location: location
  }
}

module database '../modules/database.bicep' = {
  name: 'database'
  params: {
    environment: appName
    location: location
    adminPassword: dbPassword
  }
}

module containerApps '../modules/containerApps.bicep' = {
  name: 'containerApps'
  params: {
    environment: appName
    location: location
    logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
    logAnalyticsPrimarySharedKey: monitoring.outputs.logAnalyticsPrimarySharedKey
    containerImage: containerImage
    azureAdTenantId: tenantId
    azureAdClientId: publisherClientId
    dbConnectionString: database.outputs.connectionString
    blobConnectionString: storage.outputs.connectionString
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    acrServer: acrServer
    acrPullTokenUser: acrPullTokenUser
    acrPullTokenPassword: acrPullTokenPassword
    allowedEmailDomain: allowedEmailDomain
    maxFileSizeMb: maxFileSizeMb
    defaultTtlDays: defaultTtlDays
  }
}

output applicationUrl string = containerApps.outputs.apiUrl
output adminEmail string = adminEmail
output region string = location
