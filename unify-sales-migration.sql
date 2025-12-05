-- =============================================
-- MIGRACIÓN: Unificar orders y local_sales en una sola tabla sales
-- =============================================

-- PASO 1: Crear la nueva tabla unificada
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tipo de venta
  sale_type TEXT NOT NULL CHECK (sale_type IN ('online', 'pos')),
  
  -- Número de venta/pedido
  sale_number TEXT NOT NULL,
  
  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  user_id UUID REFERENCES auth.users(id),
  
  -- Dirección de envío (solo para online)
  shipping_address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Items (JSONB)
  items JSONB NOT NULL,
  
  -- Montos
  subtotal DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Información de pago
  payment_method TEXT NOT NULL,
  payment_id TEXT,
  status TEXT DEFAULT 'completed',
  
  -- Usuario admin (para ventas POS)
  admin_user_id UUID REFERENCES auth.users(id),
  
  -- Notas adicionales
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Crear índices
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_sale_type ON sales(sale_type);
CREATE INDEX idx_sales_sale_number ON sales(sale_number);
CREATE INDEX idx_sales_customer_name ON sales(customer_name);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_user_id ON sales(user_id);

-- PASO 3: Migrar datos de local_sales (POS)
INSERT INTO sales (
  sale_type,
  sale_number,
  customer_name,
  customer_email,
  customer_phone,
  user_id,
  items,
  subtotal,
  discount_amount,
  discount_percentage,
  total,
  payment_method,
  admin_user_id,
  notes,
  created_at
)
SELECT
  'pos' as sale_type,
  sale_number,
  customer_name,
  customer_email,
  customer_phone,
  user_id,
  items,
  subtotal,
  discount_amount,
  discount_percentage,
  total,
  payment_method,
  admin_user_id,
  notes,
  created_at
FROM local_sales;

-- PASO 4: Migrar datos de orders (Online)
INSERT INTO sales (
  sale_type,
  sale_number,
  customer_name,
  customer_email,
  customer_phone,
  user_id,
  shipping_address,
  city,
  province,
  postal_code,
  items,
  discount_amount,
  total,
  payment_method,
  payment_id,
  status,
  created_at
)
SELECT
  'online' as sale_type,
  COALESCE(payment_id, 'ORDER-' || id::TEXT) as sale_number,
  customer_name,
  customer_email,
  customer_phone,
  user_id,
  shipping_address,
  city,
  province,
  postal_code,
  items,
  discount_amount,
  total,
  payment_method,
  payment_id,
  status,
  created_at
FROM orders;

-- PASO 5: Configurar RLS (Row Level Security)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy: Admins pueden ver todas las ventas
CREATE POLICY "Admins pueden ver todas las ventas"
  ON sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Usuarios pueden ver sus propios pedidos online
CREATE POLICY "Usuarios pueden ver sus propios pedidos"
  ON sales FOR SELECT
  USING (
    sale_type = 'online' 
    AND user_id = auth.uid()
  );

-- Policy: Admins pueden crear cualquier tipo de venta
CREATE POLICY "Admins pueden crear ventas"
  ON sales FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Sistema puede crear pedidos online (sin auth)
CREATE POLICY "Sistema puede crear pedidos online"
  ON sales FOR INSERT
  WITH CHECK (sale_type = 'online');

-- Policy: Admins pueden actualizar ventas
CREATE POLICY "Admins pueden actualizar ventas"
  ON sales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- PASO 6: Actualizar función para generar número de venta
CREATE OR REPLACE FUNCTION generate_sale_number(p_sale_type TEXT)
RETURNS TEXT AS $$
DECLARE
  last_number INTEGER;
  new_number TEXT;
  prefix TEXT;
BEGIN
  -- Determinar prefijo según tipo
  IF p_sale_type = 'pos' THEN
    prefix := 'SALE-';
  ELSE
    prefix := 'ORDER-';
  END IF;
  
  -- Obtener último número
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
  INTO last_number
  FROM sales
  WHERE sale_number LIKE prefix || '%';
  
  new_number := prefix || LPAD(last_number::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- PASO 7: Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_sales_updated
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_updated_at();

-- PASO 8: Verificar migración
SELECT 
  'Migración completada' as status,
  (SELECT COUNT(*) FROM sales WHERE sale_type = 'pos') as ventas_pos,
  (SELECT COUNT(*) FROM sales WHERE sale_type = 'online') as ventas_online,
  (SELECT COUNT(*) FROM sales) as total_ventas;

-- PASO 9 (OPCIONAL): Una vez verificado que todo funciona, eliminar tablas viejas
-- ADVERTENCIA: No ejecutar hasta verificar que todo el código está actualizado
-- DROP TABLE IF EXISTS local_sales CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
