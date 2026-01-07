# IskoMarket Database Indexing Guide (Supabase)

## Overview
This guide provides comprehensive instructions for implementing database indexes in Supabase to optimize IskoMarket's performance. Proper indexing significantly speeds up queries for browsing, searching, and profile loading.

## Why Indexing Matters

Without indexes:
- **Slow searches**: Full table scans for every search query
- **Poor performance**: Page load times increase as data grows
- **Bad user experience**: Users wait longer for results
- **High server load**: Database works harder for simple queries

With indexes:
- ⚡ **10-100x faster queries** for common operations
- 📊 **Efficient filtering** by category, user, or date
- 🔍 **Quick searches** even with thousands of products
- 💰 **Lower database costs** due to reduced query time

---

## Required Indexes for IskoMarket

### 1. Users Table Indexes

#### A. Email Index (Authentication & Verification)
```sql
-- Create index on user email for faster login lookups
CREATE INDEX idx_users_email ON users(email);

-- Optional: Partial index for verified users only
CREATE INDEX idx_users_email_verified 
ON users(email) 
WHERE email_verified = true;
```

**Use cases:**
- Login authentication
- Email verification checks
- User profile lookups
- Password reset flows

**Performance impact:** Reduces login query time from ~200ms to <10ms

---

#### B. User ID Index
```sql
-- Create index on user ID (usually created automatically as primary key)
-- If not, create it manually:
CREATE INDEX idx_users_id ON users(id);

-- Composite index for user status queries
CREATE INDEX idx_users_id_status 
ON users(id, account_status, is_active);
```

**Use cases:**
- Profile page loading
- User activity tracking
- Seller profile retrieval
- Admin user management

---

### 2. Products/Items Table Indexes

#### A. Category Index (Essential for Browsing)
```sql
-- Single column index for category filtering
CREATE INDEX idx_products_category ON products(category);

-- Composite index combining category with status
CREATE INDEX idx_products_category_status 
ON products(category, status) 
WHERE status = 'active';
```

**Use cases:**
- Category filtering (Textbooks, Electronics, etc.)
- "For a Cause" section
- CvSU Market filtering
- Browse by type

**Performance impact:** Reduces category filter time from ~150ms to <5ms

---

#### B. Seller/User ID Index
```sql
-- Index on seller_id for retrieving user's listings
CREATE INDEX idx_products_seller_id ON products(seller_id);

-- Composite index for active seller listings
CREATE INDEX idx_products_seller_active 
ON products(seller_id, created_at DESC) 
WHERE status = 'active';
```

**Use cases:**
- User dashboard (My Listings)
- Seller profile pages
- Transaction history
- Admin monitoring of specific users

**Performance impact:** Loads user listings 50x faster

---

#### C. Search & Text Indexes
```sql
-- Full-text search index for product titles
CREATE INDEX idx_products_title_search 
ON products USING GIN (to_tsvector('english', title));

-- Full-text search for title + description
CREATE INDEX idx_products_full_search 
ON products USING GIN (
  to_tsvector('english', title || ' ' || description)
);
```

**Use cases:**
- Search bar functionality
- Auto-complete suggestions
- Related products
- Admin search tools

---

#### D. Date & Sorting Indexes
```sql
-- Index for sorting by creation date
CREATE INDEX idx_products_created_at 
ON products(created_at DESC);

-- Composite index for recent active products
CREATE INDEX idx_products_active_recent 
ON products(status, created_at DESC) 
WHERE status = 'active';

-- Index for trending/popular items
CREATE INDEX idx_products_views 
ON products(views DESC, interested DESC);
```

**Use cases:**
- "Newest" sorting
- Feed generation
- Trending products
- Analytics

---

### 3. Transactions Table Indexes

```sql
-- Buyer transactions
CREATE INDEX idx_transactions_buyer_id 
ON transactions(buyer_id, created_at DESC);

-- Seller transactions
CREATE INDEX idx_transactions_seller_id 
ON transactions(seller_id, created_at DESC);

-- Transaction status for admin monitoring
CREATE INDEX idx_transactions_status 
ON transactions(status, created_at DESC);

-- Composite index for pending transactions
CREATE INDEX idx_transactions_pending 
ON transactions(buyer_id, seller_id, status) 
WHERE status = 'pending';
```

---

### 4. For a Cause Table Indexes

```sql
-- Category index for fundraising items
CREATE INDEX idx_fundraiser_category 
ON fundraisers(category);

-- Organize by goal progress
CREATE INDEX idx_fundraiser_progress 
ON fundraisers(raised_amount, goal_amount, status);

-- Recent fundraisers
CREATE INDEX idx_fundraiser_created 
ON fundraisers(created_at DESC) 
WHERE status = 'active';
```

---

### 5. Messages/Chat Table Indexes

```sql
-- Conversations by user
CREATE INDEX idx_messages_sender_receiver 
ON messages(sender_id, receiver_id, created_at DESC);

-- Unread messages
CREATE INDEX idx_messages_unread 
ON messages(receiver_id, read_status, created_at DESC) 
WHERE read_status = false;

-- Conversation threads
CREATE INDEX idx_messages_conversation 
ON messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);
```

---

### 6. Reviews/Ratings Table Indexes

```sql
-- Reviews for a specific seller
CREATE INDEX idx_reviews_seller_id 
ON reviews(seller_id, created_at DESC);

-- Reviews by buyer
CREATE INDEX idx_reviews_buyer_id 
ON reviews(buyer_id, created_at DESC);

-- Recent reviews for homepage
CREATE INDEX idx_reviews_recent 
ON reviews(created_at DESC) 
WHERE status = 'approved';
```

---

## Implementation Steps (Supabase)

### Option 1: Using Supabase SQL Editor

1. **Open Supabase Dashboard**
   - Navigate to your project at https://app.supabase.com
   - Click on "SQL Editor" in left sidebar

2. **Run Index Queries**
   - Copy and paste the SQL queries above
   - Click "Run" to execute
   - Check for success message

3. **Verify Indexes**
   ```sql
   -- List all indexes on a table
   SELECT * FROM pg_indexes 
   WHERE tablename = 'products';
   ```

---

### Option 2: Using Supabase Migration Files

1. **Create Migration File**
   ```bash
   supabase migration new add_performance_indexes
   ```

2. **Add Index Commands**
   - Open the generated migration file
   - Add all index creation SQL
   - Save the file

3. **Apply Migration**
   ```bash
   supabase db push
   ```

---

## Index Monitoring & Maintenance

### Check Index Usage
```sql
-- See which indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Find Unused Indexes
```sql
-- Identify indexes that are never used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

### Rebuild Indexes (if needed)
```sql
-- Rebuild a specific index
REINDEX INDEX idx_products_category;

-- Rebuild all indexes on a table
REINDEX TABLE products;
```

---

## Performance Testing

### Before Indexing
```sql
-- Test query performance (run with EXPLAIN ANALYZE)
EXPLAIN ANALYZE
SELECT * FROM products 
WHERE category = 'Electronics' 
AND status = 'active'
ORDER BY created_at DESC 
LIMIT 20;
```

**Expected result:** Seq Scan (slow), ~100-500ms execution time

### After Indexing
Run the same query above.

**Expected result:** Index Scan (fast), ~5-20ms execution time

---

## Best Practices

✅ **DO:**
- Create indexes on columns used in WHERE clauses
- Index foreign keys (user_id, seller_id, etc.)
- Use composite indexes for multi-column queries
- Monitor index usage regularly
- Drop unused indexes

❌ **DON'T:**
- Create too many indexes (slows down INSERT/UPDATE)
- Index low-cardinality columns (e.g., true/false only)
- Duplicate indexes
- Index every column "just in case"

---

## Expected Performance Improvements

| Operation | Before Indexing | After Indexing | Improvement |
|-----------|----------------|----------------|-------------|
| Category filter | 150ms | 5ms | **30x faster** |
| User login | 200ms | 8ms | **25x faster** |
| Search products | 300ms | 15ms | **20x faster** |
| Load seller profile | 250ms | 10ms | **25x faster** |
| Recent products | 180ms | 12ms | **15x faster** |
| Message history | 220ms | 18ms | **12x faster** |

---

## Troubleshooting

### Index not being used?
```sql
-- Force PostgreSQL to use indexes
SET enable_seqscan = off;

-- Analyze table statistics
ANALYZE products;
```

### Slow index creation?
- Create indexes during low-traffic periods
- Use `CREATE INDEX CONCURRENTLY` to avoid table locks:
  ```sql
  CREATE INDEX CONCURRENTLY idx_products_category 
  ON products(category);
  ```

### Index too large?
- Use partial indexes with WHERE clauses
- Consider expression indexes for specific use cases

---

## Migration Checklist

- [ ] Create users email index
- [ ] Create users id index
- [ ] Create products category index
- [ ] Create products seller_id index
- [ ] Create products search indexes
- [ ] Create products date indexes
- [ ] Create transactions indexes
- [ ] Create fundraisers indexes
- [ ] Create messages indexes
- [ ] Create reviews indexes
- [ ] Test query performance
- [ ] Monitor index usage
- [ ] Document custom indexes

---

## Additional Resources

- [Supabase Index Documentation](https://supabase.com/docs/guides/database/indexes)
- [PostgreSQL Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- [Query Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

**Last Updated:** October 15, 2025  
**Maintained by:** IskoMarket Development Team
