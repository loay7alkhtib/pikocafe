#!/bin/bash

echo "🚀 Setting up Supabase MCP Integration for Piko Café"
echo "=================================================="

# Set PATH
export PATH="$PATH:/Users/loay/Library/Python/3.13/bin:/Users/loay/.local/bin"

# Your Supabase project details
PROJECT_REF="lnpgrvtobvrxzqvtlwzz"
PROJECT_URL="https://lnpgrvtobvrxzqvtlwzz.supabase.co"

echo "📋 Project Details:"
echo "   Project ID: $PROJECT_REF"
echo "   URL: $PROJECT_URL"
echo ""

echo "🔑 Required Credentials:"
echo "   1. Database Password (from Supabase Dashboard > Settings > Database)"
echo "   2. Access Token (from Supabase Dashboard > Settings > API)"
echo ""

# Check if MCP server is installed
if command -v supabase-mcp-server &> /dev/null; then
    echo "✅ Supabase MCP Server is installed"
else
    echo "❌ Supabase MCP Server not found. Installing..."
    pipx install supabase-mcp-server
fi

echo ""
echo "📝 Next Steps:"
echo "   1. Get your database password from:"
echo "      https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
echo "   2. Get your access token from:"
echo "      https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""
echo "   3. Update the environment variables in mcp-config.json:"
echo "      - SUPABASE_DB_PASSWORD"
echo "      - SUPABASE_ACCESS_TOKEN"
echo ""
echo "   4. Test the connection:"
echo "      supabase-mcp-server --help"
echo ""
echo "🎯 Benefits of MCP Integration:"
echo "   ✅ Direct database access from AI tools"
echo "   ✅ Real-time data queries"
echo "   ✅ Schema exploration"
echo "   ✅ SQL execution capabilities"
echo "   ✅ Archive functionality will work perfectly"
echo ""
echo "🔧 Configuration file created: mcp-config.json"
echo "📖 Documentation: https://supabase.com/docs/guides/getting-started/mcp"
