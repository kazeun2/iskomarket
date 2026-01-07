# IskoMarket - Supabase Connection Guide

## 🎯 Overview

IskoMarket is now configured to work in **two modes**:

1. **🔧 MOCK MODE** (Default) - Uses local data for instant development
2. **🚀 SUPABASE MODE** - Connects to real Supabase database

The app automatically detects which mode to use based on environment variables.

---

## ✅ Current Status: MOCK MODE

Your app is currently running in **MOCK MODE** with local data.

### What This Means:

- ✅ App works immediately without any setup
- ✅ All features are functional with mock data
- ✅ Data persists in browser localStorage
- ✅ Perfect for development and testing
- ⚠️ Data is local to your browser (not shared)
- ⚠️ Clearing browser data will reset everything

### Mock Mode Features:

- **Auto-login**: Logs in as `maria.santos@cvsu.edu.ph` automatically
- **Sample Data**: Pre-loaded with users, products, categories
- **Full Functionality**: All features work exactly as they would with real database
- **Data Persistence**: Saved to localStorage between sessions

---

## 🚀 Connect to Real Supabase Database

When you're ready to connect to a real database, follow these steps:

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Configure project:
   ```
   Name: iskomarket
   Database Password: [Generate and save securely]
   Region: Singapore (closest to Philippines)
   ```
5. Wait 2-3 minutes for provisioning

### Step 2: Get Credentials

1. Navigate to **Settings → API** in Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://qdqubdzzolyoucgdfnfi.supabase.co`
   - **anon public key**: Long JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcXViZHp6b2x5b3VjZ2RmbmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzQwMTIsImV4cCI6MjA4MDg1MDAxMn0.ZqvWAL8ACX-ovmQBzkNBmtOJBX22hvDWulo0s0UKJZA`

### Step 3: Create Environment File

Create a file named `.env.local` in your project root:

```bash
# IskoMarket Supabase Configuration
VITE_SUPABASE_URL=https://qdqubdzzolyoucgdfnfi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcXViZHp6b2x5b3VjZ2RmbmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzQwMTIsImV4cCI6MjA4MDg1MDAxMn0.ZqvWAL8ACX-ovmQBzkNBmtOJBX22hvDWulo0s0UKJZA
```

**Important**: 
- Replace with YOUR actual credentials
- Add `.env.local` to `.gitignore` (should already be there)
- Never commit this file to Git

### Step 4: Run Database Schema

1. Open Supabase dashboard → **SQL Editor**
2. Click **"New query"**
3. Copy ALL contents from `/supabase_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** (or press Ctrl/Cmd + Enter)

This creates:
- ✅ 20+ database tables
- ✅ Relationships and constraints
- ✅ Row Level Security (RLS) policies
- ✅ Database functions and triggers
- ✅ Initial categories

### Step 5: (Optional) Load Sample Data

For testing with sample data:

1. In SQL Editor, create **new query**
2. Copy contents from `/supabase_sample_data.sql`
3. Paste and **Run**

This adds:
- Sample users
- Sample products
- Sample rewards
- Test data for all features

### Step 6: Enable Authentication

1. Go to **Authentication → Providers**
2. Enable **"Email"** provider
3. (Optional) Configure email templates
4. (Optional) Enable other providers (Google, etc.)

### Step 7: Restart Development Server

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

You should see in console:
```
🚀 Connected to Supabase - Using real database
```

---

## 🔄 Switching Between Modes

### To Use MOCK MODE:
- Remove or rename `.env.local` file
- Or comment out the environment variables

### To Use SUPABASE MODE:
- Ensure `.env.local` exists with valid credentials
- Restart development server

---

## 📊 Database Structure

### Core Tables

**users**
- User profiles, credit scores, Iskoins
- Student verification data
- Admin flags and suspension status

**products**
- Marketplace listings
- Images, pricing, condition
- View count, interested count

**categories**
- Product categories with icons
- Pre-populated with common categories

**transactions**
- Purchase history
- Transaction status and confirmations
- Meetup details

**conversations & messages**
- Real-time chat system
- Message flagging
- Read receipts

**notifications**
- User notifications
- Real-time updates
- Multiple notification types

**rewards & user_rewards**
- Reward shop items
- Active user rewards
- Expiration tracking

**iskoin_transactions**
- Complete Iskoin history
- Earn/spend tracking
- Transaction reasons

**seasons & user_season_stats**
- Season system
- Score tracking per season
- Historical performance

**credit_score_history**
- Complete credit score changes
- Action tracking
- Violation logging

**for_a_cause_items**
- Charity marketplace items
- Goal tracking
- Supporter count

**cvsu_market_products**
- Official university merchandise
- Stock management
- Category organization

**daily_spins**
- Daily spin tracking
- Spin count management
- History logging

---

## 🔧 Development Workflow

### Recommended Approach:

1. **Start with MOCK MODE**
   - Develop features quickly
   - Test UI/UX without backend setup
   - Iterate rapidly

2. **Connect to Supabase when ready**
   - Set up `.env.local`
   - Run schema
   - Load sample data

3. **Test with real database**
   - Verify all features work
   - Test real-time updates
   - Check data persistence

---

## 🎨 Code Examples

### Checking Current Mode

```typescript
import { IS_MOCK_MODE } from './lib/supabase'

if (IS_MOCK_MODE) {
  console.log('Using mock data')
} else {
  console.log('Using Supabase')
}
```

### Using Mock Database Directly

```typescript
import { mockDB } from './lib/mockDatabase'

// Only in mock mode
if (IS_MOCK_MODE) {
  // Get current user
  const user = mockDB.getCurrentUser()
  
  // Access data
  const products = mockDB.products
  const users = mockDB.users
  
  // Reset to defaults
  mockDB.reset()
}
```

### Authentication (Works in Both Modes)

```typescript
import { signIn, signUp, signOut, getCurrentUser } from './lib/auth'

// Sign in
const { user } = await signIn({
  email: 'test@cvsu.edu.ph',
  password: 'password123'
})

// Get current user
const currentUser = await getCurrentUser()

// Sign out
await signOut()
```

---

## 🔐 Security Features

### Mock Mode:
- Data stored in browser localStorage
- No network requests
- Perfect for development

### Supabase Mode:
- Row Level Security (RLS) enabled
- Users can only access their own data
- Admin-only operations protected
- Secure API keys (never exposed to client)

---

## 📱 Real-Time Features

Only available in **Supabase Mode**:

- Live chat messages
- Real-time notifications
- Transaction updates
- Product view counters

In **Mock Mode**, these features use simulated delays.

---

## 🐛 Troubleshooting

### App won't start after adding .env.local

**Solution**: Check that:
- File is named exactly `.env.local` (not `.env.local.txt`)
- Variables start with `VITE_`
- No spaces around `=` sign
- Restart development server

### "Supabase not initialized" error

**Solution**: 
- Verify credentials in `.env.local`
- Check Supabase project is active
- Restart server after adding credentials

### Mock data is lost after refresh

**Solution**:
- Check browser localStorage isn't disabled
- Ensure not in private/incognito mode
- Try `mockDB.reset()` to reload defaults

### Schema errors when running SQL

**Solution**:
- Run entire schema in one go
- Don't run parts separately
- Make sure project is fully provisioned
- Check for previous tables (drop if needed)

---

## 📚 Service Files Reference

Located in `/lib/services/`:

- **`products.ts`** - Product CRUD, search, filters
- **`users.ts`** - User profiles, Iskoins, credit scores
- **`messages.ts`** - Chat system, conversations
- **`notifications.ts`** - Notification management
- **`rewards.ts`** - Reward shop, redemptions
- **`transactions.ts`** - Transaction processing
- **`categories.ts`** - Product categories

All service files work in **both modes** automatically!

---

## ✨ Benefits of This Setup

### For Development:
- ✅ Start coding immediately
- ✅ No backend setup required
- ✅ Fast iteration
- ✅ Offline development

### For Production:
- ✅ Seamless transition to real database
- ✅ Same code works in both modes
- ✅ Easy testing
- ✅ No code changes needed

---

## 🎯 Next Steps

### Currently in Mock Mode:

1. **Develop features** - Everything works with mock data
2. **Test thoroughly** - All features are functional
3. **Design and iterate** - Fast development cycle

### When Ready for Production:

1. **Create Supabase project** (5 minutes)
2. **Add credentials** (1 minute)
3. **Run schema** (2 minutes)
4. **Deploy** (Ready to go!)

---

## 📖 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Full Schema](/supabase_schema.sql)
- [Sample Data](/supabase_sample_data.sql)
- [Implementation Guide](/SUPABASE_IMPLEMENTATION_GUIDE.md)

---

## 💡 Tips

1. **Use Mock Mode for UI work** - Faster, no network delays
2. **Test with Supabase before deploy** - Verify everything works
3. **Keep `.env.local` secret** - Never commit to Git
4. **Monitor Supabase usage** - Free tier has limits
5. **Backup data regularly** - Export from Supabase dashboard

---

## 🎊 You're All Set!

The app is ready to use in **MOCK MODE** right now, and ready to connect to **SUPABASE** whenever you need it!

**Last Updated**: December 1, 2024  
**Status**: ✅ Dual-Mode Ready (Mock + Supabase)
