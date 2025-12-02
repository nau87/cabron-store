-- Quitar restricción UNIQUE del SKU en product_variants
-- Todas las variantes de un producto deben compartir el mismo SKU

-- 1. Eliminar la restricción UNIQUE si existe
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;

-- 2. Comentario sobre el comportamiento esperado
COMMENT ON COLUMN product_variants.sku IS 'SKU heredado del producto base. Todas las variantes de un mismo producto comparten el mismo SKU';

-- 3. Actualizar variantes existentes para usar el SKU del producto base
UPDATE product_variants pv
SET sku = p.sku
FROM products p
WHERE pv.product_id = p.id
AND (pv.sku IS NULL OR pv.sku != p.sku);

-- Verificación: Mostrar variantes con sus SKUs
SELECT 
  p.name as producto,
  p.sku as sku_producto,
  pv.size as talle,
  pv.sku as sku_variante,
  pv.stock
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
ORDER BY p.name, pv.size;
