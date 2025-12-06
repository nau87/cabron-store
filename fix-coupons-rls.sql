-- Arreglar políticas RLS para que los admins puedan ver TODOS los cupones
-- y que usuarios anónimos/autenticados puedan VALIDAR cupones activos

-- 1. Eliminar política antigua restrictiva
DROP POLICY IF EXISTS "Cualquiera puede ver cupones activos" ON coupons;
DROP POLICY IF EXISTS "Usuarios ven cupones activos" ON coupons;

-- 2. Crear política PERMISIVA para usuarios (permite validar cupones)
-- Esta política permite a CUALQUIERA (anon/authenticated) leer cupones activos
CREATE POLICY "Usuarios pueden validar cupones activos"
  ON coupons FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
  );

-- 3. Política: Admins ven TODOS los cupones (activos e inactivos)
DROP POLICY IF EXISTS "Admins ven todos los cupones" ON coupons;
CREATE POLICY "Admins ven todos los cupones"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;
