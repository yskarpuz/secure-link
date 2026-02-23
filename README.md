# SecureLink

A secure file-sharing platform built on ASP.NET Core 10 + Next.js 16, published as an **Azure Managed Application**. Customers install it directly into their own Azure subscription — they own all their data.

---

## Architecture

```
Browser → Azure Container App (API + Frontend served together)
              ├── Azure Database for PostgreSQL (file metadata)
              └── Azure Blob Storage (file contents)
```

- **Frontend**: Next.js 16, compiled as static HTML/CSS/JS, served by ASP.NET Core's `UseStaticFiles()`
- **Backend**: ASP.NET Core 10 with Entity Framework Core, JWT auth via Entra ID
- **Single Docker image**: frontend is baked into the backend container at build time
- **Registry**: Azure Container Registry (Basic, ~$5/month) — images are private to you

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 10.0 | https://dotnet.microsoft.com/download |
| Node.js | 20 LTS | https://nodejs.org |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| Azure CLI | latest | https://learn.microsoft.com/en-us/cli/azure/install-azure-cli |

---

## Local Development

### Step 1 — Create an Entra ID App Registration (one-time)

You need an Azure app registration so users can sign in during local development. Do this once; the same registration can be reused indefinitely.

1. Go to [portal.azure.com](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations** → **New registration**
2. Name: anything (e.g. `SecureLink Dev`)
3. Supported account types: **"Accounts in this organizational directory only"** (your tenant)
4. Redirect URI: **Single-page application (SPA)** → `http://localhost:3000`
5. Click **Register**. Note the two values on the Overview page:
   - **Application (client) ID** — you'll use this everywhere below
   - **Directory (tenant) ID** — your tenant ID
6. In the left menu → **Expose an API**
   - Click **Add** next to "Application ID URI" → accept the default `api://{client-id}` → **Save**
   - Click **Add a scope**:
     - Scope name: `access_as_user`
     - Who can consent: **Admins and users**
     - Admin consent display name: `Access SecureLink`
     - Click **Add scope**
7. In the left menu → **API permissions**
   - Click **Add a permission** → **My APIs** → select your new registration → check `access_as_user` → **Add permissions**
   - Click **Grant admin consent for {your org}** → Yes

You now have a client ID and tenant ID. Keep them handy for the next steps.

---

### Step 2 — Configure the API

The API reads Azure AD config from `appsettings.Development.json`, which is gitignored.

```bash
# In the repo root
cp SecureLink.Api/appsettings.Development.json.example SecureLink.Api/appsettings.Development.json
```

Open `SecureLink.Api/appsettings.Development.json` and replace the placeholders:

```json
{
  "AzureAd": {
    "TenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "ClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "Audience": "api://xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

---

### Step 3 — Configure the Frontend

```bash
cd securelink-web
cp .env.local.example .env.local
```

Open `securelink-web/.env.local` and replace the placeholders with the same values:

```
NEXT_PUBLIC_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

### Step 4 — Install Prerequisites (one-time)

```bash
# Install .NET Aspire workload
dotnet workload install aspire

# Install frontend dependencies
cd securelink-web && npm install && cd ..
```

Docker Desktop must be running (Aspire uses it for PostgreSQL and Azurite containers).

---

### Step 5 — Run the App

Aspire starts everything together: the API, PostgreSQL, Azurite blob storage, and the Next.js dev server.

```bash
cd SecureLink.AppHost
dotnet run
```

Aspire opens a dashboard at `https://localhost:15888` where you can see all services and their logs. The app is at `http://localhost:3000`.

> **First run:** Aspire downloads Docker images for PostgreSQL and Azurite (~1-2 minutes). The API applies database migrations automatically on startup.

> **Tip:** If you get a certificate error on the dashboard, run `dotnet dev-certs https --trust` once to trust the dev certificate on macOS.

---

## Running Tests

```bash
# Run all integration tests
dotnet test SecureLink.Tests/SecureLink.Tests.csproj

# Verbose output
dotnet test SecureLink.Tests/SecureLink.Tests.csproj --logger "console;verbosity=normal"
```

The test project (`SecureLink.Tests`) uses `Microsoft.AspNetCore.Mvc.Testing` with an in-memory database so no real Azure or PostgreSQL connection is needed. Tests verify:

- `/alive` returns HTTP 200
- `/health` returns HTTP 200
- Protected endpoints (`POST /api/share/folder/{id}`, `DELETE /api/share/folder/{id}`) return HTTP 401 without a token
- `/api/config/auth` is publicly accessible

---

## GitHub Actions (3 workflows)

### 1. `backend.yml` — Build and Publish Container Image

**Triggers on:** any push to `main` that changes the API, frontend, or Docker-related files.

**What it does:**
1. Builds the .NET backend to catch any compilation errors
2. Logs into Azure (using OIDC — no stored passwords) and then into your ACR
3. Runs the 3-stage Docker build: Node.js builds the frontend → .NET SDK builds the backend → .NET runtime combines both
4. Pushes two tags to ACR: `:latest` and `:{git-sha}` (for rollback)

**Result:** A new Docker image is available in your ACR. Existing customer deployments are **not** automatically updated (see "Releasing a New Version" below).

**Secrets/variables required in GitHub:**

| Name | Type | Value |
|------|------|-------|
| `AZURE_CLIENT_ID` | Variable | Service principal client ID with `AcrPush` role on your ACR |
| `AZURE_TENANT_ID` | Variable | Your Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Variable | Your Azure subscription ID |
| `ACR_NAME` | Variable | Your ACR name (e.g. `securelinkpub`) |

> OIDC setup: Go to your Entra app registration → Certificates & secrets → Federated credentials → Add credential → GitHub Actions.

---

### 2. `frontend.yml` — Frontend Lint and Type Check

**Triggers on:** any push to `main` or PR that changes frontend code.

**What it does:** Runs `npm run lint` and `npm run build` with placeholder env vars. This is a **quality gate** — it catches TypeScript errors, broken imports, and ESLint violations without deploying anything.

**No secrets required.**

---

### 3. `infra.yml` — Package Managed Application

**Triggers on:** any push to `main` that changes files in `infra/`, or manually via "Run workflow".

**What it does:**
1. Compiles `infra/managed-app/mainTemplate.bicep` → `mainTemplate.json` (ARM JSON)
2. Zips `mainTemplate.json` + `createUiDefinition.json` into `managed-app-package.zip`
3. Uploads the zip as a workflow artifact (kept for 30 days)

**Result:** A downloadable zip package. You upload this zip to Azure Partner Center whenever you need to update the Marketplace listing.

**No secrets required.**

---

## One-Time Setup Checklist

These are things you need to do manually before going live. Each item is needed only once.

### Azure Setup

- [ ] **Create ACR**: `az acr create --name securelinkpub --resource-group YOUR_RG --sku Basic --location eastus2`
- [ ] **Create Entra app registration** (multi-tenant):
  - Sign-in audience: "Accounts in any organizational directory"
  - Note the **Application (client) ID** — you'll use this everywhere
  - Add a redirect URI for your Container App URL once deployed
- [ ] **Create service principal for GitHub Actions**:
  ```bash
  az ad sp create-for-rbac --name "securelink-github-actions" --role "AcrPush" \
    --scopes /subscriptions/YOUR_SUB/resourceGroups/YOUR_RG/providers/Microsoft.ContainerRegistry/registries/securelinkpub
  ```
  Configure OIDC federated credentials on this service principal for GitHub Actions.
- [ ] **Create ACR pull token** (for customers to pull images):
  ```bash
  az acr token create --name securelink-pull-ro \
    --registry securelinkpub \
    --scope-map _repositories_pull \
    --output table
  ```
  Save the generated password — you'll embed it in `mainTemplate.bicep`.

### Code Changes Required Before Release

- [ ] **`infra/managed-app/mainTemplate.bicep`**: Replace the three placeholder values:
  - `REPLACE_WITH_YOUR_AZURE_AD_CLIENT_ID` → your Entra app client ID
  - `REPLACE_WITH_YOUR_ACR_LOGIN_SERVER` → `securelinkpub.azurecr.io`
  - `REPLACE_WITH_ACR_PULL_TOKEN_USERNAME` → token username from above step
  - Add the pull token password as a `@secure()` param default or bake it in at Partner Center upload time
- [ ] **`securelink-web/src/lib/authConfig.ts`**: Verify `NEXT_PUBLIC_AZURE_CLIENT_ID` is correct
- [ ] **GitHub repository variables**: Set `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `ACR_NAME`

### Azure Partner Center

- [ ] Enroll in the Microsoft AI Cloud Partner Program (free)
- [ ] Create a new Azure Managed Application offer
- [ ] Upload `managed-app-package.zip` (download from the `infra.yml` workflow artifact)
- [ ] Set pricing: $1 one-time installation + usage-based plan
- [ ] Upload Privacy Policy URL: `https://YOUR_APP_URL/privacy`
- [ ] Upload Terms of Service URL: `https://YOUR_APP_URL/terms`
- [ ] Upload Support URL: `https://github.com/yskarpuz/securelink-support`
- [ ] Create a separate **public** GitHub repository `yskarpuz/securelink-support` for customer issues (see below)

---

## Customer Support

Your main repository (`yskarpuz/secure-link`) is **private** — customers cannot see it and cannot open issues in it.

**Solution: Create a separate public repository for support.**

1. Create `https://github.com/yskarpuz/securelink-support` as a **public** repository
2. Enable Issues on it (the only feature you need)
3. Add a `SUPPORT.md` or `README.md` explaining what information to include in bug reports
4. Customers find this URL in your Marketplace listing and in the app's Support page

This approach is used by many ISVs — the source code stays private but support is public. You get GitHub's full issue management (labels, milestones, assignments) for free.

---

## Releasing a New Version

**What happens when you push to `main`:**
- GitHub Actions builds a new Docker image and pushes it to ACR as `:latest`
- The `infra.yml` action creates a new `managed-app-package.zip` if you changed infra

**What does NOT happen automatically:**
- Existing customer deployments are **not** updated. They continue running whatever image they installed with.

**To update customers:**
1. **Notify them**: Send an email or post in your support repo that a new version is available
2. **They redeploy**: Customers go to their Azure Portal → Resource Groups → find the Managed Application → Redeploy (or delete and reinstall)
3. **Or you push to their Container App**: If you have access to their subscription (Managed Application publishers have limited access by default), you can update the Container App revision via Azure CLI:
   ```bash
   az containerapp update \
     --name securelink-api-CUSTOMERNAME \
     --resource-group CUSTOMER_RG \
     --image securelinkpub.azurecr.io/securelink-api:latest
   ```

> **Note:** ACR Basic tier does not support webhooks for auto-pull. If you upgrade to ACR Standard ($20/month), you can configure webhooks that trigger Container App revision updates automatically. For now, manual notification is the simplest approach.

---

## Project Structure

```
secure-link/
├── SecureLink.Api/          # ASP.NET Core 10 API + serves frontend
│   ├── Controllers/         # API endpoints
│   ├── Dockerfile           # 3-stage build (Node → .NET SDK → .NET runtime)
│   └── Program.cs
├── SecureLink.AppHost/      # .NET Aspire orchestrator (local dev only)
├── SecureLink.ServiceDefaults/ # Shared Aspire defaults (health, OTEL)
├── SecureLink.Tests/        # xUnit integration tests
├── securelink-web/          # Next.js 16 frontend
│   └── src/app/
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       └── support/page.tsx
├── infra/
│   ├── modules/             # Shared Bicep modules (used by both deployments)
│   │   ├── acr.bicep        # Azure Container Registry (publisher only)
│   │   ├── containerApps.bicep
│   │   ├── database.bicep
│   │   ├── monitoring.bicep
│   │   └── storage.bicep
│   ├── managed-app/         # Azure Marketplace package
│   │   ├── createUiDefinition.json  # Installation wizard
│   │   └── mainTemplate.bicep       # Customer deployment template
│   ├── main.bicep           # Publisher's own deployment
│   └── main.bicepparam
└── .github/workflows/
    ├── backend.yml          # Build image → push to ACR
    ├── frontend.yml         # Lint + type check
    └── infra.yml            # Package managed-app zip
```

---

## Estimated Monthly Costs

### Publisher (you pay this)
| Resource | Cost |
|----------|------|
| Azure Container Registry Basic | ~$5/month |
| GitHub Actions | Free (2,000 min/month included) |
| **Total** | **~$5/month** |

### Customer (they pay this, via their own Azure subscription)
| Resource | Estimated Cost |
|----------|---------------|
| Azure Container Apps (Consumption, scale-to-zero) | $0–10/month |
| Azure Database for PostgreSQL Flexible (Burstable B1ms) | ~$12/month |
| Azure Blob Storage | ~$0.02/GB/month |
| Azure Monitor / Log Analytics | ~$2/month |
| **Total** | **~$15–25/month** |
