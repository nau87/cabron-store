-- Agregar columna SKU a la tabla products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku TEXT;

-- Crear índice único para SKU (opcional pero recomendado para búsquedas rápidas y evitar duplicados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku 
ON products(sku) 
WHERE sku IS NOT NULL;

-- Comentario sobre la columna
COMMENT ON COLUMN products.sku IS 'Código SKU único del producto (Stock Keeping Unit)';
