-- ISBN unique constraint + Supabase Storage for product images

-- ISBN unique constraint + Supabase Storage for product images

ALTER TABLE products ADD COLUMN IF NOT EXISTS isbn TEXT;

-- Unique ISBN for import upsert (allows multiple NULL ISBNs in Postgres)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_isbn_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_isbn_key UNIQUE (isbn);
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE 'Duplicate ISBNs exist — dedupe before adding unique constraint';
END $$;

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access for product images
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admins can upload/update/delete product images
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
CREATE POLICY "Admins upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
CREATE POLICY "Admins update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;
CREATE POLICY "Admins delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- Helper: upsert products by ISBN (used by import)
CREATE OR REPLACE FUNCTION upsert_product_by_isbn(
  p_isbn TEXT,
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT,
  p_price DECIMAL,
  p_compare_at_price DECIMAL,
  p_category TEXT,
  p_images TEXT[],
  p_stock INTEGER,
  p_featured BOOLEAN,
  p_published BOOLEAN
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO products (
    isbn, name, slug, description, price, compare_at_price,
    category, images, stock, featured, published, metadata
  ) VALUES (
    p_isbn, p_name, p_slug, p_description, p_price, p_compare_at_price,
    p_category, p_images, p_stock, p_featured, p_published,
    jsonb_build_object('currency', 'PKR')
  )
  ON CONFLICT (isbn) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    category = EXCLUDED.category,
    images = EXCLUDED.images,
    stock = EXCLUDED.stock,
    featured = EXCLUDED.featured,
    published = EXCLUDED.published,
    updated_at = NOW()
  RETURNING id INTO result_id;
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
