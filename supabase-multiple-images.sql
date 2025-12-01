-- Modificar tabla products para soportar múltiples imágenes
-- Cambiar image_url de TEXT a TEXT[] (array)

-- Primero, crear una nueva columna temporal
ALTER TABLE products ADD COLUMN images TEXT[];

-- Migrar datos existentes: convertir image_url único en array con un elemento
UPDATE products 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL;

-- Opcional: Eliminar la columna antigua (hacerlo solo después de verificar que todo funciona)
-- ALTER TABLE products DROP COLUMN image_url;

-- Nota: Por compatibilidad, mantenemos image_url y lo actualizamos con la primera imagen del array
-- Esto permite que el código antiguo siga funcionando durante la transición
