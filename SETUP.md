# Cabrón Store - E-commerce con Next.js y Supabase

Una tienda online completa construida con Next.js 15, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

- ✅ Catálogo de productos con búsqueda
- ✅ Carrito de compras con LocalStorage
- ✅ Páginas de detalle de producto
- ✅ Sistema de checkout completo
- ✅ Gestión de pedidos con Supabase
- ✅ Diseño responsive y modo oscuro
- ✅ TypeScript para type safety

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Cuenta en [Supabase](https://supabase.com)

## 🛠️ Configuración

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. En el SQL Editor, ejecuta el siguiente script para crear las tablas:

```sql
-- Crear tabla de productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pedidos
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar productos de ejemplo
INSERT INTO products (name, description, price, image_url, stock, category) VALUES
  ('Laptop Pro', 'Laptop de alto rendimiento para profesionales', 1299.99, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', 10, 'Electrónica'),
  ('Mouse Inalámbrico', 'Mouse ergonómico con conexión Bluetooth', 29.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 50, 'Accesorios'),
  ('Teclado Mecánico', 'Teclado mecánico RGB para gaming', 89.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 30, 'Accesorios'),
  ('Monitor 4K', 'Monitor 27 pulgadas resolución 4K', 449.99, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', 15, 'Electrónica'),
  ('Auriculares Bluetooth', 'Auriculares con cancelación de ruido', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 25, 'Audio'),
  ('Webcam HD', 'Cámara web 1080p para videollamadas', 79.99, 'https://images.unsplash.com/photo-1589739900243-493e26ce1e77?w=400', 20, 'Electrónica');

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura pública de productos
CREATE POLICY "Permitir lectura pública de productos"
  ON products FOR SELECT
  USING (true);

-- Políticas para permitir inserción de pedidos
CREATE POLICY "Permitir inserción de pedidos"
  ON orders FOR INSERT
  WITH CHECK (true);
```

### 2. Configurar Variables de Entorno

1. Copia tu URL y API Key de Supabase:
   - Ve a Settings > API en tu proyecto de Supabase
   - Copia la "Project URL" y la "anon public" key

2. Edita el archivo `.env.local` y reemplaza los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
```

### 3. Instalar Dependencias y Ejecutar

```bash
# Instalar dependencias (ya hecho si instalaste el proyecto)
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
cabron-store/
├── app/
│   ├── checkout/          # Página de checkout
│   ├── products/[id]/     # Página de detalle de producto
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal (catálogo)
├── components/
│   ├── Header.tsx         # Encabezado con carrito
│   └── ProductCard.tsx    # Tarjeta de producto
├── lib/
│   └── supabase.ts        # Cliente de Supabase
├── types/
│   └── index.ts           # Tipos TypeScript
└── .env.local             # Variables de entorno
```

## 🎨 Tecnologías Utilizadas

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Estilos
- **Supabase** - Base de datos y backend
- **LocalStorage** - Carrito de compras del lado del cliente

## 🔥 Funcionalidades Principales

### Catálogo de Productos
- Visualización de productos en grid responsive
- Información de stock en tiempo real
- Botón de agregar al carrito

### Carrito de Compras
- Almacenamiento en LocalStorage
- Contador de items en el header
- Resumen con totales
- Eliminar productos

### Checkout
- Formulario de datos del cliente
- Resumen del pedido
- Validación de campos
- Confirmación de pedido

### Base de Datos
- Productos con stock y categorías
- Registro de pedidos completos
- Row Level Security habilitado

## 🚀 Despliegue

Para desplegar en Vercel:

1. Sube tu código a GitHub
2. Importa el proyecto en [Vercel](https://vercel.com)
3. Agrega las variables de entorno en la configuración del proyecto
4. Despliega

## 📝 Próximos Pasos

- [ ] Panel de administración para gestionar productos
- [ ] Autenticación de usuarios
- [ ] Historial de pedidos por usuario
- [ ] Integración con pasarelas de pago (Stripe, PayPal)
- [ ] Sistema de búsqueda y filtros
- [ ] Wishlist / Lista de deseos
- [ ] Reseñas y calificaciones de productos

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras algún problema o tienes sugerencias, por favor abre un issue.

---

Hecho con ❤️ por Cabrón Store
