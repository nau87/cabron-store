-- Agregar tabla de ventas locales (POS)
CREATE TABLE IF NOT EXISTS local_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  user_id UUID REFERENCES auth.users(id),
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  admin_user_id UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_local_sales_created_at ON local_sales(created_at DESC);
CREATE INDEX idx_local_sales_sale_number ON local_sales(sale_number);
CREATE INDEX idx_local_sales_customer_name ON local_sales(customer_name);

-- Habilitar RLS
ALTER TABLE local_sales ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver ventas locales
CREATE POLICY "Solo admins pueden ver ventas locales"
  ON local_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Solo admins pueden crear ventas locales
CREATE POLICY "Solo admins pueden crear ventas locales"
  ON local_sales FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Función para generar número de venta automático
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  last_number INTEGER;
  new_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 6) AS INTEGER)), 0) + 1
  INTO last_number
  FROM local_sales
  WHERE sale_number LIKE 'SALE-%';
  
  new_number := 'SALE-' || LPAD(last_number::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock cuando se hace una venta local
CREATE OR REPLACE FUNCTION update_stock_on_local_sale()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    UPDATE products
    SET stock = stock - (item->>'quantity')::INTEGER
    WHERE id = (item->>'product_id')::UUID;
    
    -- Registrar en historial de inventario
    INSERT INTO inventory_history (
      product_id,
      user_id,
      change_amount,
      previous_stock,
      new_stock,
      reason
    )
    SELECT
      (item->>'product_id')::UUID,
      NEW.admin_user_id,
      -(item->>'quantity')::INTEGER,
      stock + (item->>'quantity')::INTEGER,
      stock,
      'Venta local #' || NEW.sale_number
    FROM products
    WHERE id = (item->>'product_id')::UUID;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_local_sale_created
  AFTER INSERT ON local_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_local_sale();
