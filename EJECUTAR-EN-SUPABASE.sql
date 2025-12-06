-- ========================================
-- EJECUCIÓN DE MIGRACIONES - NEWSLETTER Y FAVORITOS
-- ========================================
-- INSTRUCCIONES:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Copiar y pegar este contenido completo
-- 3. Hacer clic en RUN
-- ========================================

-- MIGRACIÓN 1: Tabla de Newsletter
-- ========================================

-- Tabla para almacenar suscriptores del newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquiera puede insertar (suscribirse)
DROP POLICY IF EXISTS "Cualquiera puede suscribirse" ON newsletter_subscribers;
CREATE POLICY "Cualquiera puede suscribirse"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Policy: Solo admins pueden ver todos los suscriptores
DROP POLICY IF EXISTS "Solo admins pueden ver suscriptores" ON newsletter_subscribers;
CREATE POLICY "Solo admins pueden ver suscriptores"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- MIGRACIÓN 2: Tabla de Favoritos
-- ========================================

-- Tabla para almacenar favoritos de usuarios
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON user_favorites(product_id);

-- RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver sus propios favoritos
DROP POLICY IF EXISTS "Usuarios pueden ver sus favoritos" ON user_favorites;
CREATE POLICY "Usuarios pueden ver sus favoritos"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuarios pueden agregar favoritos
DROP POLICY IF EXISTS "Usuarios pueden agregar favoritos" ON user_favorites;
CREATE POLICY "Usuarios pueden agregar favoritos"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuarios pueden eliminar sus favoritos
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus favoritos" ON user_favorites;
CREATE POLICY "Usuarios pueden eliminar sus favoritos"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT 'Newsletter subscribers table created' as status;
SELECT 'User favorites table created' as status;

-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('newsletter_subscribers', 'user_favorites');
