-- Función para decrementar el stock de forma atómica
-- Ejecuta este SQL en el SQL Editor de Supabase

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

-- Función para incrementar el stock (al cancelar pedidos)
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
