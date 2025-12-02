-- Políticas RLS para local_sales e inventory_history

-- =======================
-- TABLA: local_sales
-- =======================

-- Habilitar RLS si no está habilitado
ALTER TABLE local_sales ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow all operations on local_sales" ON local_sales;
DROP POLICY IF EXISTS "Allow insert local_sales" ON local_sales;
DROP POLICY IF EXISTS "Allow select local_sales" ON local_sales;
DROP POLICY IF EXISTS "Allow update local_sales" ON local_sales;

-- Crear políticas permisivas para todas las operaciones
CREATE POLICY "Allow all operations on local_sales"
  ON local_sales
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =======================
-- TABLA: inventory_history
-- =======================

-- Habilitar RLS si no está habilitado
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Allow all operations on inventory_history" ON inventory_history;
DROP POLICY IF EXISTS "Allow insert inventory_history" ON inventory_history;
DROP POLICY IF EXISTS "Allow select inventory_history" ON inventory_history;
DROP POLICY IF EXISTS "Solo admins pueden ver historial de inventario" ON inventory_history;

-- Crear políticas permisivas para todas las operaciones
CREATE POLICY "Allow all operations on inventory_history"
  ON inventory_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
