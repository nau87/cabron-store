-- Tabla para almacenar favoritos de usuarios
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Índices
CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_product ON user_favorites(product_id);

-- RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver sus propios favoritos
CREATE POLICY "Usuarios pueden ver sus favoritos"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuarios pueden agregar favoritos
CREATE POLICY "Usuarios pueden agregar favoritos"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuarios pueden eliminar sus favoritos
CREATE POLICY "Usuarios pueden eliminar sus favoritos"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Verificar
SELECT * FROM user_favorites LIMIT 5;
