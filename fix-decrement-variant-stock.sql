-- Recrear función decrement_variant_stock completa

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Obtener stock actual
  SELECT stock INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id;

  -- Verificar si hay suficiente stock
  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Decrementar el stock
  UPDATE product_variants
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id;

  RETURN TRUE;
END;
$$;
