-- Recrear función validate_coupon con SECURITY DEFINER
-- Esto permite que la función acceda a la tabla coupons sin restricciones RLS

DROP FUNCTION IF EXISTS validate_coupon(TEXT, DECIMAL);

CREATE OR REPLACE FUNCTION validate_coupon(coupon_code TEXT, purchase_amount DECIMAL)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  discount_type TEXT,
  discount_value DECIMAL,
  final_discount DECIMAL
) 
SECURITY DEFINER -- CLAVE: Ejecuta con permisos del dueño de la función, no del usuario
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  coupon_record RECORD;
  calculated_discount DECIMAL;
BEGIN
  -- Buscar cupón (ignora RLS por SECURITY DEFINER)
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
  
  -- Retornar resultado exitoso
  RETURN QUERY SELECT 
    true, 
    'Cupón válido'::TEXT, 
    coupon_record.discount_type, 
    coupon_record.discount_value, 
    calculated_discount;
END;
$$;

-- Verificar que la función existe
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proargnames as argument_names
FROM pg_proc 
WHERE proname = 'validate_coupon';
