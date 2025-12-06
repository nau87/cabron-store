-- ========================================
-- TABLA DE CUPONES DE DESCUENTO
-- ========================================

-- Crear tabla de cupones
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- RLS (Row Level Security)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquiera puede leer cupones activos y vigentes
DROP POLICY IF EXISTS "Cualquiera puede ver cupones activos" ON coupons;
CREATE POLICY "Cualquiera puede ver cupones activos"
  ON coupons FOR SELECT
  USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
  );

-- Policy: Solo admins pueden insertar cupones
DROP POLICY IF EXISTS "Solo admins pueden crear cupones" ON coupons;
CREATE POLICY "Solo admins pueden crear cupones"
  ON coupons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Solo admins pueden actualizar cupones
DROP POLICY IF EXISTS "Solo admins pueden actualizar cupones" ON coupons;
CREATE POLICY "Solo admins pueden actualizar cupones"
  ON coupons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Policy: Solo admins pueden eliminar cupones
DROP POLICY IF EXISTS "Solo admins pueden eliminar cupones" ON coupons;
CREATE POLICY "Solo admins pueden eliminar cupones"
  ON coupons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Función para validar cupón
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code TEXT, purchase_amount DECIMAL)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  final_discount DECIMAL
) AS $$
DECLARE
  coupon_record RECORD;
  calculated_discount DECIMAL;
BEGIN
  -- Buscar cupón
  SELECT * INTO coupon_record FROM coupons WHERE code = coupon_code;
  
  -- Verificar si existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cupón no válido', NULL::TEXT, NULL::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar si está activo
  IF NOT coupon_record.is_active THEN
    RETURN QUERY SELECT false, 'Cupón desactivado', NULL::TEXT, NULL::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar fecha de inicio
  IF coupon_record.valid_from IS NOT NULL AND coupon_record.valid_from > NOW() THEN
    RETURN QUERY SELECT false, 'Cupón aún no vigente', NULL::TEXT, NULL::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar fecha de vencimiento
  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < NOW() THEN
    RETURN QUERY SELECT false, 'Cupón vencido', NULL::TEXT, NULL::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar usos máximos
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
    RETURN QUERY SELECT false, 'Cupón agotado', NULL::TEXT, NULL::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Verificar monto mínimo de compra
  IF purchase_amount < coupon_record.min_purchase_amount THEN
    RETURN QUERY SELECT false, 
      'Compra mínima: $' || coupon_record.min_purchase_amount, 
      NULL::TEXT, NULL::DECIMAL, 0::DECIMAL;
    RETURN;
  END IF;
  
  -- Calcular descuento
  IF coupon_record.discount_type = 'percentage' THEN
    calculated_discount := purchase_amount * (coupon_record.discount_value / 100);
    -- Aplicar descuento máximo si existe
    IF coupon_record.max_discount_amount IS NOT NULL AND calculated_discount > coupon_record.max_discount_amount THEN
      calculated_discount := coupon_record.max_discount_amount;
    END IF;
  ELSE
    calculated_discount := coupon_record.discount_value;
  END IF;
  
  -- No puede ser mayor al monto de compra
  IF calculated_discount > purchase_amount THEN
    calculated_discount := purchase_amount;
  END IF;
  
  -- Retornar cupón válido
  RETURN QUERY SELECT 
    true, 
    'Cupón aplicado correctamente',
    coupon_record.discount_type,
    coupon_record.discount_value,
    calculated_discount;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar contador de usos
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons 
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql;

-- Verificación
SELECT 'Tabla coupons creada exitosamente' as status;
