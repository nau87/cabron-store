-- Sistema de Variantes de Producto (Talles, Colores, etc.)

-- 1. Crear tabla de variantes
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  size TEXT,
  color TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock);

-- 3. Habilitar RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS permisivas
CREATE POLICY "Allow all operations on product_variants"
  ON product_variants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Función para obtener stock total de un producto (suma de todas las variantes)
CREATE OR REPLACE FUNCTION get_product_total_stock(p_product_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(stock) FROM product_variants WHERE product_id = p_product_id),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Función para decrementar stock de una variante específica
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Obtener stock actual
  SELECT stock INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id;

  -- Verificar si hay suficiente stock
  IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Decrementar stock
  UPDATE product_variants
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para incrementar stock de una variante
CREATE OR REPLACE FUNCTION increment_variant_stock(
  p_variant_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE product_variants
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar stock total del producto cuando cambia una variante
CREATE OR REPLACE FUNCTION update_product_stock_on_variant_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el stock del producto principal con la suma de todas las variantes
  UPDATE products
  SET stock = (
    SELECT COALESCE(SUM(stock), 0)
    FROM product_variants
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
  )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock ON product_variants;
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_variant_change();

-- 9. Vista para facilitar consultas de productos con variantes
CREATE OR REPLACE VIEW products_with_variants AS
SELECT 
  p.id as product_id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.category,
  p.stock as total_stock,
  pv.id as variant_id,
  pv.sku,
  pv.size,
  pv.color,
  pv.stock as variant_stock
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id;

-- 10. Migrar productos existentes a variantes (EJECUTAR SOLO UNA VEZ)
-- Este script toma productos que tienen size o sku y los convierte en variantes
DO $$
DECLARE
  prod RECORD;
  variant_id UUID;
BEGIN
  -- Solo migrar productos que tengan size (son variantes)
  FOR prod IN 
    SELECT id, name, stock, sku, size, color 
    FROM products 
    WHERE size IS NOT NULL OR sku IS NOT NULL
  LOOP
    -- Verificar si ya existe una variante para este producto
    SELECT id INTO variant_id
    FROM product_variants
    WHERE product_id = prod.id;

    -- Si no existe, crear la variante
    IF variant_id IS NULL THEN
      INSERT INTO product_variants (product_id, sku, size, color, stock)
      VALUES (prod.id, prod.sku, prod.size, prod.color, prod.stock);
      
      RAISE NOTICE 'Migrated product % to variant', prod.name;
    END IF;
  END LOOP;
END $$;

-- 11. Comentarios para documentación
COMMENT ON TABLE product_variants IS 'Variantes de productos (talles, colores) con stock individual';
COMMENT ON COLUMN product_variants.product_id IS 'ID del producto principal';
COMMENT ON COLUMN product_variants.sku IS 'SKU único de la variante (ej: REM-001-XL)';
COMMENT ON COLUMN product_variants.size IS 'Talle de la variante (S, M, L, XL, etc)';
COMMENT ON COLUMN product_variants.color IS 'Color de la variante';
COMMENT ON COLUMN product_variants.stock IS 'Stock disponible de esta variante específica';
