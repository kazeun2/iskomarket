# IskoMarket Production Deployment Guide

## 🚀 Complete Setup for Public Launch

This guide will walk you through deploying IskoMarket to production with Supabase backend.

---

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- CVSU email server access OR email service (SendGrid/AWS SES)
- Domain name (optional: iskomarket.cvsu.edu.ph)

---

## 1️⃣ Supabase Project Setup

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: IskoMarket
   - **Database Password**: (save this securely!)
   - **Region**: Southeast Asia (Singapore) - closest to Philippines
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 1.2: Execute Database Schema

1. In your Supabase Dashboard, go to **SQL Editor**
2. Open the file `ISKOMARKET_SUPABASE_SCHEMA.sql`
3. Copy the ENTIRE contents
4. Paste into Supabase SQL Editor
5. Click **RUN** button
6. Verify success - you should see "Success. No rows returned"

### Step 1.3: Configure Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create the following buckets:

   **Bucket 1: avatars**
   - Name: `avatars`
   - Public: ✅ Yes
   - File size limit: 2MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

   **Bucket 2: product-images**
   - Name: `product-images`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

   **Bucket 3: report-evidence**
   - Name: `report-evidence`
   - Public: ❌ No (private)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

3. For each bucket, set the storage policy:
   ```sql
   -- For avatars bucket
   CREATE POLICY "Users can upload own avatar"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Anyone can view avatars"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'avatars');

   -- For product-images bucket
   CREATE POLICY "Users can upload product images"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Anyone can view product images"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'product-images');

   <!-- If you encounter client-side upload errors like "new row violates row-level security", run the migration file `migrations/20251218-allow-product-images-storage-upload.sql` or apply equivalent INSERT/SELECT policies that allow authenticated uploads and selects on the `product-images` bucket. -->

**Repairing existing product rows with missing images**

If you have existing product rows with missing or expired image URLs, run the admin script:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/repair_product_images.js
```

This script will attempt to create signed URLs for existing storage objects and update product rows as a temporary repair. For a permanent fix, make the `product-images` bucket public or re-host missing files.


   -- For report-evidence bucket
   CREATE POLICY "Users can upload report evidence"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'report-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

   CREATE POLICY "Users can view own evidence"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'report-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

---

## 2️⃣ Email Configuration (OTP System)

### Option A: Using CVSU Email Server (Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Click **SMTP Settings**
3. Enter CVSU email server details:
   ```
   Host: smtp.cvsu.edu.ph (get from CVSU IT)
   Port: 587 (or 465 for SSL)
   Username: noreply@cvsu.edu.ph
   Password: [contact CVSU IT]
   Sender Email: noreply@cvsu.edu.ph
   Sender Name: IskoMarket
   ```

### Option B: Using SendGrid (Alternative)

1. Create a [SendGrid account](https://sendgrid.com) (free tier: 100 emails/day)
2. Verify a sender email (can use your cvsu.edu.ph)
3. Create an API key
4. In Supabase → **SMTP Settings**:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [your SendGrid API key]
   Sender Email: your-verified-email@cvsu.edu.ph
   Sender Name: IskoMarket
   ```

### Option C: Using AWS SES (Production Scale)

For large-scale deployment (1000+ users):
1. Set up AWS SES
2. Verify cvsu.edu.ph domain
3. Configure in Supabase SMTP settings

### Configure Email Templates

In Supabase → **Authentication** → **Email Templates**, customize:

**Confirm Signup Template:**
```html
<h2>Welcome to IskoMarket!</h2>
<p>Your OTP verification code is:</p>
<h1 style="font-size: 32px; letter-spacing: 4px;">{{ .Token }}</h1>
<p>This code expires in 10 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>
```

**Reset Password Template:**
```html
<h2>Reset Your IskoMarket Password</h2>
<p>Your password reset OTP is:</p>
<h1 style="font-size: 32px; letter-spacing: 4px;">{{ .Token }}</h1>
<p>This code expires in 10 minutes.</p>
```

---

## 3️⃣ Application Configuration

### Step 3.1: Get Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with https://xxx.supabase.co)
   - **anon public** key (long string starting with eyJ...)

### Step 3.2: Configure Environment Variables

1. In your project root, create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your credentials:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

   # Application Configuration
   VITE_APP_NAME=IskoMarket
   VITE_APP_URL=https://iskomarket.cvsu.edu.ph
   VITE_APP_ENV=production

   # Email Configuration
   VITE_EMAIL_FROM=noreply@cvsu.edu.ph
   VITE_EMAIL_DOMAIN=cvsu.edu.ph

   # Feature Flags
   VITE_ENABLE_REGISTRATION=true
   VITE_ENABLE_DAILY_SPIN=true
   VITE_ENABLE_SEASONS=true
   VITE_MAINTENANCE_MODE=false

   # Security
   VITE_MAX_LOGIN_ATTEMPTS=5
   VITE_SESSION_TIMEOUT=86400000

   # File Upload Limits (in MB)
   VITE_MAX_IMAGE_SIZE=5
   VITE_MAX_IMAGES_PER_PRODUCT=5

   # Business Rules
   VITE_MIN_ISKOIN_TRANSACTION=5
   VITE_INACTIVITY_WARNING_DAYS=60
   VITE_INACTIVITY_SUSPENSION_DAYS=90
   VITE_DAILY_SPIN_ISKOIN_REWARD=50
   ```

3. **IMPORTANT**: Never commit `.env` to git! It's already in `.gitignore`

---

## 4️⃣ Test Locally

### Step 4.1: Install Dependencies
```bash
npm install
```

### Step 4.2: Run Development Server
```bash
npm run dev
```

### Step 4.3: Test Critical Features

1. **Registration Flow**
   - Register with a @cvsu.edu.ph email
   - Check email for OTP (8-digit code)
   - Complete registration
   - Verify you receive 50 welcome Iskoins

2. **Authentication**
   - Sign in with created account
   - Sign out
   - Test "Forgot Password" flow

3. **Product Posting**
   - Create a test product
   - Upload images
   - Verify it appears in marketplace

4. **Messaging**
   - Send a message to another user
   - Check real-time updates

5. **Admin Functions** (if you're admin)
   - Access admin dashboard
   - Test moderation features

---

## 5️⃣ Create Admin Account

### Option 1: Via Supabase Dashboard

1. Register a normal account first
2. In Supabase Dashboard, go to **Table Editor** → **users**
3. Find your account row
4. Set `is_admin` to `true`
5. Save

### Option 2: Via SQL

```sql
-- Find user by email
SELECT id, email, username FROM users WHERE email = 'your.email@cvsu.edu.ph';

-- Make user admin
UPDATE users 
SET is_admin = true 
WHERE email = 'your.email@cvsu.edu.ph';
```

---

## 6️⃣ Production Deployment

### Option A: Vercel (Recommended - Easiest)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/iskomarket.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   
6. Add Environment Variables:
   - Click "Environment Variables"
   - Add all variables from your `.env` file
   - ⚠️ Make sure to add them for Production, Preview, and Development

7. Click "Deploy"
8. Wait 2-3 minutes
9. Your site is live! 🎉

### Option B: Netlify

1. Push code to GitHub (same as above)
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub and select repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables in Netlify dashboard
7. Deploy

### Option C: CVSU Server (Self-Hosted)

If deploying on CVSU's own server:

1. Build the project:
   ```bash
   npm run build
   ```

2. The `dist` folder contains your production site

3. Upload to server via FTP/SSH:
   ```bash
   scp -r dist/* user@server:/var/www/iskomarket
   ```

4. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name iskomarket.cvsu.edu.ph;
       root /var/www/iskomarket;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. Enable HTTPS with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d iskomarket.cvsu.edu.ph
   ```

---

## 7️⃣ Post-Deployment Checklist

### Security Checklist
- [ ] RLS policies are enabled on all tables
- [ ] Storage bucket policies are configured
- [ ] SMTP credentials are secure
- [ ] Environment variables are not exposed in code
- [ ] HTTPS is enabled
- [ ] CORS is configured properly in Supabase

### Functionality Checklist
- [ ] Registration works with @cvsu.edu.ph emails
- [ ] OTP emails are delivered within 1 minute
- [ ] Users can post products
- [ ] Image uploads work
- [ ] Chat/messaging works in real-time
- [ ] Admin dashboard is accessible
- [ ] Season system functions correctly
- [ ] Daily spin works
- [ ] Iskoin transactions are logged

### Performance Checklist
- [ ] Database indexes are created (check schema)
- [ ] Images are optimized
- [ ] Lazy loading is implemented
- [ ] API calls are debounced
- [ ] Caching is configured

### Monitoring Setup
- [ ] Enable Supabase logging
- [ ] Set up error tracking (optional: Sentry)
- [ ] Configure analytics (optional: Google Analytics)
- [ ] Monitor database usage in Supabase dashboard

---

## 8️⃣ Maintenance & Monitoring

### Daily Tasks
- Check Supabase Dashboard for errors
- Monitor email delivery rate
- Review reported content
- Check system announcements

### Weekly Tasks
- Review user registrations
- Check database size and performance
- Backup database (Supabase does this automatically)
- Review moderation logs

### Monthly Tasks
- Analyze season leaderboards (REMOVED: leaderboards deprecated on 2025-12-20 - see `migrations/20251220-drop-season-leaderboard.sql`)
- Review Iskoin economy balance
- Update announcements
- Check for inactive users

### Database Backups

Supabase automatically backs up your database daily. To manual backup:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Click **Download Backup**
3. Store securely

---

## 9️⃣ Troubleshooting

### Issue: OTP emails not sending

**Solution:**
1. Check SMTP settings in Supabase
2. Verify sender email is verified
3. Check spam folder
4. Review email template syntax
5. Check Supabase logs for errors

### Issue: Authentication errors

**Solution:**
1. Clear browser localStorage
2. Check RLS policies on users table
3. Verify Supabase URL and key
4. Check browser console for errors

### Issue: Images not uploading

**Solution:**
1. Verify storage buckets exist
2. Check storage policies
3. Verify file size limits
4. Check allowed MIME types

### Issue: Slow performance

**Solution:**
1. Add database indexes (already in schema)
2. Optimize image sizes
3. Implement pagination
4. Use Supabase CDN for images
5. Enable caching

---

## 🔟 Support & Contact

### For Technical Issues:
- Supabase Support: support@supabase.com
- Supabase Discord: https://discord.supabase.com

### For CVSU-Specific Questions:
- Contact CVSU IT Department
- Email: it@cvsu.edu.ph

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

## ✅ Launch Readiness Checklist

Before announcing to students:

- [ ] All features tested thoroughly
- [ ] Admin account created and tested
- [ ] Database schema deployed
- [ ] Email system working (test with multiple emails)
- [ ] Storage buckets configured
- [ ] HTTPS enabled
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] Terms of Service displayed
- [ ] Privacy Policy displayed
- [ ] Contact information visible
- [ ] Announcement system tested
- [ ] Season 1 started
- [ ] Initial moderators assigned
- [ ] Load testing completed (optional)

---

## 🎉 You're Ready to Launch!

Once all items are checked, you're ready to announce IskoMarket to CvSU students!

**Recommended Announcement Channels:**
- CvSU Official Facebook page
- Student organization pages
- CvSU email announcement
- Campus bulletin boards
- Student orientation sessions

**Sample Announcement:**
```
🎉 Introducing IskoMarket! 🎉

The official CvSU student marketplace is now LIVE!

✅ Buy and sell items safely within campus
✅ Verified @cvsu.edu.ph accounts only
✅ Earn Iskoins rewards
✅ Join seasonal competitions
✅ Real-time chat system

Register now at: https://iskomarket.cvsu.edu.ph

#IskoMarket #CvSU #StudentMarketplace
```

Good luck with your launch! 🚀
