-- ========================================
-- ADDITIONAL SAMPLE DATA FOR TESTING
-- IskoMarket Database
-- ========================================

-- More Sample Users
INSERT INTO users (email, username, program, bio, credit_score, iskoins, rating, total_ratings, successful_purchases) VALUES
  ('sarah.john@cvsu.edu.ph', 'SarahJohn', 'BS Biology', 'Baking for a cause! Supporting classmate''s medical fund.', 92, 140, 4.80, 18, 10),
  ('mark.cruz@cvsu.edu.ph', 'MarkCruz', 'BS Veterinary Medicine', 'Animal lover! All proceeds go to campus pet rescue.', 90, 110, 4.60, 12, 7),
  ('jane.mend@cvsu.edu.ph', 'JaneMend', 'BS Social Work', 'Disaster relief volunteer. Help us help others!', 94, 160, 4.90, 25, 14),
  ('alex.river@cvsu.edu.ph', 'AlexRiver', 'BS Fine Arts', 'Designer supporting scholarship fund. Eco-friendly bags!', 89, 100, 4.70, 16, 9),
  ('carlos.san@cvsu.edu.ph', 'CarlosSan', 'BS Library Science', 'Coffee lover rebuilding our library. Every cup counts!', 91, 130, 4.80, 20, 11),
  ('lisa.chen@cvsu.edu.ph', 'LisaChen', 'BS Psychology', 'Mental health advocate. Handmade bookmarks with love!', 93, 145, 4.90, 22, 13);

-- More Sample Products
INSERT INTO products (seller_id, title, description, price, category_id, condition, location, images, views, interested) VALUES
  (
    (SELECT id FROM users WHERE username = 'SarahJohn'),
    'Organic Chemistry Textbook',
    'Used for Chem 101. Includes solution manual. Minor highlighting.',
    1500,
    (SELECT id FROM categories WHERE name = 'Textbooks'),
    'Good',
    'Gate 1',
    ARRAY['https://images.unsplash.com/photo-1666281269793-da06484657e8'],
    85,
    12
  ),
  (
    (SELECT id FROM users WHERE username = 'MarkCruz'),
    'Scientific Calculator',
    'Casio FX-991EX. Perfect condition. Original box included.',
    800,
    (SELECT id FROM categories WHERE name = 'Electronics'),
    'Like New',
    'Gate 2',
    ARRAY['https://images.unsplash.com/photo-1689857538296-b6e1a392a91d'],
    45,
    8
  ),
  (
    (SELECT id FROM users WHERE username = 'AlexRiver'),
    'Vintage Campus Hoodie',
    'CvSU hoodie from 2020. Size M. Rare design!',
    350,
    (SELECT id FROM categories WHERE name = 'Clothing'),
    'Good',
    'U-Mall Gate',
    ARRAY['https://images.unsplash.com/photo-1702138512461-34b3c1cd60ec'],
    67,
    15
  ),
  (
    (SELECT id FROM users WHERE username = 'LisaChen'),
    'Psychology Starter Pack',
    'Bundle of 3 psychology books + study guides. Great for beginners!',
    2200,
    (SELECT id FROM categories WHERE name = 'Textbooks'),
    'Good',
    'Gate 1',
    ARRAY['https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2'],
    120,
    23
  );

-- Sample Reviews
INSERT INTO reviews (reviewer_id, reviewed_user_id, product_id, rating, comment) VALUES
  (
    (SELECT id FROM users WHERE username = 'PauAngon'),
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM products WHERE title = 'Advanced Calculus Textbook'),
    5,
    'Great seller! Fast response and item was exactly as described.'
  ),
  (
    (SELECT id FROM users WHERE username = 'HazelPerez'),
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM products WHERE title = 'Advanced Calculus Textbook'),
    5,
    'Highly recommended seller!'
  ),
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM users WHERE username = 'PauAngon'),
    (SELECT id FROM products WHERE title = 'Gaming Laptop - ASUS ROG'),
    3,
    'Item was okay but had some scratches not mentioned in description.'
  );

-- Sample Transactions
INSERT INTO transactions (product_id, buyer_id, seller_id, amount, status, meetup_location, meetup_date, buyer_confirmed, seller_confirmed) VALUES
  (
    (SELECT id FROM products WHERE title = 'Advanced Calculus Textbook'),
    (SELECT id FROM users WHERE username = 'PauAngon'),
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    1200,
    'completed',
    'Gate 2',
    NOW() - INTERVAL '5 days',
    true,
    true
  ),
  (
    (SELECT id FROM products WHERE title = 'Scientific Calculator'),
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM users WHERE username = 'MarkCruz'),
    800,
    'pending',
    'Gate 1',
    NOW() + INTERVAL '2 days',
    false,
    false
  );

-- Sample Credit Score History
INSERT INTO credit_score_history (user_id, previous_score, new_score, change_amount, reason, action_type) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    90,
    95,
    5,
    'Successful transaction completed',
    'increase'
  ),
  (
    (SELECT id FROM users WHERE username = 'PauAngon'),
    75,
    72,
    -3,
    'Late response to buyer inquiry',
    'decrease'
  );

-- Sample Conversations
INSERT INTO conversations (participant_1_id, participant_2_id, product_id) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM users WHERE username = 'PauAngon'),
    (SELECT id FROM products WHERE title = 'Gaming Laptop - ASUS ROG')
  ),
  (
    (SELECT id FROM users WHERE username = 'HazelPerez'),
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM products WHERE title = 'Advanced Calculus Textbook')
  );

-- Sample Messages
INSERT INTO messages (conversation_id, sender_id, content, is_read) VALUES
  (
    (SELECT id FROM conversations LIMIT 1),
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    'Hi! Is this still available?',
    true
  ),
  (
    (SELECT id FROM conversations LIMIT 1),
    (SELECT id FROM users WHERE username = 'PauAngon'),
    'Yes! Would you like to meet at Gate 1?',
    true
  );

-- Sample Notifications
INSERT INTO notifications (user_id, type, title, message) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    'message',
    'New Message',
    'You have a new message from PauAngon',
    false
  ),
  (
    (SELECT id FROM users WHERE username = 'PauAngon'),
    'transaction',
    'Transaction Confirmed',
    'Your purchase has been confirmed. Please meet at the scheduled time.',
    false
  ),
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    'review',
    'New Review',
    'You received a 5-star review!',
    false
  );

-- Sample Announcements
INSERT INTO announcements (admin_id, title, message, expiration_date, is_active) VALUES
  (
    (SELECT id FROM users WHERE is_admin = true LIMIT 1),
    'Welcome to IskoMarket!',
    'Thank you for joining IskoMarket, your trusted CvSU student marketplace. Please review our community guidelines before posting.',
    NOW() + INTERVAL '30 days',
    true
  ),
  (
    (SELECT id FROM users WHERE is_admin = true LIMIT 1),
    'Season 1 Starts Now!',
    'The first season of IskoMarket has begun! Build your credit score and earn Iskoins through successful transactions.',
    NOW() + INTERVAL '90 days',
    true
  );

-- Sample Iskoin Transactions
INSERT INTO iskoin_transactions (user_id, amount, type, reason) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    10,
    'earned',
    'Successful sale completed'
  ),
  (
    (SELECT id FROM users WHERE username = 'PauAngon'),
    5,
    'earned',
    'Daily login bonus'
  ),
  (
    (SELECT id FROM users WHERE username = 'HazelPerez'),
    50,
    'spent',
    'Redeemed: Cosmic Profile Frame'
  );

-- Sample Daily Spins
INSERT INTO daily_spins (user_id, spins_remaining, last_spin_date, total_spins_used) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    1,
    CURRENT_DATE,
    15
  ),
  (
    (SELECT id FROM users WHERE username = 'PauAngon'),
    0,
    CURRENT_DATE - INTERVAL '1 day',
    8
  );

-- Sample User Rewards
INSERT INTO user_rewards (user_id, reward_id, activated_at, expires_at, is_active) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM rewards WHERE name = 'Cosmic Frame'),
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  );

-- Sample Reports
INSERT INTO reports (reporter_id, reported_user_id, reported_product_id, reason, description, status) VALUES
  (
    (SELECT id FROM users WHERE username = 'MariaBendo'),
    (SELECT id FROM users WHERE username = 'PauAngon'),
    (SELECT id FROM products WHERE title = 'Gaming Laptop - ASUS ROG'),
    'Misleading product description',
    'The laptop has more scratches than shown in photos',
    'pending'
  );

-- Sample Admin Actions
INSERT INTO admin_actions (admin_id, action_type, target_user_id, reason, details) VALUES
  (
    (SELECT id FROM users WHERE is_admin = true LIMIT 1),
    'post_announcement',
    NULL,
    'Welcome announcement for new users',
    '{"announcement_id": 1, "visibility": "all"}'::jsonb
  );

-- More For a Cause Items
INSERT INTO for_a_cause_items (seller_id, title, description, cause, price, category_id, image_url, organization, goal_amount, raised_amount, supporters) VALUES
  (
    (SELECT id FROM users WHERE username = 'MarkCruz'),
    'Handmade Pet Collars',
    'Custom-made collars for dogs and cats. Supporting local animal shelter.',
    'Rescue and Care for Abandoned Campus Pets',
    150,
    (SELECT id FROM categories WHERE name = 'Others'),
    'https://images.unsplash.com/photo-1506806732259-39c2d0268443',
    'CvSU Animal Welfare Club',
    25000,
    18750,
    52
  ),
  (
    (SELECT id FROM users WHERE username = 'JaneMend'),
    'Relief Goods Package',
    'Essential supplies package for families affected by recent typhoon.',
    'Disaster Relief for Typhoon-Affected Families',
    300,
    (SELECT id FROM categories WHERE name = 'Others'),
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6',
    'CvSU Disaster Response Team',
    100000,
    67500,
    145
  ),
  (
    (SELECT id FROM users WHERE username = 'AlexRiver'),
    'Eco-Friendly Tote Bags',
    'Sustainable canvas bags with student designs. Supporting scholarship fund.',
    'Scholarship Fund for Underprivileged Students',
    120,
    (SELECT id FROM categories WHERE name = 'Others'),
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6',
    'CvSU Student Council',
    75000,
    45800,
    98
  );

-- ========================================
-- HELPER QUERIES FOR TESTING
-- ========================================

-- View all users with their stats
-- SELECT username, credit_score, rating, total_ratings, iskoins, inactive_days FROM users ORDER BY credit_score DESC;

-- View all active products
-- SELECT * FROM active_products;

-- View top rated users
-- SELECT * FROM top_rated_users;

-- View user activity summary
-- SELECT * FROM user_activity_summary;

-- Check notifications for a specific user
-- SELECT * FROM notifications WHERE user_id = (SELECT id FROM users WHERE username = 'MariaBendo') ORDER BY created_at DESC;

-- View all transactions
-- SELECT 
--   t.id,
--   buyer.username as buyer,
--   seller.username as seller,
--   p.title as product,
--   t.amount,
--   t.status,
--   t.created_at
-- FROM transactions t
-- JOIN users buyer ON t.buyer_id = buyer.id
-- JOIN users seller ON t.seller_id = seller.id
-- LEFT JOIN products p ON t.product_id = p.id
-- ORDER BY t.created_at DESC;

-- ========================================
-- DATA CLEANUP FUNCTIONS
-- ========================================

-- Reset all test data (USE WITH CAUTION!)
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS void AS $$
BEGIN
  -- Delete in correct order due to foreign key constraints
  DELETE FROM announcement_dismissals;
  DELETE FROM messages;
  DELETE FROM conversations;
  DELETE FROM reports;
  DELETE FROM admin_actions;
  DELETE FROM user_rewards;
  DELETE FROM daily_spins;
  DELETE FROM iskoin_transactions;
  DELETE FROM notifications;
  DELETE FROM violations;
  DELETE FROM credit_score_history;
  DELETE FROM transactions;
  DELETE FROM reviews;
  DELETE FROM for_a_cause_items;
  DELETE FROM products;
  DELETE FROM announcements;
  DELETE FROM user_season_stats;
  DELETE FROM users WHERE is_admin = false;
  
  RAISE NOTICE 'All test data has been reset!';
END;
$$ LANGUAGE plpgsql;

-- Populate with fresh sample data
CREATE OR REPLACE FUNCTION populate_sample_data()
RETURNS void AS $$
BEGIN
  -- This would re-run the INSERT statements above
  RAISE NOTICE 'Sample data population function - run the INSERT statements manually';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERFORMANCE MONITORING
-- ========================================

-- Check table sizes
CREATE OR REPLACE FUNCTION check_table_sizes()
RETURNS TABLE(table_name TEXT, row_count BIGINT, total_size TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size
  FROM pg_stat_user_tables
  ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Check index usage
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE(
  schema_name TEXT,
  table_name TEXT,
  index_name TEXT,
  index_scans BIGINT,
  rows_read BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT,
    tablename::TEXT,
    indexname::TEXT,
    idx_scan,
    idx_tup_read
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- END OF SAMPLE DATA
-- ========================================
