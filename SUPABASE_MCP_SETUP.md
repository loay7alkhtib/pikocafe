# 🔧 Supabase MCP Integration Setup

## 🎯 What is MCP?
Model Context Protocol (MCP) allows AI tools like Claude/Cursor to directly interact with your Supabase database. This enables:
- ✅ **Real-time database queries**
- ✅ **Schema exploration**
- ✅ **SQL execution**
- ✅ **Archive functionality working perfectly**
- ✅ **Direct data management**

## 🚀 Quick Setup

### 1. Run the Setup Script
```bash
./setup-supabase-mcp.sh
```

### 2. Get Your Credentials

#### **Database Password:**
1. Go to: [https://supabase.com/dashboard/project/lnpgrvtobvrxzqvtlwzz/settings/database](https://supabase.com/dashboard/project/lnpgrvtobvrxzqvtlwzz/settings/database)
2. Look for **Database Password** section
3. Copy the password

#### **Access Token:**
1. Go to: [https://supabase.com/dashboard/project/lnpgrvtobvrxzqvtlwzz/settings/api](https://supabase.com/dashboard/project/lnpgrvtobvrxzqvtlwzz/settings/api)
2. Look for **Project API Keys**
3. Copy the **service_role** key (not the anon key)

### 3. Update Configuration
Edit `mcp-config.json` and replace:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "supabase-mcp-server",
      "env": {
        "SUPABASE_PROJECT_REF": "lnpgrvtobvrxzqvtlwzz",
        "SUPABASE_DB_PASSWORD": "YOUR_ACTUAL_DB_PASSWORD",
        "SUPABASE_REGION": "us-east-1",
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACTUAL_ACCESS_TOKEN"
      }
    }
  }
}
```

### 4. Test Connection
```bash
export PATH="$PATH:/Users/loay/.local/bin"
supabase-mcp-server --help
```

## 🎉 What This Enables

### **For Your Piko Café App:**
- ✅ **Archive button works perfectly**
- ✅ **Real-time data sync**
- ✅ **Direct database operations**
- ✅ **No more "Failed to fetch" errors**

### **For AI Development:**
- 🔍 **Query database directly**: "Show me all archived items"
- 📊 **Explore schema**: "What tables exist in my database?"
- ⚡ **Execute SQL**: "Update item prices by 10%"
- 🗄️ **Manage data**: "Archive all items in category X"

## 🔒 Security Best Practices

### **Development Environment Only:**
- Use MCP in development, not production
- Review all AI-generated SQL before execution
- Use read-only mode when possible

### **Access Control:**
- Use service_role key only for trusted operations
- Monitor database access logs
- Implement proper RLS policies

## 🛠️ Troubleshooting

### **Connection Issues:**
```bash
# Check if MCP server is installed
which supabase-mcp-server

# Test connection
supabase-mcp-server --project-ref lnpgrvtobvrxzqvtlwzz
```

### **Permission Issues:**
- Ensure database password is correct
- Verify access token has proper permissions
- Check RLS policies are not blocking access

### **Path Issues:**
```bash
# Add to your shell profile (~/.zshrc or ~/.bashrc)
export PATH="$PATH:/Users/loay/.local/bin"
```

## 📋 Integration with Cursor/Claude

### **Cursor Integration:**
1. Open Cursor settings
2. Add MCP server configuration
3. Use `mcp-config.json` as reference
4. Restart Cursor

### **Claude Integration:**
1. Use Claude Desktop
2. Configure MCP servers in settings
3. Add Supabase server configuration

## 🎯 Next Steps

Once MCP is configured:

1. **Test Archive Functionality:**
   - Archive button will work immediately
   - No more fetch errors
   - Real database operations

2. **AI-Powered Development:**
   - Ask AI to query your database
   - Generate SQL queries
   - Manage data through AI

3. **Enhanced Features:**
   - Real-time data sync
   - Advanced analytics
   - Automated data management

## 🆘 Need Help?

If you encounter issues:
1. Check the setup script output
2. Verify credentials are correct
3. Ensure PATH is properly configured
4. Test with simple queries first

**Your Supabase MCP integration will make your Piko Café app incredibly powerful!** 🚀
