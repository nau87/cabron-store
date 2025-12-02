-- Hacer que las columnas legacy sean opcionales para evitar conflictos

-- Cambiar change_amount a nullable
ALTER TABLE inventory_history ALTER COLUMN change_amount DROP NOT NULL;

-- Cambiar previous_stock a nullable  
ALTER TABLE inventory_history ALTER COLUMN previous_stock DROP NOT NULL;

-- Cambiar new_stock a nullable
ALTER TABLE inventory_history ALTER COLUMN new_stock DROP NOT NULL;

-- Ahora el sistema puede usar las columnas nuevas (quantity_change, stock_after, change_type)
-- o las viejas (change_amount, previous_stock, new_stock) sin problemas
