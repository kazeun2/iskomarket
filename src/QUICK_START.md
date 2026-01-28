# 🚀 IskoMarket Quick Start Guide

## Get Your Marketplace Running in 15 Minutes!

---

## Step 1: Create Supabase Project (3 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Enter:
   - Project Name: `IskoMarket`
   - Database Password: (create a strong password)
   - Region: `Southeast Asia (Singapore)`
4. Click **"Create new project"**
5. ⏳ Wait 2-3 minutes for setup

---

## Step 2: Setup Database (2 minutes)

1. In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
2. Open the file `ISKOMARKET_SUPABASE_SCHEMA.sql` from this project
3. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
4. **Paste into Supabase SQL Editor** (Ctrl+V)
5. Click the **green "RUN"** button (top right)
6. ✅ You should see: "Success. No rows returned"

**Done!** Your database is ready with all 16 tables! 🎉

---

## Step 3: Configure Email (CHOOSE ONE)

### Option A: SendGrid (Easiest for Testing)

1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier: 100 emails/day)
2. **Verify your email address**
3. **Create an API Key**:
   - Settings → API Keys → Create API Key
   - Name it "IskoMarket"
   - Copy the key (save it!)
4. In Supabase:
   - **Authentication** → **Settings** → **SMTP Settings**
   - Enable Custom SMTP
   - Enter:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [paste your SendGrid API key]
     Sender email: your-email@cvsu.edu.ph (must verify this)
     Sender name: IskoMarket
     ```
5. Click **Save**

### Option B: Skip for Now (Dev Mode)

OTP codes will be shown in browser console during development.

---

## Step 4: Setup Project Locally (5 minutes)

1. **Get Supabase credentials**:
   - In Supabase Dashboard → **Settings** → **API**
   - Copy:
     - **Project URL** (like: `https://xxx.supabase.co`)
     - **anon public key** (long string)

2. **Create environment file**:
   ```bash
   # In your project root
   cp .env.example .env
   ```

3. **Edit .env file**:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_URL=http://localhost:5173
   VITE_EMAIL_FROM=noreply@cvsu.edu.ph
   VITE_EMAIL_DOMAIN=cvsu.edu.ph
   ```

4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```

5. **Open browser**:
   - Go to: `http://localhost:5173`
   - 🎉 You should see IskoMarket!

---

## Step 5: Create Admin Account (3 minutes)

1. **Register a new account**:
   - Click "Sign Up"
   - Use your @cvsu.edu.ph email
   - Enter OTP (check email or console)
   - Complete registration

2. **Make yourself admin**:
   - In Supabase Dashboard
   - Click **"Table Editor"** → **"users"**
   - Find your account
   - Check the **"is_admin"** checkbox
   - Click **Save**

3. **Refresh the page**
   - You should now see **"Admin"** in the navigation
   - Click it to access the admin dashboard! 🎯

---

## Step 6: Test Everything (2 minutes)

### Test Registration
- [ ] Try registering another account
- [ ] Verify OTP email arrives
- [ ] Check you get 50 welcome Iskoins

### Test Product Posting
- [ ] Click "Post Product"
- [ ] Fill in details
- [ ] Upload an image
- [ ] Post it!
- [ ] Verify it appears in marketplace

### Test Admin Features
- [ ] Go to Admin Dashboard
- [ ] Create an announcement
- [ ] Check it appears for users
- [ ] View statistics

### Test Real-time Features
- [ ] Open in two browsers
- [ ] Send a message between accounts
- [ ] Verify real-time delivery

---

## 🎉 You're Done!

Your IskoMarket is now fully functional!

---

## 🚀 Deploy to Production (10 minutes)

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/iskomarket.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click **"New Project"**
   - Import your GitHub repo
   - Click **"Deploy"**
   - ⏳ Wait 2-3 minutes

3. **Add environment variables**:
   - In Vercel project settings
   - **Settings** → **Environment Variables**
   - Add all variables from your `.env` file
   - Click **"Redeploy"**

4. **Done!** 🎉
   - Your site is live at: `https://your-project.vercel.app`
   - Or configure custom domain: `iskomarket.cvsu.edu.ph`

---

## ⚡ Next Steps

### For Students
1. Announce on CVSU Facebook groups
2. Share with student organizations
3. Post on campus bulletin boards
4. Email student body

### For Admins
1. Read `DEPLOYMENT_GUIDE.md` for advanced setup
2. Configure email templates in Supabase
3. Set up monitoring and analytics
4. Create moderation team
5. Start Season 1 competition

### For Developers
1. Read `DATABASE_SCHEMA_README.md` for database details
2. Check `PRODUCTION_READY_CHECKLIST.md` for full features
3. Customize styling and branding
4. Add custom features

---

## 🆘 Troubleshooting

### Issue: "Missing Supabase credentials"
**Fix:** Make sure you created the `.env` file and added your credentials

### Issue: OTP emails not sending
**Fix:** 
- Check SMTP settings in Supabase
- Verify sender email in SendGrid
- Check spam folder
- In development, check browser console for OTP

### Issue: Database errors
**Fix:**
- Make sure you ran the entire SQL schema
- Check Supabase logs for errors
- Verify RLS policies are enabled

### Issue: Can't access admin dashboard
**Fix:**
- Make sure `is_admin` is set to `true` in users table
- Log out and log back in
- Clear browser cache

---

## 📚 Documentation

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Database Documentation:** `DATABASE_SCHEMA_README.md`
- **Production Checklist:** `PRODUCTION_READY_CHECKLIST.md`
- **Database Schema:** `ISKOMARKET_SUPABASE_SCHEMA.sql`

---

## 💬 Support

### Need Help?
- **Supabase Issues:** [discord.supabase.com](https://discord.supabase.com)
- **Email Questions:** Check the deployment guide
- **CVSU IT:** it@cvsu.edu.ph

---

## 🎯 Success!

You now have a fully functional, production-ready marketplace! 

**What you've accomplished:**
- ✅ Created cloud database
- ✅ Configured authentication
- ✅ Set up email system
- ✅ Deployed locally
- ✅ Created admin account
- ✅ Tested all features

**Ready to launch?** Follow the deployment section above! 🚀

---

**Made with ❤️ for CvSU Students**

*Start trading safely today!*
