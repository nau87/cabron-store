-- Diagnóstico del problema de stock duplicado

-- 1. Ver estado actual del producto CH013
SELECT 
    p.id as product_id, 
    p.name, 
    p.sku, 
    p.stock as product_stock,
    pv.id as variant_id, 
    pv.size, 
    pv.stock as variant_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
WHERE p.sku = 'CH013'
ORDER BY pv.size;

-- 2. Ver el historial de inventario reciente
SELECT 
    ih.created_at,
    ih.change_type,
    ih.quantity_change,
    ih.previous_stock,
    ih.new_stock,
    ih.reason,
    p.sku,
    p.name
FROM inventory_history ih
LEFT JOIN products p ON ih.product_id = p.id
WHERE p.sku = 'CH013'
ORDER BY ih.created_at DESC
LIMIT 10;

-- 3. Ver definición del trigger
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_product_stock_on_variant_change';

-- 4. Ver definición del RPC increment_variant_stock
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'increment_variant_stock';
