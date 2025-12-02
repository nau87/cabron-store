-- Arreglar políticas RLS para que funcionen con user_profiles.role

-- 1. DESHABILITAR RLS temporalmente para poder trabajar
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins have full access" ON user_profiles;

-- 3. VOLVER A HABILITAR RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas simples y funcionales
CREATE POLICY "Enable read access for all users"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on user_id"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

-- 5. Verificar que las políticas se crearon
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_profiles';
