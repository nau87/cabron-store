-- Agregar columna payment_id a la tabla orders
-- Ejecuta este SQL en el SQL Editor de Supabase

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Crear índice para búsquedas rápidas por payment_id
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
