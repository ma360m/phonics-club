-- Guest checkout + order access tokens + admin order delete

ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token) WHERE access_token IS NOT NULL;

DROP POLICY IF EXISTS "Admins delete orders" ON orders;
CREATE POLICY "Admins delete orders"
  ON orders FOR DELETE USING (is_admin());
