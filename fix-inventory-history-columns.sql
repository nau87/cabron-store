-- Actualizar estructura de inventory_history para que coincida con el código

-- Agregar nueva columna change_type si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_history' AND column_name = 'change_type'
    ) THEN
        ALTER TABLE inventory_history ADD COLUMN change_type TEXT NOT NULL DEFAULT 'manual_adjustment';
    END IF;
END $$;

-- Agregar nueva columna quantity_change si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_history' AND column_name = 'quantity_change'
    ) THEN
        ALTER TABLE inventory_history ADD COLUMN quantity_change INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Agregar nueva columna stock_after si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_history' AND column_name = 'stock_after'
    ) THEN
        ALTER TABLE inventory_history ADD COLUMN stock_after INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Agregar nueva columna reason si no existe (puede que ya esté)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_history' AND column_name = 'reason'
    ) THEN
        ALTER TABLE inventory_history ADD COLUMN reason TEXT;
    END IF;
END $$;

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_history_change_type ON inventory_history(change_type);

-- Comentario para documentación
COMMENT ON COLUMN inventory_history.change_type IS 'Tipos: sale (venta online), local_sale (venta POS), manual_adjustment (ajuste manual), return (devolución), order_cancelled (pedido cancelado)';
