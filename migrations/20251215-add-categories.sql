-- Add categories table and migrate existing product categories to category_id
BEGIN;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert distinct categories from products into categories (skip empty/null)
INSERT INTO categories (name)
SELECT DISTINCT category FROM products
WHERE category IS NOT NULL AND category <> ''
  AND category NOT IN (SELECT name FROM categories);

-- Add category_id column to products if not exists
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Populate category_id on products by joining on name
UPDATE products
SET category_id = c.id
FROM categories c
WHERE products.category = c.name;

-- OPTIONAL: once you verify migration, you can drop the old products.category column
-- ALTER TABLE products DROP COLUMN IF EXISTS category;

COMMIT;