-- ============================================
-- FASE 2: RECREAR FUNCIONES SIMPLES Y ROBUSTAS
-- ============================================

-- ELIMINAR funciones RPC viejas problemáticas
DROP FUNCTION IF EXISTS decrement_variant_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_variant_stock(UUID, INTEGER);
DROP FUNCTION IF EXISTS decrement_stock(UUID, INTEGER);

-- FUNCIÓN 1: Decrementar stock de variante
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE(success BOOLEAN, new_stock INTEGER, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Obtener stock actual con bloqueo para evitar condiciones de carrera
  SELECT stock INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  -- Validar que existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Variante no encontrada';
    RETURN;
  END IF;

  -- Validar stock suficiente
  IF v_current_stock < p_quantity THEN
    RETURN QUERY SELECT FALSE, v_current_stock, 'Stock insuficiente';
    RETURN;
  END IF;

  -- Decrementar stock
  v_new_stock := v_current_stock - p_quantity;
  
  UPDATE product_variants
  SET stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_variant_id;

  -- Retornar éxito
  RETURN QUERY SELECT TRUE, v_new_stock, NULL::TEXT;
END;
$$;

-- FUNCIÓN 2: Incrementar stock de variante (para devoluciones)
CREATE OR REPLACE FUNCTION increment_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE(success BOOLEAN, new_stock INTEGER, error_message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Obtener stock actual
  SELECT stock INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  -- Validar que existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'Variante no encontrada';
    RETURN;
  END IF;

  -- Incrementar stock
  v_new_stock := v_current_stock + p_quantity;
  
  UPDATE product_variants
  SET stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_variant_id;

  -- Retornar éxito
  RETURN QUERY SELECT TRUE, v_new_stock, NULL::TEXT;
END;
$$;

-- MANTENER el trigger que actualiza producto base
-- (Ya existe, solo verificamos que esté bien)
CREATE OR REPLACE FUNCTION update_product_stock_on_variant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar el stock del producto principal con la suma de todas las variantes
  UPDATE products
  SET stock = (
    SELECT COALESCE(SUM(stock), 0)
    FROM product_variants
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recrear trigger si no existe
DROP TRIGGER IF EXISTS on_variant_stock_change ON product_variants;
CREATE TRIGGER on_variant_stock_change
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_variant_change();

-- VERIFICAR que las funciones funcionan
SELECT * FROM decrement_variant_stock(
  (SELECT id FROM product_variants LIMIT 1),
  0
);
