-- =============================================
-- Script para identificar imágenes huérfanas en storage
-- =============================================
-- Este script te ayudará a encontrar qué imágenes están en el array
-- para que puedas limpiarlas manualmente desde el Storage UI de Supabase

-- PASO 1: Ver todas las imágenes que SÍ están en uso
SELECT 
  p.id,
  p.name,
  p.sku,
  p.image_url as imagen_principal,
  p.images as array_imagenes,
  array_length(p.images, 1) as cantidad_imagenes
FROM products p
ORDER BY p.created_at DESC;

-- PASO 2: Extraer todas las URLs únicas en uso
SELECT DISTINCT 
  unnest(p.images) as image_url
FROM products p
WHERE p.images IS NOT NULL
ORDER BY image_url;

-- PASO 3: Contar imágenes por producto
SELECT 
  p.name,
  p.sku,
  COALESCE(array_length(p.images, 1), 0) as cantidad_imagenes
FROM products p
ORDER BY cantidad_imagenes DESC;

-- PASO 4: Productos con más de 3 imágenes (no debería haber ninguno)
SELECT 
  p.id,
  p.name,
  p.sku,
  array_length(p.images, 1) as cantidad_imagenes,
  p.images
FROM products p
WHERE array_length(p.images, 1) > 3;

-- =============================================
-- INSTRUCCIONES PARA LIMPIAR STORAGE MANUALMENTE:
-- =============================================
-- 1. Ejecuta PASO 2 y copia todas las URLs/filenames que SÍ están en uso
-- 2. Ve a Supabase Dashboard → Storage → product-images
-- 3. Compara los archivos en storage con la lista del PASO 2
-- 4. ELIMINA manualmente los archivos que NO están en la lista
-- 
-- ALTERNATIVA (más seguro):
-- 1. Descarga todos los archivos del storage como backup
-- 2. Ejecuta PASO 2 y guarda la lista
-- 3. Elimina TODOS los archivos del storage
-- 4. Los productos seguirán teniendo las URLs en la BD
-- 5. La próxima vez que edites cada producto, las imágenes se re-subirán
--
-- NOTA: A partir de ahora, el código automáticamente eliminará
-- las imágenes viejas cuando edites productos, así que este problema
-- no debería volver a ocurrir.
-- =============================================
