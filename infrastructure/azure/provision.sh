#!/bin/bash

# RealtyCRM Pro - Azure Infrastructure Provisioning Script
# This script creates all necessary Azure resources for the application

set -e

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-realty-crm-rg}"
LOCATION="${LOCATION:-eastus}"
APP_NAME="${APP_NAME:-realty-crm-app}"
ACR_NAME="${ACR_NAME:-realtycrmpro}"
SQL_SERVER_NAME="${SQL_SERVER_NAME:-realty-crm-sql}"
SQL_DB_NAME="${SQL_DB_NAME:-realtycrm}"
STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME:-realtycrmstorage}"
APP_INSIGHTS_NAME="${APP_INSIGHTS_NAME:-realty-crm-insights}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo_error "Not logged into Azure. Please run 'az login' first."
    exit 1
fi

echo_info "Starting Azure infrastructure provisioning..."
echo_info "Resource Group: $RESOURCE_GROUP"
echo_info "Location: $LOCATION"

# Create Resource Group
echo_info "Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# Create Azure Container Registry
echo_info "Creating Azure Container Registry..."
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output none

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

# Create App Service Plan
echo_info "Creating App Service Plan..."
az appservice plan create \
    --name "${APP_NAME}-plan" \
    --resource-group "$RESOURCE_GROUP" \
    --is-linux \
    --sku B2 \
    --output none

# Create Web App
echo_info "Creating Web App..."
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "${APP_NAME}-plan" \
    --name "$APP_NAME" \
    --deployment-container-image-name "${ACR_NAME}.azurecr.io/realty-crm-pro:latest" \
    --output none

# Configure Web App to use ACR
echo_info "Configuring Web App container settings..."
az webapp config container set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-registry-server-url "https://${ACR_NAME}.azurecr.io" \
    --docker-registry-server-user "$ACR_USERNAME" \
    --docker-registry-server-password "$ACR_PASSWORD" \
    --output none

# Create staging slot
echo_info "Creating staging deployment slot..."
az webapp deployment slot create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot staging \
    --output none

# Create Azure SQL Server
echo_info "Creating Azure SQL Server..."
read -sp "Enter SQL Admin Password: " SQL_PASSWORD
echo ""

az sql server create \
    --name "$SQL_SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --admin-user "sqladmin" \
    --admin-password "$SQL_PASSWORD" \
    --output none

# Create Azure SQL Database
echo_info "Creating Azure SQL Database..."
az sql db create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$SQL_SERVER_NAME" \
    --name "$SQL_DB_NAME" \
    --service-objective S1 \
    --output none

# Configure firewall to allow Azure services
echo_info "Configuring SQL Server firewall..."
az sql server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$SQL_SERVER_NAME" \
    --name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

# Create Storage Account
echo_info "Creating Storage Account..."
az storage account create \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --output none

# Create blob container
echo_info "Creating blob container..."
STORAGE_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT_NAME" --query '[0].value' -o tsv)
az storage container create \
    --name "realty-assets" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_KEY" \
    --output none

# Create Application Insights
echo_info "Creating Application Insights..."
az monitor app-insights component create \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --resource-group "$RESOURCE_GROUP" \
    --application-type web \
    --output none

# Get connection strings and keys
echo_info "Retrieving connection strings..."

SQL_CONNECTION_STRING="sqlserver://${SQL_SERVER_NAME}.database.windows.net:1433;database=${SQL_DB_NAME};user=sqladmin;password=${SQL_PASSWORD};encrypt=true;trustServerCertificate=false"
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string --resource-group "$RESOURCE_GROUP" --name "$STORAGE_ACCOUNT_NAME" -o tsv)
APP_INSIGHTS_KEY=$(az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" --query "connectionString" -o tsv)

# Configure App Settings
echo_info "Configuring application settings..."
az webapp config appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
        DATABASE_URL="$SQL_CONNECTION_STRING" \
        AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
        AZURE_STORAGE_CONTAINER_NAME="realty-assets" \
        APPLICATIONINSIGHTS_CONNECTION_STRING="$APP_INSIGHTS_KEY" \
        NODE_ENV="production" \
        WEBSITES_PORT="8080" \
    --output none

# Configure staging slot settings
echo_info "Configuring staging slot settings..."
az webapp config appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --slot staging \
    --settings \
        DATABASE_URL="$SQL_CONNECTION_STRING" \
        AZURE_STORAGE_CONNECTION_STRING="$STORAGE_CONNECTION_STRING" \
        AZURE_STORAGE_CONTAINER_NAME="realty-assets" \
        APPLICATIONINSIGHTS_CONNECTION_STRING="$APP_INSIGHTS_KEY" \
        NODE_ENV="staging" \
        WEBSITES_PORT="8080" \
    --output none

# Enable continuous deployment
echo_info "Enabling continuous deployment..."
az webapp deployment container config \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --enable-cd true \
    --output none

# Print summary
echo ""
echo_info "=========================================="
echo_info "Infrastructure provisioning complete!"
echo_info "=========================================="
echo ""
echo "Resources created:"
echo "  - Resource Group: $RESOURCE_GROUP"
echo "  - Container Registry: ${ACR_NAME}.azurecr.io"
echo "  - App Service: https://${APP_NAME}.azurewebsites.net"
echo "  - Staging Slot: https://${APP_NAME}-staging.azurewebsites.net"
echo "  - SQL Server: ${SQL_SERVER_NAME}.database.windows.net"
echo "  - SQL Database: $SQL_DB_NAME"
echo "  - Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  - Application Insights: $APP_INSIGHTS_NAME"
echo ""
echo "Next steps:"
echo "  1. Add these secrets to your GitHub repository:"
echo "     - AZURE_CREDENTIALS (service principal JSON)"
echo "     - AZURE_ACR_USERNAME: $ACR_USERNAME"
echo "     - AZURE_ACR_PASSWORD: (saved securely)"
echo "  2. Configure JWT_SECRET in App Settings"
echo "  3. Configure email/SMS provider credentials"
echo "  4. Run database migrations: npx prisma migrate deploy"
echo ""
echo_info "Done!"
