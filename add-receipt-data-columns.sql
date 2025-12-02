-- Agregar columnas para almacenar datos de comprobantes en formato JSON
-- Esto permite regenerar comprobantes sin depender de que los productos aún existan

-- 1. Agregar columna receipt_data a local_sales
ALTER TABLE local_sales ADD COLUMN IF NOT EXISTS receipt_data JSONB;

-- 2. Agregar columna receipt_data a customer_account_transactions
ALTER TABLE customer_account_transactions ADD COLUMN IF NOT EXISTS receipt_data JSONB;

-- 3. Comentarios
COMMENT ON COLUMN local_sales.receipt_data IS 'Datos del comprobante en JSON: sale_number, customer_name, items[], total, payment_method, date';
COMMENT ON COLUMN customer_account_transactions.receipt_data IS 'Datos del comprobante en JSON para pagos: customer_name, amount, payment_method, description, date';

-- 4. Índices para búsquedas rápidas (opcional)
CREATE INDEX IF NOT EXISTS idx_local_sales_receipt_data ON local_sales USING GIN (receipt_data);
CREATE INDEX IF NOT EXISTS idx_customer_transactions_receipt_data ON customer_account_transactions USING GIN (receipt_data);
