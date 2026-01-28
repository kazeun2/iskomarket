# IskoMarket Database Schema Documentation

## 📊 Overview

This document explains the IskoMarket database structure, relationships, and usage.

---

## 🗂️ Database Tables

### 1. **users** - User Profiles & Accounts

Stores all user account information, gamification data, and status.

**Key Fields:**
- `id` (UUID): Primary key, matches Supabase Auth user ID
- `email` (VARCHAR): CVSU email (@cvsu.edu.ph only)
- `username` (VARCHAR): Unique username
- `program`, `college`: Academic info

Note: `student_number`, `year_level`, `phone_number` and `full_name` were removed from the schema. Use `username` for display names.
- `iskoins`: Virtual currency balance
- `credit_score`: User trustworthiness score (0-100)
- `is_verified`, `is_active`, `is_suspended`: Account status
- `is_admin`, `is_top_buyer`, `is_top_seller`: Special badges
- `season_points`, `current_season`: Competition tracking

**Relationships:**
- One-to-many with products (as seller)
- One-to-many with transactions (as buyer/seller)
- One-to-many with messages
- One-to-many with reviews
- One-to-many with reports

---

### 2. **products** - Marketplace Listings

Stores all product listings in the marketplace.

**Key Fields:**
- `id` (UUID): Primary key
- `seller_id` (UUID): Foreign key to users
- `title`, `description`, `price`: Product details
- `category`, `condition`: Classification
- `images` (JSONB): Array of image URLs
- `location`, `meetup_locations`: Meetup info
- `is_available`, `is_sold`, `is_deleted`: Status flags
- `is_for_cause`: Special "For a Cause" items
- `views`, `interested`: Engagement metrics

**Relationships:**
- Belongs to users (seller)
- One-to-many with transactions
- One-to-many with messages

---

### 3. **transactions** - Purchase Records

Tracks all buying/selling transactions.

**Key Fields:**
- `id` (UUID): Primary key
- `buyer_id`, `seller_id`, `product_id`: Relationship keys
- `amount` (optional): Transaction amount (may be omitted; fall back to product price when absent)
- `status`: pending, confirmed, completed, cancelled, disputed
- `meetup_location`, `meetup_date`: Meetup details
- `meetup_confirmed_by_buyer/seller`: Confirmation flags
- `buyer_rating`, `seller_rating`: Post-transaction ratings
- `iskoins_earned`: Rewards earned from transaction

**Transaction Lifecycle:**
1. **pending**: Buyer initiates purchase
2. **confirmed**: Both parties agree to meetup
3. **completed**: Exchange successful, ratings given
4. **cancelled/disputed**: Issues occurred

**Relationships:**
- Belongs to users (buyer and seller)
- Belongs to products
- One-to-many with messages

---

### 4. **messages** - Chat System

Stores all messages between users.

**Key Fields:**
- `id` (UUID): Primary key
- `sender_id`, `receiver_id`: User relationship
- `message` (TEXT): Message content
- `product_id`, `transaction_id`: Context (optional)
- `is_read`, `read_at`: Read status
- `is_automated`, `automation_type`: System messages

**Automation Types:**
- `meetup_request`: Automated meetup proposals
- `meetup_confirmation`: Confirmed meetup notifications
- `transaction_update`: Status change notifications
- `payment_reminder`: Payment reminders

**Relationships:**
- Belongs to users (sender and receiver)
- May relate to product or transaction

---

### 5. **reviews** - User Ratings

Stores ratings and reviews between users.

**Key Fields:**
- `id` (UUID): Primary key
- `reviewer_id`, `reviewed_user_id`: User relationship
- `transaction_id`: Related transaction
- `rating` (1-5): Star rating
- `comment`: Written review
- `is_visible`, `is_flagged`: Moderation flags

**Rating Impact:**
- Updates user's credit score
- Affects trustworthiness badges
- Influences search ranking

**Relationships:**
- Belongs to users (reviewer and reviewed)
- Belongs to transaction

---

### 6. **reports** - User Reports

Tracks reported content for moderation.

**Key Fields:**
- `id` (UUID): Primary key
- `reporter_id`: User who reported
- `reported_type`: user, product, message, review
- `reported_id`: ID of reported entity
- `reason`: Pre-defined reason category
- `description`: Detailed explanation
- `status`: pending, reviewing, resolved, dismissed
- `action_taken`: warning, suspension, deletion, none

**Report Flow:**
1. User files report
2. Admin reviews (status: reviewing)
3. Action taken or dismissed
4. Status updated to resolved/dismissed

**Relationships:**
- Belongs to users (reporter)
- References reported entity

---

### 7. **notifications** - User Notifications

Stores all user notifications.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id`: Recipient
- `type`: message, transaction, review, report, system, achievement
- `title`, `message`: Notification content
- `related_id`, `related_type`: Context
- `action_url`: Deep link (optional)
- `priority`: low, normal, high, urgent

**Notification Types:**
- **message**: New chat message
- **transaction**: Transaction updates
- **review**: New review received
- **report**: Report status update
- **system**: Platform announcements
- **achievement**: Badges, milestones

**Relationships:**
- Belongs to users

---

### 8. **announcements** - Platform Announcements

System-wide and targeted announcements.

**Key Fields:**
- `id` (UUID): Primary key
- `title`, `message`: Announcement content
- `type`: info, warning, success, error, update
- `target_audience`: all, students, admins, specific_college
- `target_colleges` (JSONB): Array of college codes
- `is_active`, `is_banner`, `is_popup`: Display options
- `start_date`, `end_date`: Display period

**Usage:**
- Platform updates
- Maintenance notices
- Season announcements
- Event promotions
- Security alerts

**Relationships:**
- Created by users (admin)
- Tracked in announcement_views

---

### 9. **seasons** - Competition Seasons

Defines competition periods.

**Key Fields:**
- `id` (SERIAL): Primary key
- `season_number`: Sequential number
- `name`: Season name
- `start_date`, `end_date`: Duration
- `is_active`: Current season flag

**Season Lifecycle:**
1. Create season with dates
2. Set `is_active = true` to start
3. Users compete for points
4. End date reached, calculate rewards
5. Set `is_active = false`
6. Create next season

**Relationships:**
- One-to-many with season_leaderboard

---

### 10. **season_leaderboard** - Season Rankings (REMOVED)

This table was removed from the schema on 2025-12-20 as part of a feature deprecation. Historical leaderboard data has been archived; if you need to restore the table or access historical data, see `migrations/20251220-drop-season-leaderboard.sql` for the backup and restore instructions.

**Note:** Any logic referencing `season_leaderboard` in code was stubbed or removed. Use historical backups for past rankings.
---

### 11. **iskoin_transactions** - Iskoin Ledger

Tracks all Iskoin earnings and spending.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id`: User
- `amount`: Positive (earned) or negative (spent)
- `type`: earned, spent, bonus, spin, redeem, season_lock
- `description`: Transaction description
- `balance_before`, `balance_after`: Audit trail

**Transaction Types:**
- **earned**: From completed transactions
- **spent**: Purchasing rewards
- **bonus**: Welcome bonus, promotions
- **spin**: Daily spin rewards
- **redeem**: Reward redemption
- **season_lock**: Season competition lock
- **season_unlock**: Released after season

**Relationships:**
- Belongs to users

---

### 12. **daily_spins** - Spin Records

Records daily spin results.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id`: User
- `reward_type`: iskoins, discount, badge, nothing
- `reward_amount`: Iskoins or percentage
- `reward_description`: Details

**Spin Rewards:**
- 10 Iskoins (30% chance)
- 25 Iskoins (20% chance)
- 50 Iskoins (10% chance)
- 5% discount (20% chance)
- Better luck next time (20% chance)

**Relationships:**
- Belongs to users

---

### 13. **credit_score_history** - Credit Score Audit

Tracks all credit score changes.

**Key Fields:**
- `id` (UUID): Primary key
- `user_id`: User
- `change_amount`: +/- points
- `reason`: Why score changed
- `score_before`, `score_after`: Audit trail
- `performed_by`: Admin (if manual adjustment)

**Score Factors:**
- Completed transaction: +2
- 5-star review: +3
- 4-star review: +1
- 1-2 star review: -5
- Resolved report against user: -10
- Suspension: -20

**Relationships:**
- Belongs to users
- May belong to admin (performed_by)

---

### 14. **moderation_logs** - Admin Actions

Logs all administrative actions.

**Key Fields:**
- `id` (UUID): Primary key
- `admin_id`: Admin who performed action
- `action_type`: Type of action
- `target_type`: What was affected
- `target_id`: ID of affected entity
- `reason`: Why action was taken

**Action Types:**
- suspend_user
- delete_product
- resolve_report
- ban_user
- hide_content
- adjust_credit_score

**Relationships:**
- Belongs to users (admin)

---

### 15. **otp_verifications** - OTP System

Temporary storage for OTP codes.

**Key Fields:**
- `id` (UUID): Primary key
- `email`: Target email
- `otp_code` (6 digits): Verification code
- `purpose`: registration, password_reset, email_change
- `is_used`, `is_expired`: Status flags
- `expires_at`: Expiration time (10 minutes)
- `attempts`: Failed verification attempts

**OTP Flow:**
1. Generate 8-digit code
2. Store in database with expiry
3. Send email
4. User enters code
5. Verify and mark as used
6. Auto-expire after 10 minutes

**Security:**
- Max 3 attempts per OTP
- Auto-expire after 10 minutes
- Can't reuse OTP
- Rate limiting on generation

---

### 16. **system_settings** - Configuration

Stores platform-wide settings.

**Key Fields:**
- `id` (UUID): Primary key
- `key` (VARCHAR): Setting name
- `value` (JSONB): Setting value
- `description`: What it controls

**Default Settings:**
- `platform_name`: "IskoMarket"
- `maintenance_mode`: false
- `registration_enabled`: true
- `daily_spin_enabled`: true
- `season_enabled`: true
- `max_products_per_user`: 50
- `inactivity_days_warning`: 60
- `inactivity_days_suspension`: 90

**Usage:**
```typescript
// Get setting
const { data } = await supabase
  .from('system_settings')
  .select('value')
  .eq('key', 'maintenance_mode')
  .single()

// Update setting
await supabase
  .from('system_settings')
  .update({ value: true })
  .eq('key', 'maintenance_mode')
```

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with policies:

### User Policies
- ✅ Anyone can view active users
- ✅ Users can update own profile
- ❌ Can't view suspended users

### Product Policies
- ✅ Anyone can view available products
- ✅ Users can create products
- ✅ Sellers can update own products
- ❌ Can't view deleted products

### Transaction Policies
- ✅ Users can view own transactions
- ✅ Buyers can create transactions
- ✅ Both parties can update transaction
- ❌ Can't view others' transactions

### Message Policies
- ✅ Users can view own messages
- ✅ Users can send messages
- ✅ Recipients can mark as read
- ❌ Can't view others' messages

### Admin Policies
- ✅ Admins have full access to moderation
- ✅ Admins can update system settings
- ❌ Regular users can't access admin data

---

## 📈 Database Indexes

All critical queries have indexes:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Product searches
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Transaction history
CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);

-- Message queries
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

---

## 🔄 Database Functions

### calculate_credit_score(user_uuid)

Calculates user's credit score based on:
- Completed transactions
- Reviews received
- Reports against user

```sql
SELECT calculate_credit_score('user-uuid-here');
-- Returns: INTEGER (0-100)
```

### clean_expired_otps()

Marks expired OTPs as expired (run periodically).

```sql
SELECT clean_expired_otps();
```

---

## 📊 Database Views

### active_products_view

Pre-joined view of products with seller info:
```sql
SELECT * FROM active_products_view 
WHERE category = 'Electronics' 
ORDER BY created_at DESC;
```

### user_stats_view

Aggregated user statistics:
```sql
SELECT * FROM user_stats_view 
WHERE credit_score >= 80 
ORDER BY average_rating DESC;
```

---

## 🔄 Triggers

### update_updated_at_column()

Auto-updates `updated_at` timestamp on:
- users
- products
- transactions
- reports
- announcements

---

## 📦 Storage Buckets

### avatars (Public)
- User profile pictures
- Max 2MB per file
- JPEG, PNG, WEBP only

### product-images (Public)
- Product listing images
- Max 5MB per file
- Up to 5 images per product

### report-evidence (Private)
- Report attachments
- Max 10MB per file
- Images and PDFs

---

## 🔧 Maintenance Tasks

### Daily
```sql
-- Clean expired OTPs
SELECT clean_expired_otps();

-- Check inactive users
SELECT username, last_active 
FROM users 
WHERE last_active < NOW() - INTERVAL '60 days';
```

### Weekly
```sql
-- Update user statistics
REFRESH MATERIALIZED VIEW user_stats_view;

-- Archive old notifications
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days' 
AND is_read = true;
```

### Monthly
```sql
-- Backup database (Supabase does this automatically)
-- Review slow queries
-- Optimize indexes if needed
```

---

## 📊 Sample Queries

### Get top sellers this season
```sql
SELECT u.username, sl.total_points, sl.final_rank
FROM season_leaderboard sl
JOIN users u ON sl.user_id = u.id
WHERE sl.season_id = (SELECT id FROM seasons WHERE is_active = true)
ORDER BY sl.total_points DESC
LIMIT 10;
```

### Get user's transaction history
```sql
SELECT 
  t.*,
  p.title as product_title,
  u.username as other_party
FROM transactions t
JOIN products p ON t.product_id = p.id
JOIN users u ON 
  CASE 
    WHEN t.buyer_id = 'user-id' THEN u.id = t.seller_id
    ELSE u.id = t.buyer_id
  END
WHERE t.buyer_id = 'user-id' OR t.seller_id = 'user-id'
ORDER BY t.created_at DESC;
```

### Get unread messages count
```sql
SELECT COUNT(*) as unread_count
FROM messages
WHERE receiver_id = 'user-id' AND is_read = false;
```

---

## 🚨 Important Notes

1. **Never expose service role key** - Only use anon key in frontend
2. **Always validate @cvsu.edu.ph emails** - Only allow CvSU students
3. **Use RLS policies** - Never bypass with service role in client
4. **Sanitize user input** - Prevent SQL injection
5. **Rate limit OTP generation** - Prevent abuse
6. **Monitor database size** - Supabase free tier: 500MB
7. **Archive old data** - Keep database performant

---

## 📚 Additional Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/design)

---

**Last Updated:** December 2024  
**Schema Version:** 1.0.0  
**Database:** PostgreSQL 15 (Supabase)
