-- ============================================
-- FASE 1: LIMPIEZA Y PREPARACIÓN
-- ============================================

-- 1. Resetear todos los stocks manualmente
-- Primero verificar stocks actuales
SELECT 
    p.name,
    p.sku,
    p.stock as product_stock,
    pv.size,
    pv.stock as variant_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
ORDER BY p.name, pv.size;

-- 2. Corregir stocks de variantes manualmente (AJUSTA ESTOS VALORES)
-- Ejemplo: Si CHOMBA REEB talle L debe tener 1:
-- UPDATE product_variants SET stock = 1 WHERE sku = 'CHO01' AND size = 'L';

-- 3. Actualizar stocks de productos base (suma de variantes)
UPDATE products p
SET stock = (
    SELECT COALESCE(SUM(pv.stock), 0)
    FROM product_variants pv
    WHERE pv.product_id = p.id
);

-- 4. Verificar que quedó todo bien
SELECT 
    p.name,
    p.sku,
    p.stock as product_total,
    (SELECT SUM(stock) FROM product_variants WHERE product_id = p.id) as variants_sum,
    (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as num_variants
FROM products p
ORDER BY p.name;
