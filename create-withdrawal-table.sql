-- Crear tabla para solicitudes de arrepentimiento
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  purchase_date DATE NOT NULL,
  product_details TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_order ON withdrawal_requests(order_number);
CREATE INDEX IF NOT EXISTS idx_withdrawal_email ON withdrawal_requests(email);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_created ON withdrawal_requests(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios anónimos pueden crear solicitudes
CREATE POLICY "Anyone can insert withdrawal requests"
  ON withdrawal_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política: Solo admins pueden ver todas las solicitudes
-- Por ahora permitir SELECT autenticado (ajustar cuando tengas tabla de admins)
CREATE POLICY "Authenticated users can view withdrawal requests"
  ON withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Solo admins pueden actualizar solicitudes
-- Por ahora permitir UPDATE autenticado (ajustar cuando tengas tabla de admins)
CREATE POLICY "Authenticated users can update withdrawal requests"
  ON withdrawal_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_withdrawal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_withdrawal_timestamp ON withdrawal_requests;
CREATE TRIGGER trigger_update_withdrawal_timestamp
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawal_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE withdrawal_requests IS 'Solicitudes de arrepentimiento según Ley 24.240 Art. 34';
COMMENT ON COLUMN withdrawal_requests.status IS 'pending: En revisión | approved: Aprobada | rejected: Rechazada | completed: Reembolso realizado';
