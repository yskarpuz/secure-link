param environment string
param location string
param logAnalyticsWorkspaceId string
param logAnalyticsPrimarySharedKey string
param containerImage string
param azureAdTenantId string
param azureAdClientId string
param dbConnectionString string
param blobConnectionString string
param appInsightsConnectionString string
param allowedEmailDomain string = ''
param maxFileSizeMb string = '500'
param defaultTtlDays string = '7'

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'securelink-env-${environment}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspaceId
        sharedKey: logAnalyticsPrimarySharedKey
      }
    }
  }
}

resource apiApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'securelink-api-${environment}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
      }
    }
    template: {
      scale: {
        minReplicas: 0
        maxReplicas: 10
        rules: [
          {
            name: 'http-scale'
            http: { metadata: { concurrentRequests: '30' } }
          }
        ]
      }
      containers: [
        {
          name: 'api'
          image: containerImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
            { name: 'ASPNETCORE_URLS', value: 'http://+:8080' }
            { name: 'ConnectionStrings__securelink-db', value: dbConnectionString }
            { name: 'ConnectionStrings__blobs', value: blobConnectionString }
            { name: 'AzureAd__Instance', value: 'https://login.microsoftonline.com/' }
            { name: 'AzureAd__TenantId', value: azureAdTenantId }
            { name: 'AzureAd__ClientId', value: azureAdClientId }
            { name: 'AzureAd__Audience', value: 'api://${azureAdClientId}' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
            { name: 'App__AllowedEmailDomain', value: allowedEmailDomain }
            { name: 'App__MaxFileSizeMb', value: maxFileSizeMb }
            { name: 'App__DefaultTtlDays', value: defaultTtlDays }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/alive', port: 8080, scheme: 'HTTP' }
              initialDelaySeconds: 15
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: { path: '/health', port: 8080, scheme: 'HTTP' }
              initialDelaySeconds: 20
              periodSeconds: 15
              failureThreshold: 5
            }
          ]
        }
      ]
    }
  }
}

output apiUrl string = 'https://${apiApp.properties.configuration.ingress.fqdn}'
output apiAppId string = apiApp.id
output systemAssignedPrincipalId string = apiApp.identity.principalId
