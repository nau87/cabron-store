import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente con privilegios de service_role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    console.log('Cancelando pedido:', orderId);

    // Primero obtener el pedido para saber qué productos restaurar
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Actualizar el estado a cancelled
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('Pedido actualizado a cancelled');

    // Restaurar el stock de cada producto
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        console.log(`Restaurando stock para producto ${item.product_id}, cantidad: ${item.quantity}`);
        
        const { error: stockError } = await supabaseAdmin.rpc('increment_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        });

        if (stockError) {
          console.error(`Error restoring stock for product ${item.product_id}:`, stockError);
          // No fallar todo si un producto tiene error, continuar con los demás
        } else {
          console.log(`Stock restaurado para producto ${item.product_id}`);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido cancelado y stock restaurado exitosamente' 
    });

  } catch (error: any) {
    console.error('Error in cancel-order API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
