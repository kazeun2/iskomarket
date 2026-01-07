# IskoMarket - Quick Start Guide

## 🚀 Get Started in 30 Seconds

Your IskoMarket app is **ready to use right now** with mock data!

### Current Status

```
✅ Running in MOCK MODE
✅ Sample data loaded
✅ All features working
✅ Auto-login enabled
```

### What You Can Do Right Now

1. **Browse Products** - See sample marketplace items
2. **Test Features** - All features work with mock data
3. **Develop UI** - Build and iterate quickly
4. **No Setup Needed** - Everything just works!

---

## 📊 Two Operating Modes

### 🔧 MOCK MODE (Currently Active)

**Perfect for:**
- ✅ Immediate development
- ✅ UI/UX testing
- ✅ Feature development
- ✅ Offline work

**Features:**
- Sample users and products
- Data saved in browser
- No backend required
- Instant startup

**Auto-Login:**
- Email: `maria.santos@cvsu.edu.ph`
- Credit Score: 95
- Iskoins: 1,250

### 🚀 SUPABASE MODE

**Perfect for:**
- ✅ Production deployment
- ✅ Real user data
- ✅ Team collaboration
- ✅ Real-time features

**Setup Time:** ~10 minutes

---

## 🎯 Choose Your Path

### Option A: Keep Using Mock Mode

**You're all set!** No action needed.

```bash
# Just start developing
npm run dev
```

### Option B: Connect to Supabase

**5 Simple Steps:**

#### 1️⃣ Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Click "New Project"
- Wait 2 minutes

#### 2️⃣ Get Credentials
- Settings → API
- Copy URL and anon key

#### 3️⃣ Create .env.local
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

#### 4️⃣ Run Schema
- SQL Editor in Supabase
- Copy contents of `supabase_schema.sql`
- Paste and Run

#### 5️⃣ Restart Server
```bash
npm run dev
```

**See full guide:** [SUPABASE_CONNECTION_GUIDE.md](/SUPABASE_CONNECTION_GUIDE.md)

---

## 📁 Important Files

### Configuration
- `/lib/supabase.ts` - Database connection
- `/lib/mockDatabase.ts` - Mock data service
- `/lib/auth.ts` - Authentication (works in both modes)
- `/.env.example` - Environment template

### Database
- `/supabase_schema.sql` - Database structure
- `/supabase_sample_data.sql` - Sample data
- `/lib/database.types.ts` - TypeScript types

### Services (Auto-detect mode)
- `/lib/services/products.ts`
- `/lib/services/users.ts`
- `/lib/services/messages.ts`
- `/lib/services/notifications.ts`
- `/lib/services/rewards.ts`
- `/lib/services/transactions.ts`
- `/lib/services/categories.ts`

---

## 🔄 Switching Modes

### To Mock Mode:
1. Remove/rename `.env.local`
2. Restart server
3. See: `🔧 Running in MOCK MODE`

### To Supabase Mode:
1. Create `.env.local` with credentials
2. Restart server
3. See: `🚀 Connected to Supabase`

---

## 💻 Mock Mode Details

### Pre-loaded Data

**Users:**
- maria.santos (CS, Score: 95)
- john.reyes (IT, Score: 88)
- admin (Admin account)

**Products:**
- MacBook Pro 2021 (₱45,000)
- Engineering Math Textbook (₱800)
- Wireless Mouse & Keyboard (₱1,200)

**Categories:**
- Electronics 💻
- Books & Notes 📚
- Fashion 👕
- School Supplies ✏️
- Sports & Fitness ⚽
- Food & Snacks 🍕

**Rewards:**
- Custom Title (500 Iskoins)
- Profile Frame (800 Iskoins)
- Glow Effect (1,000 Iskoins)
- Extra Product Slot (300 Iskoins)
- Featured Listing (1,500 Iskoins)

### Data Persistence

All changes are saved to browser localStorage:
- New products you create
- Profile updates
- Iskoin changes
- Transaction history

### Reset to Defaults

```typescript
import { mockDB } from './lib/mockDatabase'
mockDB.reset()
```

Or clear browser localStorage.

---

## 🎨 Development Tips

### 1. Start in Mock Mode
- Develop UI quickly
- Test features
- No network delays

### 2. Test with Supabase
- Before deployment
- Test real-time features
- Verify data persistence

### 3. Use Both
- Mock for development
- Supabase for testing
- Same code works everywhere!

---

## 🔍 How It Works

The app automatically detects which mode to use:

```typescript
// In /lib/supabase.ts
export const IS_MOCK_MODE = !supabaseUrl || !supabaseAnonKey

// Services adapt automatically
if (IS_MOCK_MODE) {
  // Use mockDB
} else {
  // Use Supabase
}
```

**No code changes needed!** Just add/remove `.env.local`.

---

## 🛠️ Troubleshooting

### Console Shows Mock Mode (But I want Supabase)

✅ Check `.env.local` exists  
✅ Verify credentials are correct  
✅ Restart dev server  
✅ Check file is not `.env.local.txt`

### Data Resets After Refresh

✅ Ensure not in incognito mode  
✅ Check localStorage is enabled  
✅ Try different browser

### "Supabase not initialized" Error

✅ Add valid credentials to `.env.local`  
✅ Restart server  
✅ Check Supabase project is active

---

## 📚 Learn More

- **[SUPABASE_CONNECTION_GUIDE.md](/SUPABASE_CONNECTION_GUIDE.md)** - Detailed Supabase setup
- **[SUPABASE_IMPLEMENTATION_GUIDE.md](/SUPABASE_IMPLEMENTATION_GUIDE.md)** - Implementation details
- **[SUPABASE_SETUP_COMPLETE.md](/SUPABASE_SETUP_COMPLETE.md)** - Feature overview

---

## ✅ Checklist

### For Development (Mock Mode)
- [x] App starts immediately
- [x] Sample data loaded
- [x] All features working
- [x] Data persists in browser
- [x] Auto-login enabled

### For Production (Supabase)
- [ ] Supabase project created
- [ ] Credentials added to `.env.local`
- [ ] Schema executed
- [ ] Authentication enabled
- [ ] App tested with real database

---

## 🎉 You're Ready!

**Mock Mode**: Start building right now!  
**Supabase Mode**: Connect when ready for production.

**Questions?** Check the detailed guides in the docs folder.

---

**Happy Coding! 🚀**

---

*Last Updated: December 1, 2024*  
*IskoMarket v2.0 - Dual-Mode Database System*
