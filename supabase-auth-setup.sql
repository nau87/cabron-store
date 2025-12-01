-- PASO 1: Configurar roles de usuario
-- Crear tabla de perfiles de usuario con rol
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PASO 2: Actualizar tabla de productos para indumentaria
-- Eliminar productos anteriores y actualizar estructura
DELETE FROM products;

-- Agregar columnas para indumentaria
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;

-- Insertar productos de indumentaria masculina
INSERT INTO products (name, description, price, image_url, stock, category, size, color, material) VALUES
  ('Remera Básica Negra', 'Remera 100% algodón, corte regular, ideal para uso diario', 25.99, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 50, 'Remeras', 'M', 'Negro', '100% Algodón'),
  ('Jean Slim Fit', 'Jean azul clásico, corte slim, tela elástica para mayor comodidad', 69.99, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 30, 'Pantalones', '32', 'Azul', 'Denim'),
  ('Buzo con Capucha', 'Buzo oversized con capucha, 80% algodón 20% poliéster', 49.99, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400', 40, 'Buzos', 'L', 'Gris', 'Algodón/Poliéster'),
  ('Camisa Oxford', 'Camisa formal de corte slim, perfecta para ocasiones especiales', 45.99, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400', 25, 'Camisas', 'M', 'Blanco', 'Algodón'),
  ('Zapatillas Urbanas', 'Zapatillas deportivas con suela de goma, diseño moderno', 89.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 20, 'Calzado', '42', 'Blanco', 'Cuero sintético'),
  ('Short Deportivo', 'Short liviano para entrenamiento, con tecnología dry-fit', 29.99, 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400', 35, 'Shorts', 'M', 'Negro', 'Poliéster'),
  ('Remera Estampada', 'Remera con estampado moderno, 100% algodón premium', 32.99, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400', 45, 'Remeras', 'L', 'Blanco', '100% Algodón'),
  ('Pantalón Cargo', 'Pantalón cargo con múltiples bolsillos, estilo urbano', 59.99, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400', 28, 'Pantalones', '32', 'Verde', 'Gabardina');

-- PASO 3: Crear tabla para historial de inventario
CREATE TABLE inventory_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admins pueden ver historial de inventario"
  ON inventory_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- PASO 4: Actualizar políticas de productos para admins
DROP POLICY IF EXISTS "Permitir lectura pública de productos" ON products;

CREATE POLICY "Todos pueden ver productos"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Solo admins pueden insertar productos"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden actualizar productos"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Solo admins pueden eliminar productos"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- PASO 5: Actualizar tabla de órdenes para usuarios registrados y guest
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Permitir inserción de pedidos" ON orders;

CREATE POLICY "Cualquiera puede crear una orden"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Los usuarios pueden ver sus propias órdenes"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- PASO 6: Crear tu usuario admin
-- IMPORTANTE: Reemplaza 'tu-email@ejemplo.com' con tu email real
-- Después de ejecutar este script, regístrate en la app con ese email
-- y luego ejecuta esto para hacerte admin:

-- UPDATE user_profiles 
-- SET role = 'admin' 
-- WHERE email = 'tu-email@ejemplo.com';

-- O si ya tienes un usuario registrado, usa esto:
-- UPDATE user_profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com');
