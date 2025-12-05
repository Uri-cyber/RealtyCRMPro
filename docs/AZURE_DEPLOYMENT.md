# Azure Deployment Guide

This guide covers deploying RealtyCRM Pro to Microsoft Azure using Azure App Service with Docker containers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Azure Resource Group                         │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Azure          │    │  App Service    │    │   App Service   │  │
│  │  Container      │───▶│  (Production)   │    │   (Staging)     │  │
│  │  Registry       │    │                 │    │                 │  │
│  └─────────────────┘    └────────┬────────┘    └─────────────────┘  │
│                                  │                                   │
│                                  ▼                                   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Azure SQL      │    │   Azure Blob    │    │  Application    │  │
│  │  Database       │    │   Storage       │    │  Insights       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Azure subscription with required permissions
- [Docker](https://docs.docker.com/get-docker/) installed (for local testing)
- GitHub repository with Actions enabled

## Quick Start

### Option 1: Using the Provision Script

```bash
# Login to Azure
az login

# Run the provisioning script
./infrastructure/azure/provision.sh
```

### Option 2: Using Bicep Template

```bash
# Login to Azure
az login

# Create resource group
az group create --name realty-crm-rg --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group realty-crm-rg \
  --template-file infrastructure/azure/main.bicep \
  --parameters sqlAdminPassword='YourSecurePassword123!' \
               jwtSecret='your-super-secret-jwt-key'
```

## Manual Setup

### 1. Create Resource Group

```bash
az group create --name realty-crm-rg --location eastus
```

### 2. Create Azure Container Registry

```bash
az acr create \
  --resource-group realty-crm-rg \
  --name realtycrmpro \
  --sku Basic \
  --admin-enabled true
```

### 3. Create App Service Plan

```bash
az appservice plan create \
  --name realty-crm-plan \
  --resource-group realty-crm-rg \
  --is-linux \
  --sku B2
```

### 4. Create Web App

```bash
az webapp create \
  --resource-group realty-crm-rg \
  --plan realty-crm-plan \
  --name realty-crm-app \
  --deployment-container-image-name realtycrmpro.azurecr.io/realty-crm-pro:latest
```

### 5. Create Azure SQL Database

```bash
# Create SQL Server
az sql server create \
  --name realty-crm-sql \
  --resource-group realty-crm-rg \
  --location eastus \
  --admin-user sqladmin \
  --admin-password 'YourSecurePassword123!'

# Create Database
az sql db create \
  --resource-group realty-crm-rg \
  --server realty-crm-sql \
  --name realtycrm \
  --service-objective S1

# Allow Azure services
az sql server firewall-rule create \
  --resource-group realty-crm-rg \
  --server realty-crm-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 6. Create Storage Account

```bash
az storage account create \
  --name realtycrmstorage \
  --resource-group realty-crm-rg \
  --location eastus \
  --sku Standard_LRS

# Create blob container
az storage container create \
  --name realty-assets \
  --account-name realtycrmstorage
```

### 7. Create Application Insights

```bash
az monitor app-insights component create \
  --app realty-crm-insights \
  --location eastus \
  --resource-group realty-crm-rg \
  --application-type web
```

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CREDENTIALS` | Service principal JSON for Azure authentication |
| `AZURE_ACR_USERNAME` | ACR admin username |
| `AZURE_ACR_PASSWORD` | ACR admin password |

### Creating Azure Credentials

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "realty-crm-github" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/realty-crm-rg \
  --sdk-auth

# Copy the JSON output to AZURE_CREDENTIALS secret
```

### Getting ACR Credentials

```bash
# Get ACR username
az acr credential show --name realtycrmpro --query "username" -o tsv

# Get ACR password
az acr credential show --name realtycrmpro --query "passwords[0].value" -o tsv
```

## Environment Variables

Configure these app settings in Azure Portal or via CLI:

```bash
az webapp config appsettings set \
  --name realty-crm-app \
  --resource-group realty-crm-rg \
  --settings \
    DATABASE_URL="sqlserver://..." \
    JWT_SECRET="your-jwt-secret" \
    AZURE_STORAGE_CONNECTION_STRING="..." \
    AZURE_STORAGE_CONTAINER_NAME="realty-assets" \
    APPLICATIONINSIGHTS_CONNECTION_STRING="..." \
    NODE_ENV="production" \
    WEBSITES_PORT="8080" \
    SENDGRID_API_KEY="your-key" \
    EMAIL_FROM="noreply@yourdomain.com" \
    TWILIO_ACCOUNT_SID="your-sid" \
    TWILIO_AUTH_TOKEN="your-token" \
    TWILIO_PHONE_NUMBER="+15551234567" \
    NEXT_PUBLIC_APP_URL="https://realty-crm-app.azurewebsites.net"
```

## Database Migrations

Run Prisma migrations after deployment:

```bash
# Using Azure Cloud Shell or local with connection string
DATABASE_URL="sqlserver://..." npx prisma migrate deploy
```

Or configure as a startup command:

```bash
az webapp config set \
  --name realty-crm-app \
  --resource-group realty-crm-rg \
  --startup-file "npx prisma migrate deploy && node server.js"
```

## Deployment Workflow

The CI/CD pipeline works as follows:

1. **Push to `main`** → Build & deploy to staging slot
2. **Manual approval** → Swap staging to production
3. **Push to `production`** → Direct deploy to production

### Blue-Green Deployment

The staging slot allows zero-downtime deployments:

```bash
# Manual slot swap
az webapp deployment slot swap \
  --name realty-crm-app \
  --resource-group realty-crm-rg \
  --slot staging \
  --target-slot production
```

## Local Docker Testing

```bash
# Build the image
docker build -t realty-crm-pro .

# Run locally
docker run -p 8080:8080 \
  -e DATABASE_URL="sqlserver://..." \
  -e JWT_SECRET="test-secret" \
  realty-crm-pro
```

## Monitoring

### Application Insights

Access logs and metrics in Azure Portal:
- Live Metrics: Real-time performance
- Failures: Error tracking
- Performance: Response times
- Users: User analytics

### Health Check

The application exposes a health endpoint:

```bash
curl https://realty-crm-app.azurewebsites.net/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "checks": {
    "database": { "status": "up", "latency": 15 },
    "memory": { "status": "ok", "usage": { "heapUsed": 85 } }
  }
}
```

## Scaling

### Vertical Scaling

```bash
az appservice plan update \
  --name realty-crm-plan \
  --resource-group realty-crm-rg \
  --sku P1v2
```

### Horizontal Scaling (Auto-scale)

```bash
az monitor autoscale create \
  --resource-group realty-crm-rg \
  --resource realty-crm-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-rule \
  --min-count 1 \
  --max-count 5 \
  --count 1
```

## Troubleshooting

### View Application Logs

```bash
az webapp log tail \
  --name realty-crm-app \
  --resource-group realty-crm-rg
```

### Container Logs

```bash
az webapp log download \
  --name realty-crm-app \
  --resource-group realty-crm-rg \
  --log-file logs.zip
```

### Common Issues

1. **Container fails to start**: Check `WEBSITES_PORT` is set to `8080`
2. **Database connection fails**: Verify firewall rules allow Azure services
3. **ACR authentication fails**: Ensure admin credentials are correctly configured

## Cost Estimation

| Resource | SKU | Estimated Monthly Cost |
|----------|-----|----------------------|
| App Service Plan | B2 | ~$55 |
| Azure SQL Database | S1 | ~$30 |
| Container Registry | Basic | ~$5 |
| Storage Account | Standard LRS | ~$5 |
| Application Insights | Pay-as-you-go | ~$5-20 |
| **Total** | | **~$100-115/month** |

## Security Best Practices

1. Enable managed identity for App Service
2. Use Key Vault for sensitive configuration
3. Enable HTTPS only
4. Configure custom domain with SSL
5. Enable Azure DDoS protection
6. Regular security scanning with Azure Defender

## Support

For issues with deployment, check:
- Azure Status: https://status.azure.com
- GitHub Actions logs
- Application Insights for runtime errors
