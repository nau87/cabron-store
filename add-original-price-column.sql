-- Agregar columna original_price a la tabla products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Comentario descriptivo
COMMENT ON COLUMN products.original_price IS 'Precio original antes del descuento (opcional) - se muestra tachado si es mayor al precio actual';

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'original_price';
