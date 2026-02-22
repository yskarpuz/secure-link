param environment string
param location string
param acrLoginServer string
param apiManagedIdentityId string
param apiManagedIdentityClientId string
param logAnalyticsWorkspaceId string
param logAnalyticsPrimarySharedKey string
param apiImageTag string
param azureAdTenantId string
param azureAdClientId string
param azureAdDomain string
param dbConnectionString string
param blobConnectionString string
param appInsightsConnectionString string
param swaUrl string

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
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${apiManagedIdentityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'http'
        corsPolicy: {
          allowedOrigins: [swaUrl]
          allowedHeaders: ['*']
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowCredentials: true
        }
      }
      registries: [
        {
          server: acrLoginServer
          identity: apiManagedIdentityId
        }
      ]
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
          image: '${acrLoginServer}/securelink-api:${apiImageTag}'
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
            { name: 'AzureAd__Domain', value: azureAdDomain }
            { name: 'AzureAd__Audience', value: 'api://${azureAdClientId}' }
            { name: 'Cors__AllowedOrigins__0', value: swaUrl }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
            { name: 'AZURE_CLIENT_ID', value: apiManagedIdentityClientId }
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
output apiAppFqdn string = apiApp.properties.configuration.ingress.fqdn
