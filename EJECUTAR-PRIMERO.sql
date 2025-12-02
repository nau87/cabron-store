-- ⚠️ EJECUTA ESTE SQL PRIMERO EN SUPABASE ANTES DE CONFIGURAR EL WEBHOOK
-- Ve a: https://supabase.com/dashboard/project/qyajfhfusamfnlzhahyl/sql/new
-- Copia y pega TODO este código y presiona RUN

-- 1. Función para decrementar stock
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - quantity, 0)
  WHERE id = product_id;
END;
$$;

-- 2. Función para incrementar stock (cuando se cancela un pedido)
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET stock = stock + quantity
  WHERE id = product_id;
END;
$$;

-- 3. Agregar columna payment_id a la tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- 4. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- ✅ Listo! Ahora sí puedes configurar el webhook en Mercado Pago
