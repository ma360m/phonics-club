-- Add customer-visible manual payment stages for shop orders.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_submitted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_confirmed';
