# 🚀 Quick Supabase Setup for Piko Café

## Your Supabase Project:
- **URL**: https://lnpgrvtobvrxzqvtlwzz.supabase.co
- **Project ID**: lnpgrvtobvrxzqvtlwzz

## ⚡ Quick Setup Steps:

### 1. Get Your API Key (2 minutes)
1. Go to: https://supabase.com/dashboard/project/lnpgrvtobvrxzqvtlwzz
2. Click: **Settings** → **API**
3. Copy: **anon/public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 2. Create Environment File (1 minute)
Create `.env.local` in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://lnpgrvtobvrxzqvtlwzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_YOUR_ANON_KEY_HERE
NEXT_PUBLIC_SUPABASE_PROJECT_ID=lnpgrvtobvrxzqvtlwzz
```

### 3. Set Up Database (3 minutes)
1. Go to: https://supabase.com/dashboard/project/lnpgrvtobvrxzqvtlwzz/sql
2. Copy the entire content from `setup_database.sql`
3. Paste and run it in the SQL Editor
4. You should see: "Categories created: 3" and "Items created: 3"

### 4. Test the Connection (1 minute)
```bash
npm run dev
```

Visit your app and check browser console for:
```
🔧 Supabase Config: { projectId: "lnpgrvtobvrxzqvtlwzz", hasAnonKey: true }
```

## 🎉 That's It!

Your archive button will now work perfectly! 

## 🔍 Troubleshooting:
- **"Failed to fetch"**: Check your API key is correct
- **No data showing**: Make sure you ran the SQL script
- **Permission errors**: Check that RLS policies were created

## 📞 Need Help?
Just share your anon key and I'll help you complete the setup!
