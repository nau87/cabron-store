import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook notification received:', JSON.stringify(body, null, 2));

    // Mercado Pago envía notificaciones con diferentes tipos
    // Nos interesan las notificaciones de tipo "payment"
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id;

      if (!paymentId) {
        console.error('Payment ID not found in webhook');
        return NextResponse.json({ error: 'Payment ID not found' }, { status: 400 });
      }

      // Obtener los detalles del pago desde Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      const paymentData = await paymentResponse.json();
      console.log('Payment data from Mercado Pago:', JSON.stringify(paymentData, null, 2));

      // Si el pago fue aprobado, actualizar la orden
      if (paymentData.status === 'approved') {
        // Buscar la orden por payment_id
        const { data: orders, error: findError } = await supabase
          .from('sales')
          .select('*')
          .eq('sale_type', 'online')
          .eq('payment_id', paymentId);

        if (findError) {
          console.error('Error finding order:', findError);
          return NextResponse.json({ error: 'Error finding order' }, { status: 500 });
        }

        if (orders && orders.length > 0) {
          // Actualizar el status de la orden
          const { error: updateError } = await supabase
            .from('sales')
            .update({ status: 'approved' })
            .eq('sale_type', 'online')
            .eq('payment_id', paymentId);

          if (updateError) {
            console.error('Error updating order:', updateError);
            return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
          }

          console.log(`Order updated to approved for payment ${paymentId}`);
        } else {
          console.log(`No order found for payment ${paymentId} - might be already processed`);
        }
      }

      // Si el pago fue rechazado o cancelado
      if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
        const { error: updateError } = await supabase
          .from('sales')
          .update({ status: 'cancelled' })
          .eq('sale_type', 'online')
          .eq('payment_id', paymentId);

        if (updateError) {
          console.error('Error updating order to cancelled:', updateError);
        } else {
          console.log(`Order cancelled for payment ${paymentId}`);
        }
      }
    }

    // Siempre responder 200 para que Mercado Pago no reintente
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in webhook:', error);
    // Aún así responder 200 para evitar reintentos innecesarios
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
