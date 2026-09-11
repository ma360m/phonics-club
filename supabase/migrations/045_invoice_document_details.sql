-- Optional identifiers captured on admin-only Fast Invoice documents.
-- Apply after 044_admin_invoice_workflow.sql.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS ntn_number TEXT;
