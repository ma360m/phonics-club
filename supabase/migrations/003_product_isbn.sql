ALTER TABLE products ADD COLUMN IF NOT EXISTS isbn TEXT;
CREATE INDEX IF NOT EXISTS idx_products_isbn ON products(isbn);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
