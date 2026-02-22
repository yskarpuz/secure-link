using 'main.bicep'

param environment = 'prod'
param location = 'eastus2'
param azureAdTenantId = ''
param azureAdClientId = ''
param dbAdminPassword = ''
param containerImage = 'ghcr.io/YOUR_ORG/securelink-api:latest'
