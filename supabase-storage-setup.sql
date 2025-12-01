-- Políticas para el bucket de imágenes de productos
-- Ejecuta esto en el SQL Editor de Supabase

-- Permitir que todos puedan ver las imágenes
CREATE POLICY "Las imágenes son públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Solo admins pueden subir imágenes
CREATE POLICY "Solo admins pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Solo admins pueden eliminar imágenes
CREATE POLICY "Solo admins pueden eliminar imágenes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);
