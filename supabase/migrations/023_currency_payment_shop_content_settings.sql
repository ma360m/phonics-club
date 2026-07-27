-- Currency, payment settings, product identifiers/inventory foundations, and requested content cleanup.

CREATE TABLE IF NOT EXISTS currency_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_currency TEXT NOT NULL DEFAULT 'PKR' CHECK (default_currency IN ('PKR', 'USD')),
  usd_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  usd_to_pkr_rate NUMERIC(12,4) NOT NULL DEFAULT 280.50 CHECK (usd_to_pkr_rate BETWEEN 100 AND 600),
  rate_mode TEXT NOT NULL DEFAULT 'manual' CHECK (rate_mode IN ('manual', 'automatic')),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read currency settings" ON currency_settings;
CREATE POLICY "Public read currency settings"
  ON currency_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage currency settings" ON currency_settings;
CREATE POLICY "Admins manage currency settings"
  ON currency_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS currency_settings_updated_at ON currency_settings;
CREATE TRIGGER currency_settings_updated_at BEFORE UPDATE ON currency_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO currency_settings (id, default_currency, usd_enabled, usd_to_pkr_rate, rate_mode)
VALUES (1, 'PKR', TRUE, 280.50, 'manual')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS currency_rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency TEXT NOT NULL DEFAULT 'USD',
  to_currency TEXT NOT NULL DEFAULT 'PKR',
  rate NUMERIC(12,4) NOT NULL CHECK (rate BETWEEN 100 AND 600),
  source_label TEXT NOT NULL DEFAULT 'Manual admin entry',
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_currency_rate_history_created_at
  ON currency_rate_history (created_at DESC);

ALTER TABLE currency_rate_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read currency rate history" ON currency_rate_history;
CREATE POLICY "Admins read currency rate history"
  ON currency_rate_history FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins manage currency rate history" ON currency_rate_history;
CREATE POLICY "Admins manage currency rate history"
  ON currency_rate_history FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TABLE IF NOT EXISTS payment_method_settings (
  method TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  display_name TEXT NOT NULL,
  customer_instructions TEXT NOT NULL DEFAULT '',
  admin_instructions TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 100,
  min_order_amount NUMERIC(12,2),
  max_order_amount NUMERIC(12,2),
  supported_currency TEXT NOT NULL DEFAULT 'PKR',
  availability_country TEXT,
  account_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof_upload_required BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (method IN ('cod', 'bank_transfer', 'jazzcash', 'easypaisa', 'manual_payment', 'card', 'other')),
  CHECK (supported_currency IN ('PKR', 'USD'))
);

CREATE INDEX IF NOT EXISTS idx_payment_method_settings_enabled_sort
  ON payment_method_settings (enabled, sort_order);

ALTER TABLE payment_method_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read enabled payment methods" ON payment_method_settings;
CREATE POLICY "Public read enabled payment methods"
  ON payment_method_settings FOR SELECT
  USING (enabled = TRUE OR is_admin());

DROP POLICY IF EXISTS "Admins manage payment methods" ON payment_method_settings;
CREATE POLICY "Admins manage payment methods"
  ON payment_method_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS payment_method_settings_updated_at ON payment_method_settings;
CREATE TRIGGER payment_method_settings_updated_at BEFORE UPDATE ON payment_method_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO payment_method_settings (
  method,
  enabled,
  display_name,
  customer_instructions,
  admin_instructions,
  sort_order,
  supported_currency,
  proof_upload_required
)
VALUES
  ('cod', TRUE, 'Cash on Delivery', 'Pay when your order is delivered.', '', 10, 'PKR', FALSE),
  ('bank_transfer', TRUE, 'Bank Transfer', 'Transfer to the Phonics Club bank account.', 'Verify uploaded payment receipts before processing the order.', 20, 'PKR', TRUE),
  ('jazzcash', FALSE, 'JazzCash', 'Send payment to the listed JazzCash number.', 'Disabled by default. Enable only when JazzCash payments are active.', 30, 'PKR', TRUE),
  ('easypaisa', FALSE, 'EasyPaisa', 'Send payment to the listed EasyPaisa number.', 'Disabled by default. Enable only when EasyPaisa payments are active.', 40, 'PKR', TRUE)
ON CONFLICT (method) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  customer_instructions = EXCLUDED.customer_instructions,
  admin_instructions = EXCLUDED.admin_instructions,
  sort_order = EXCLUDED.sort_order,
  supported_currency = EXCLUDED.supported_currency,
  proof_upload_required = EXCLUDED.proof_upload_required,
  updated_at = NOW();

ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_currency TEXT DEFAULT 'PKR' CHECK (display_currency IN ('PKR', 'USD'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS exchange_rate_timestamp TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_subtotal NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_shipping_fee NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_discount_amount NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_total NUMERIC(12,2);

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_number TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS alternate_barcode TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 20 CHECK (low_stock_threshold >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_management_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS backorder_policy TEXT NOT NULL DEFAULT 'disabled' CHECK (backorder_policy IN ('disabled', 'enabled', 'enabled_with_warning'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_backorder_quantity INTEGER CHECK (max_backorder_quantity IS NULL OR max_backorder_quantity >= 0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS estimated_availability_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS backorder_message TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_start_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_end_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_badge_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_percentage NUMERIC(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_purchase_quantity INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotional_description TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_number_unique
  ON products (product_number)
  WHERE product_number IS NOT NULL AND product_number <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
  ON products (sku)
  WHERE sku IS NOT NULL AND sku <> '';

CREATE INDEX IF NOT EXISTS idx_products_barcode
  ON products (barcode)
  WHERE barcode IS NOT NULL AND barcode <> '';

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  quantity_changed INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('add_stock', 'remove_stock', 'correction', 'damaged', 'returned', 'received_inventory', 'manual_adjustment')),
  reason TEXT NOT NULL,
  reference_number TEXT,
  supplier TEXT,
  admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_created
  ON inventory_adjustments (product_id, created_at DESC);

ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read inventory adjustments" ON inventory_adjustments;
CREATE POLICY "Admins read inventory adjustments"
  ON inventory_adjustments FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins create inventory adjustments" ON inventory_adjustments;
CREATE POLICY "Admins create inventory adjustments"
  ON inventory_adjustments FOR INSERT
  WITH CHECK (is_admin());

ALTER TABLE courses ADD COLUMN IF NOT EXISTS visibility_status TEXT NOT NULL DEFAULT 'published' CHECK (visibility_status IN ('draft', 'published', 'unlisted', 'archived'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_status TEXT NOT NULL DEFAULT 'open' CHECK (enrollment_status IN ('open', 'closed', 'coming_soon'));
ALTER TABLE courses ADD COLUMN IF NOT EXISTS unlisted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS coming_soon BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE courses
SET
  visibility_status = CASE WHEN published THEN 'published' ELSE 'draft' END,
  enrollment_status = CASE WHEN coming_soon THEN 'coming_soon' ELSE 'open' END
WHERE visibility_status IS NULL OR visibility_status = '';

UPDATE courses
SET
  title = CASE slug
    WHEN 'jolly-phonics-sounds-groups-1-3' THEN 'Children''s Phonics Course - Sound Groups 1-3'
    WHEN 'jolly-phonics-sounds-groups-4-7' THEN 'Children''s Phonics Course - Sound Groups 4-7'
    ELSE title
  END,
  category = 'children-courses',
  category_id = COALESCE(category_id, (SELECT id FROM course_categories WHERE slug = 'children-courses')),
  published = TRUE,
  visibility_status = 'published',
  enrollment_status = 'open',
  archived = FALSE,
  unlisted = FALSE,
  coming_soon = FALSE,
  featured = TRUE
WHERE slug IN ('jolly-phonics-sounds-groups-1-3', 'jolly-phonics-sounds-groups-4-7');

UPDATE blog_posts
SET excerpt = 'Discover effective phonics teaching strategies from one of our early training sessions.'
WHERE slug = 'jolly-phonics-2017-training-video';

UPDATE site_content
SET content = replace(content::text, 'phonics' || 'club@gmail.com', 'phonicscclub@gmail.com')::jsonb
WHERE content::text ILIKE '%' || 'phonics' || 'club@gmail.com' || '%';

UPDATE site_content
SET content =
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(content, '{}'::jsonb),
          '{overview,paragraphs}',
          to_jsonb(ARRAY[
            'Phonics Club Pvt. Ltd. is a registered organization dedicated to advancing literacy through the Synthetic Phonics approach. As the Official Jolly Learning Distributor in Pakistan, Phonics Club provides authentic Jolly Learning resources, professional development, and literacy solutions that empower teachers to help children become confident, independent readers, writers, and spellers.',
            'Since its establishment in 2015, Phonics Club has worked with schools, educators, and institutions across Pakistan and internationally to strengthen English language education through evidence-based literacy practices.',
            'The organization offers professional teacher training, educational consultancy, curriculum development, school support, language assessments, internationally aligned literacy programs, and access to official Jolly Learning teaching materials. Through expert guidance, quality resources, and ongoing support, Phonics Club helps educators create engaging, effective, and successful literacy classrooms.'
          ]::text[]),
          TRUE
        ),
        '{jollyNotice,paragraphs}',
        to_jsonb(ARRAY[
          'As the Official Jolly Learning Distributor in Pakistan, Phonics Club provides authentic Jolly Learning books with all required PCTB approvals and NOCs already secured, ensuring educators have access to fully approved and internationally recognized literacy resources.'
        ]::text[]),
        TRUE
      ),
      '{jollyNotice,notice}',
      to_jsonb(ARRAY[
        'School administrations, distributors, and retailers are strongly advised to purchase only through authorized channels.',
        'Some unauthorized editions have been modified to comply with PCTB requirements and may differ from approved versions.',
        'Phonics Club cannot guarantee the authenticity or quality of books purchased through unauthorized dealers.',
        'Customers who purchased books from Phonics Club before the issuance of NOCs should claim their official QR Code verification stickers.',
        'Approved book lists are also available on the PCTB website.'
      ]::text[]),
      TRUE
    ),
    '{showLearningPath}',
    'false'::jsonb,
    TRUE
  )
WHERE key = 'about_page';

UPDATE site_content
SET content = jsonb_set(
  COALESCE(content, '{}'::jsonb),
  '{overview}',
  to_jsonb(ARRAY[
    'Our research activity focuses on practical classroom implementation: training teachers, observing learners, improving methodology, and using evidence to guide future literacy work.'
  ]::text[]),
  TRUE
)
WHERE key = 'research_page';
