# Instrucciones de Configuración - Cabrón Store

## ⚙️ Configuración de Supabase

### 1. Ejecutar funciones SQL

Entra al SQL Editor de Supabase (https://supabase.com/dashboard/project/qyajfhfusamfnlzhahyl/sql/new) y ejecuta los siguientes archivos:

#### A. Funciones para manejo de stock
Ejecuta el contenido de `supabase-decrement-stock.sql`:
```sql
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - quantity, 0)
  WHERE id = product_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, quantity INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET stock = stock + quantity
  WHERE id = product_id;
END;
$$;
```

#### B. Agregar columna payment_id
Ejecuta el contenido de `supabase-add-payment-id.sql`:
```sql
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
```

---

## 🔔 Configuración del Webhook de Mercado Pago

### 1. URL del Webhook
Una vez que el sitio esté en producción en Vercel, la URL del webhook será:
```
https://cabron-store1.vercel.app/api/mercadopago/webhook
```

### 2. Configurar en Mercado Pago
1. Entra a tu cuenta de Mercado Pago: https://www.mercadopago.com.ar/developers/panel
2. Ve a "Tus aplicaciones" > Tu aplicación
3. En el menú lateral, click en "Webhooks"
4. Agrega la URL: `https://cabron-store1.vercel.app/api/mercadopago/webhook`
5. Selecciona los eventos:
   - ✅ `payment.created`
   - ✅ `payment.updated`
6. Guarda los cambios

### 3. Eventos que escucha el webhook
El webhook procesará automáticamente:
- **Pago aprobado** → Actualiza orden a status 'approved'
- **Pago rechazado/cancelado** → Actualiza orden a status 'cancelled'

---

## 🎯 Flujo de Compra Actualizado

### Antes (con problemas)
1. Usuario hace checkout → ❌ Orden creada inmediatamente con status 'pending'
2. Usuario paga → ✅ Pago procesado
3. ❌ Stock NO se actualizaba
4. ❌ Orden quedaba como 'pending' para siempre

### Ahora (correcto) ✅
1. Usuario hace checkout → Solo muestra Payment Brick
2. Usuario paga → Pago procesado en Mercado Pago
3. **Backend crea la orden** con status 'approved' SOLO si el pago fue exitoso
4. **Backend decrementa el stock** automáticamente
5. Webhook de Mercado Pago actualiza el estado si hay cambios

---

## 📊 Panel de Administración

### Nuevas Funciones
- **Tab de Productos**: Gestión de inventario (igual que antes)
- **Tab de Pedidos**: Ver todos los pedidos con:
  - Información del cliente
  - Fecha y hora
  - Total del pedido
  - Estado (Aprobado/Pendiente/Cancelado)
  - Cantidad de items
  - **Botón "Cancelar"**: Cancela el pedido y restaura el stock automáticamente

### Estados de Pedidos
- 🟢 **Aprobado** (approved): Pago confirmado, stock descontado
- 🟡 **Pendiente** (pending): Pago en proceso
- 🔴 **Cancelado** (cancelled): Pedido cancelado, stock restaurado

---

## ✅ Checklist de Verificación

Después de hacer el deploy en Vercel:

- [ ] Ejecutar SQL en Supabase (decrement_stock, increment_stock)
- [ ] Ejecutar SQL en Supabase (agregar columna payment_id)
- [ ] Configurar webhook en Mercado Pago con la URL de producción
- [ ] Probar un pago de prueba y verificar:
  - [ ] Orden se crea en la base de datos
  - [ ] Stock se decrementa correctamente
  - [ ] Orden aparece en panel de admin
  - [ ] Botón de cancelar funciona y restaura stock

---

## 🚀 Deploy

Los cambios ya están en el repositorio de GitHub. Vercel detectará automáticamente el push y hará el deploy.

Para verificar el deploy:
1. Ve a https://vercel.com/nau87s-projects/cabron-store1
2. Espera a que termine el build
3. Visita https://cabron-store1.vercel.app/

---

## 📝 Notas Importantes

1. **NO borres los archivos SQL** (`supabase-decrement-stock.sql` y `supabase-add-payment-id.sql`), son referencia para el futuro.

2. **Webhook URL**: Si cambias el dominio en Vercel, recuerda actualizar la URL del webhook en Mercado Pago.

3. **Testing**: Usa las tarjetas de prueba de Mercado Pago para probar el flujo completo antes de recibir pagos reales.

4. **Logs**: Puedes ver los logs del webhook en Vercel (Runtime Logs) para debug.
