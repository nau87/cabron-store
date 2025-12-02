-- Script para arreglar las políticas RLS de user_profiles

-- 1. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- 2. Crear políticas simples que funcionen
-- Permitir a cada usuario ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir a cada usuario actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Permitir a cada usuario insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Permitir a cada usuario eliminar su propio perfil
CREATE POLICY "Users can delete own profile"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- 3. Crear política para admins (acceso total)
CREATE POLICY "Admins have full access"
  ON user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 4. Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
