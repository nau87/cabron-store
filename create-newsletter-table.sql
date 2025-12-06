-- Tabla para almacenar suscriptores del newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquiera puede insertar (suscribirse)
CREATE POLICY "Cualquiera puede suscribirse"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Policy: Solo admins pueden ver todos los suscriptores
CREATE POLICY "Solo admins pueden ver suscriptores"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Verificar
SELECT * FROM newsletter_subscribers LIMIT 5;
