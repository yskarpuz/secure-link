param environment string
param location string

@secure()
param adminPassword string

// ============================================================
// Azure Database for PostgreSQL - Flexible Server
// ============================================================
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: 'securelink-db-${environment}'
  location: location
  sku: {
    // Standard_B1ms (1 vCore, 2 GB RAM) — cheapest burstable tier.
    // Scale up to Standard_D2s_v3 when you have paying customers.
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: 'securelinkadmin'
    administratorLoginPassword: adminPassword
    highAvailability: { mode: 'Disabled' }
    storage: { storageSizeGB: 32 }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      // Container Apps will connect via service networking.
      // For enhanced security, enable private endpoint access after initial setup.
      publicNetworkAccess: 'Enabled'
    }
  }
}

resource securelinkDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: 'securelink'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services (Container Apps) to reach the database
resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output connectionString string = 'Host=${postgres.properties.fullyQualifiedDomainName};Database=securelink;Username=securelinkadmin;Password=${adminPassword};SslMode=Require;Trust Server Certificate=true'
output serverFqdn string = postgres.properties.fullyQualifiedDomainName
