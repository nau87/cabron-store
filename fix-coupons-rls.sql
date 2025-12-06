-- Arreglar políticas RLS para que los admins puedan ver TODOS los cupones
-- (no solo los activos)

-- 1. Eliminar política antigua restrictiva
DROP POLICY IF EXISTS "Cualquiera puede ver cupones activos" ON coupons;

-- 2. Crear dos políticas de SELECT:
--    a) Usuarios anónimos/autenticados solo ven cupones activos
--    b) Admins ven TODOS los cupones

-- Política: Usuarios normales solo ven cupones activos
CREATE POLICY "Usuarios ven cupones activos"
  ON coupons FOR SELECT
  USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
  );

-- Política: Admins ven TODOS los cupones (activos e inactivos)
CREATE POLICY "Admins ven todos los cupones"
  ON coupons FOR SELECT
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
