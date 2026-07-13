-- Invoice numbering settings and low stock alert support

CREATE TABLE IF NOT EXISTS invoice_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_start DATE NOT NULL UNIQUE,
  prefix TEXT NOT NULL DEFAULT 'INV_',
  next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number > 0),
  padding INTEGER NOT NULL DEFAULT 3 CHECK (padding BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read invoice sequences" ON invoice_sequences;
CREATE POLICY "Admins read invoice sequences"
  ON invoice_sequences FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins manage invoice sequences" ON invoice_sequences;
CREATE POLICY "Admins manage invoice sequences"
  ON invoice_sequences FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP TRIGGER IF EXISTS invoice_sequences_updated_at ON invoice_sequences;
CREATE TRIGGER invoice_sequences_updated_at BEFORE UPDATE ON invoice_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION next_invoice_number(p_invoice_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', p_invoice_date)::DATE;
  v_sequence invoice_sequences%ROWTYPE;
  v_invoice_number TEXT;
BEGIN
  INSERT INTO invoice_sequences (month_start, prefix, next_number, padding)
  VALUES (v_month_start, 'INV_', 1, 3)
  ON CONFLICT (month_start) DO NOTHING;

  SELECT *
  INTO v_sequence
  FROM invoice_sequences
  WHERE month_start = v_month_start
  FOR UPDATE;

  v_invoice_number := v_sequence.prefix || lpad(v_sequence.next_number::TEXT, v_sequence.padding, '0');

  UPDATE invoice_sequences
  SET next_number = next_number + 1,
      updated_at = NOW()
  WHERE id = v_sequence.id;

  RETURN v_invoice_number;
END;
$$;

REVOKE ALL ON FUNCTION next_invoice_number(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION next_invoice_number(DATE) TO service_role;

CREATE TABLE IF NOT EXISTS product_stock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  quantity_sold INTEGER NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 20,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_stock_alerts_created_at
  ON product_stock_alerts (created_at DESC);

ALTER TABLE product_stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read product stock alerts" ON product_stock_alerts;
CREATE POLICY "Admins read product stock alerts"
  ON product_stock_alerts FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins manage product stock alerts" ON product_stock_alerts;
CREATE POLICY "Admins manage product stock alerts"
  ON product_stock_alerts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION apply_order_stock_changes(
  p_order_id UUID,
  p_items JSONB,
  p_threshold INTEGER DEFAULT 20
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  previous_stock INTEGER,
  new_stock INTEGER,
  quantity_sold INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_product_name TEXT;
  v_previous_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_product_id := NULLIF(v_item->>'product_id', '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      CONTINUE;
    END;

    v_quantity := GREATEST(COALESCE((v_item->>'quantity')::INTEGER, 0), 0);

    IF v_product_id IS NULL OR v_quantity <= 0 THEN
      CONTINUE;
    END IF;

    SELECT products.name, products.stock
    INTO v_product_name, v_previous_stock
    FROM products
    WHERE products.id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_new_stock := GREATEST(v_previous_stock - v_quantity, 0);

    UPDATE products
    SET stock = v_new_stock,
        updated_at = NOW()
    WHERE products.id = v_product_id;

    IF v_previous_stock >= p_threshold AND v_new_stock < p_threshold THEN
      INSERT INTO product_stock_alerts (
        product_id,
        order_id,
        product_name,
        previous_stock,
        new_stock,
        quantity_sold,
        threshold
      )
      VALUES (
        v_product_id,
        p_order_id,
        v_product_name,
        v_previous_stock,
        v_new_stock,
        v_quantity,
        p_threshold
      );

      product_id := v_product_id;
      product_name := v_product_name;
      previous_stock := v_previous_stock;
      new_stock := v_new_stock;
      quantity_sold := v_quantity;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION apply_order_stock_changes(UUID, JSONB, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_order_stock_changes(UUID, JSONB, INTEGER) TO service_role;

-- Example for admins:
-- To make July 2026 start at INV_025, run:
-- INSERT INTO invoice_sequences (month_start, prefix, next_number, padding)
-- VALUES ('2026-07-01', 'INV_', 25, 3)
-- ON CONFLICT (month_start) DO UPDATE SET
--   prefix = EXCLUDED.prefix,
--   next_number = EXCLUDED.next_number,
--   padding = EXCLUDED.padding,
--   updated_at = NOW();
