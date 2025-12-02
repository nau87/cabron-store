-- Script para sincronizar el stock de productos con sus variantes

-- 1. Verificar estado actual
SELECT 
  p.id,
  p.name,
  p.stock as stock_producto,
  COALESCE(SUM(v.stock), 0) as stock_real_variantes,
  COUNT(v.id) as cantidad_variantes
FROM products p
LEFT JOIN product_variants v ON p.id = v.product_id
GROUP BY p.id, p.name, p.stock
ORDER BY p.name;

-- 2. Actualizar stock de todos los productos basándose en sus variantes
UPDATE products
SET stock = (
  SELECT COALESCE(SUM(stock), 0)
  FROM product_variants
  WHERE product_id = products.id
);

-- 3. Verificar que el trigger existe y está activo
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_product_stock';

-- 4. Si el trigger no existe, recrearlo
CREATE OR REPLACE FUNCTION update_product_stock_on_variant_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el stock del producto principal con la suma de todas las variantes
  UPDATE products
  SET stock = (
    SELECT COALESCE(SUM(stock), 0)
    FROM product_variants
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock ON product_variants;
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_variant_change();

-- 5. Verificar resultado final
SELECT 
  p.id,
  p.name,
  p.stock as stock_actualizado,
  COALESCE(SUM(v.stock), 0) as stock_variantes,
  COUNT(v.id) as num_variantes
FROM products p
LEFT JOIN product_variants v ON p.id = v.product_id
GROUP BY p.id, p.name, p.stock
ORDER BY p.name;
