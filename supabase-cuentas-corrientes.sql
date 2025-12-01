-- Sistema de Cuentas Corrientes para Clientes

-- Tabla para transacciones de cuenta corriente
CREATE TABLE IF NOT EXISTS customer_account_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'sale' (compra) o 'payment' (pago)
  amount DECIMAL(10, 2) NOT NULL, -- Positivo para ventas, negativo para pagos
  description TEXT,
  sale_id UUID REFERENCES local_sales(id), -- Si es una venta
  payment_method TEXT, -- Si es un pago: efectivo, transferencia, etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- Usuario admin que registró
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_customer_account_customer_id 
ON customer_account_transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_account_created_at 
ON customer_account_transactions(created_at DESC);

-- Vista para calcular saldo por cliente
CREATE OR REPLACE VIEW customer_balances AS
SELECT 
  u.id as customer_id,
  up.full_name,
  up.email,
  COALESCE(SUM(cat.amount), 0) as balance
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
LEFT JOIN customer_account_transactions cat ON u.id = cat.customer_id
WHERE up.role = 'customer'
GROUP BY u.id, up.full_name, up.email;

-- Función para registrar venta en cuenta corriente
CREATE OR REPLACE FUNCTION register_sale_to_account(
  p_customer_id UUID,
  p_sale_id UUID,
  p_amount DECIMAL,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO customer_account_transactions (
    customer_id,
    type,
    amount,
    description,
    sale_id,
    created_by
  ) VALUES (
    p_customer_id,
    'sale',
    p_amount,
    'Venta local - ' || p_sale_id,
    p_sale_id,
    p_admin_id
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar pago
CREATE OR REPLACE FUNCTION register_payment(
  p_customer_id UUID,
  p_amount DECIMAL,
  p_payment_method TEXT,
  p_description TEXT,
  p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO customer_account_transactions (
    customer_id,
    type,
    amount,
    description,
    payment_method,
    created_by
  ) VALUES (
    p_customer_id,
    'payment',
    -1 * ABS(p_amount), -- Siempre negativo para pagos
    p_description,
    p_payment_method,
    p_admin_id
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON TABLE customer_account_transactions IS 'Registro de compras y pagos de clientes en cuenta corriente';
COMMENT ON COLUMN customer_account_transactions.amount IS 'Positivo para ventas (deuda), negativo para pagos (abono)';
