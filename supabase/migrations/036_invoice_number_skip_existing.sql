-- Keep generated invoice numbers unique even if invoice_sequences falls behind orders.

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
BEGIN
  INSERT INTO public.invoice_sequences (month_start, prefix, next_number, padding)
  VALUES (v_month_start, 'INV_', 1, 3)
  ON CONFLICT (month_start) DO NOTHING;

  SELECT *
  INTO v_sequence
  FROM public.invoice_sequences
  WHERE month_start = v_month_start
  FOR UPDATE;

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
