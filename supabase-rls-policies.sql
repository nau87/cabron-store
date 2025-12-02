-- Políticas RLS para permitir a admins cancelar pedidos
-- Ejecuta este SQL en Supabase: https://supabase.com/dashboard/project/qyajfhfusamfnlzhahyl/sql/new

-- Habilitar RLS en la tabla orders si no está habilitado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para permitir a todos ver las órdenes (lectura)
CREATE POLICY "Allow read access to orders" ON orders
FOR SELECT
USING (true);

-- Política para permitir actualizar órdenes (para cancelar)
CREATE POLICY "Allow update orders" ON orders
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para insertar órdenes
CREATE POLICY "Allow insert orders" ON orders
FOR INSERT
WITH CHECK (true);

-- Habilitar RLS en products si no está
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Permitir lectura de productos
CREATE POLICY "Allow read products" ON products
FOR SELECT
USING (true);

-- Permitir actualizar productos (para stock)
CREATE POLICY "Allow update products" ON products
FOR UPDATE
USING (true)
WITH CHECK (true);
