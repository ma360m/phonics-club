-- Keep the monthly sequence ahead of existing invoices before allocating a number.
-- This repairs databases where the sequence was created after orders were imported.

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_invoice_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', p_invoice_date)::DATE;
  v_sequence public.invoice_sequences%ROWTYPE;
  v_invoice_number TEXT;
  v_next_existing_number INTEGER;
BEGIN
  INSERT INTO public.invoice_sequences (month_start, prefix, next_number, padding)
  VALUES (v_month_start, 'INV_', 1, 3)
  ON CONFLICT (month_start) DO NOTHING;

  SELECT *
  INTO v_sequence
  FROM public.invoice_sequences
  WHERE month_start = v_month_start
  FOR UPDATE;

  SELECT COALESCE(MAX(
    CASE
      WHEN o.invoice_number LIKE v_sequence.prefix || '%'
        AND substring(o.invoice_number FROM length(v_sequence.prefix) + 1) ~ '^[0-9]+$'
      THEN substring(o.invoice_number FROM length(v_sequence.prefix) + 1)::INTEGER
    END
  ), 0) + 1
  INTO v_next_existing_number
  FROM public.orders AS o;

  IF v_sequence.next_number < v_next_existing_number THEN
    UPDATE public.invoice_sequences
    SET next_number = v_next_existing_number,
        updated_at = NOW()
    WHERE id = v_sequence.id
    RETURNING * INTO v_sequence;
  END IF;

  LOOP
    v_invoice_number := v_sequence.prefix || lpad(v_sequence.next_number::TEXT, v_sequence.padding, '0');

    UPDATE public.invoice_sequences
    SET next_number = next_number + 1,
        updated_at = NOW()
    WHERE id = v_sequence.id
    RETURNING * INTO v_sequence;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM public.orders
      WHERE invoice_number = v_invoice_number
    );
  END LOOP;

  RETURN v_invoice_number;
END;
$$;

REVOKE ALL ON FUNCTION public.next_invoice_number(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_invoice_number(DATE) TO service_role;
