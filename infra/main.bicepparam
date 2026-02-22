using 'main.bicep'

// ============================================================
// Environment-specific parameters
// Fill in before deploying. Store secrets in a key vault or
// GitHub Actions secrets — never commit real values here.
// ============================================================

param environment = 'prod'

// Azure region — eastus2 has the broadest Azure service availability
param location = 'eastus2'

// Azure AD (Entra ID) — the same app registration used by the backend API
param azureAdTenantId = ''       // e.g. '00000000-0000-0000-0000-000000000000'
param azureAdClientId = ''       // e.g. '00000000-0000-0000-0000-000000000000'
param azureAdDomain = ''         // e.g. 'yourcompany.onmicrosoft.com'

// PostgreSQL admin password — override via --parameters in CI or az deployment
param dbAdminPassword = ''       // Use GitHub Actions secret: ${{ secrets.DB_ADMIN_PASSWORD }}

// Container image tag — overridden by the backend GitHub Actions workflow
param apiImageTag = 'latest'
