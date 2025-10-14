# 🚀 Quick Reference Card

## 🔑 Admin Access
```
URL: Your app URL (triple-tap logo)
Email: admin@piko.com
Password: admin123
```

## 📋 Admin Tools

### 1️⃣ Auto Process Menu ⭐
**Upload your complete menu**
- Click "Choose JSON File" or paste JSON
- Processes ~350 items with duplicate consolidation
- Real-time progress tracking

### 2️⃣ Session Debugger 🔍
**Monitor your login session**
- Shows session status
- Verifies with server
- Touch to refresh timestamp

### 3️⃣ History Panel 🗄️
**Tab: History**
- View deleted items/categories
- Click "Restore" to bring back
- Click "Delete Forever" to permanently remove

### 4️⃣ Categories Tab 📁
- Add/Edit/Delete categories
- Drag to reorder
- Assign images

### 5️⃣ Items Tab 🍰
- Add/Edit/Delete items
- Drag to reorder
- Manage variants (sizes)
- Upload images

### 6️⃣ Orders Tab 📦
- View customer orders
- Mark as completed

## 🧪 Test Session Persistence

```bash
# Open browser console (F12)

# 1. Login
→ Look for: "💾 Session saved: {...}"

# 2. Refresh page (F5)
→ Look for: "💾 Session loaded from storage"
→ Look for: "✅ Session valid"

# 3. Should stay logged in! ✅
```

## 🐛 Debug Session Issues

```javascript
// In browser console:

// Check if session exists
localStorage.getItem('piko_session')

// View session data
JSON.parse(localStorage.getItem('piko_session'))

// Check timestamp
localStorage.getItem('piko_session_timestamp')

// Should show:
// {
//   access_token: "uuid",
//   user: { email: "admin@piko.com", isAdmin: true }
// }
```

## 📁 Project Structure

```
Essential Admin Components:
✅ AutoProcessMenu.tsx     - Menu uploader
✅ SessionDebugger.tsx     - Session monitor
✅ HistoryPanel.tsx        - Archive system
✅ AdminCategories.tsx     - Category management
✅ AdminItems.tsx          - Item management
✅ AdminOrders.tsx         - Order management
✅ DraggableCategory.tsx   - Reordering
✅ DraggableItem.tsx       - Reordering

Essential Docs:
✅ README.md                      - Main guide
✅ CLEANUP_AND_FIX_SUMMARY.md     - Cleanup details
✅ COMPLETE_FIXES_SUMMARY.md      - All fixes
✅ HISTORY_SYSTEM_GUIDE.md        - Archive guide
✅ SESSION_PERSISTENCE_FIX.md     - Session guide
✅ QUICK_REFERENCE.md             - This card
```

## ⚡ Quick Commands

```bash
# Upload menu
Admin → Auto Process Menu → Choose File → Upload

# Restore deleted item
Admin → History Tab → Find Item → Click Restore

# Check session
Admin → Session Debugger → Verify with Server

# Reorder items
Admin → Items Tab → Drag & Drop

# Add variant
Admin → Items Tab → Edit Item → Add Variant
```

## 🎯 Common Tasks

### Upload Complete Menu:
```
1. Login to admin
2. Go to Auto Process Menu
3. Choose piko_smart_upload.json
4. Click "Process & Upload"
5. Wait for completion ✅
```

### Recover Deleted Item:
```
1. Go to History tab
2. Find the item
3. Click "Restore"
4. Item back in menu ✅
```

### Edit Item Prices:
```
1. Go to Items tab
2. Click "Edit" on item
3. Change price
4. Save ✅
```

### Add Size Variants:
```
1. Edit item
2. Click "Add Variant"
3. Enter size (Small/Medium/Large)
4. Set price
5. Save ✅
```

## 🔧 Settings

### Session Expiry:
```typescript
// File: /lib/sessionManager.ts
const SESSION_EXPIRY_DAYS = 7; // Change this
```

### Cache Duration:
```typescript
// File: /lib/supabase.ts
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

## 📊 Console Messages

### ✅ Good Signs:
```
💾 Session saved: {...}
✅ Session found in memory
💾 Session loaded from storage
✅ Session verified on server
✅ Session valid: admin@piko.com
```

### ⚠️ Warnings (Safe):
```
⚠️ Session verification failed (network error)
⚠️ Server error during verification
```

### ❌ Errors (Action Needed):
```
❌ No session found
❌ Session invalid on server
→ Solution: Login again
```

## 💡 Tips

1. **Session**: Stays active for 7 days
2. **History**: Deleted items never lost
3. **Upload**: Use JSON for bulk import
4. **Images**: Unsplash API (free)
5. **Variants**: Support multiple sizes/prices

## 📞 Help

### Session Not Persisting?
1. Check SessionDebugger
2. Verify localStorage enabled
3. Clear cache and login again

### Items Not Showing?
1. Check category exists
2. Verify category_id
3. Check History tab (might be archived)

### Upload Failing?
1. Verify JSON format
2. Check file size (< 5MB)
3. Try paste JSON instead

---

**Quick Reference v1.0**  
**Last Updated**: October 2025
