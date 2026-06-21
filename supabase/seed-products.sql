-- Run after schema.sql to seed Jolly Phonics product catalog
-- Prices in PKR

-- Clear demo products (optional)
-- DELETE FROM products WHERE metadata->>'currency' = 'PKR';

-- Use the app's seed via admin dashboard, or import from lib/data/jolly-products.ts
-- For bulk import, use Supabase dashboard CSV import with columns:
-- name, slug, description, price, category, images, stock, featured, published

-- Example single insert:
-- INSERT INTO products (name, slug, description, price, category, images, stock, featured, published, metadata)
-- VALUES ('Teacher''s Book (Coloured)', 'teachers-book-coloured', 'Official Jolly Learning product', 1800, 'jolly-phonics', ARRAY['/images/teachers-book-coloured.jpg'], 100, true, true, '{"currency":"PKR"}');
