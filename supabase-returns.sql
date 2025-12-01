-- Agregar columna change_type a inventory_history si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_history' AND column_name = 'change_type'
  ) THEN
    ALTER TABLE inventory_history ADD COLUMN change_type TEXT NOT NULL DEFAULT 'manual_adjustment';
  END IF;
END $$;

-- Agregar índices si no existen
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);

-- Comentario sobre los tipos de cambio
COMMENT ON COLUMN inventory_history.change_type IS 'Tipos: sale (venta online), local_sale (venta POS), manual_adjustment (ajuste manual), return (devolución)';
