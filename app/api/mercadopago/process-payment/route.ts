import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received payment request:', JSON.stringify(body, null, 2));

    // Extraer datos del formData o del body directamente
    const token = body.formData?.token || body.token;
    const transaction_amount = body.transaction_amount || body.formData?.transaction_amount;
    const installments = body.formData?.installments || body.installments;
    const payment_method_id = body.formData?.payment_method_id || body.payment_method_id;
    const issuer_id = body.formData?.issuer_id || body.issuer_id;
    const payer = body.payer || body.formData?.payer;
    const description = body.description;
    const metadata = body.metadata;
    const orderItems = body.orderItems; // Nuevo: recibir items del carrito

    // Validar campos requeridos
    if (!token || !transaction_amount || !payment_method_id || !payer?.email) {
      console.error('Missing required fields:', { 
        token: !!token, 
        transaction_amount, 
        payment_method_id, 
        payer_email: payer?.email 
      });
      return NextResponse.json(
        { error: 'Faltan campos requeridos para procesar el pago' },
        { status: 400 }
      );
    }

    // Procesar el pago en Mercado Pago
    const paymentData: any = {
      token,
      transaction_amount: Number(transaction_amount),
      installments: Number(installments) || 1,
      payment_method_id,
      payer: {
        email: payer.email,
        first_name: payer.first_name || '',
        last_name: payer.last_name || '',
      },
      description: description || 'Compra en Cabrón Store',
      statement_descriptor: 'CABRON STORE',
      metadata: metadata || {},
      external_reference: `order_${Date.now()}`,
    };

    // Agregar issuer_id si existe
    if (issuer_id) {
      paymentData.issuer_id = issuer_id;
    }

    // Agregar identification si existe
    if (payer.identification) {
      paymentData.payer.identification = {
        type: payer.identification.type,
        number: payer.identification.number,
      };
    }

    console.log('Sending to Mercado Pago:', JSON.stringify(paymentData, null, 2));

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    console.log('Mercado Pago response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      return NextResponse.json(
        { error: data.message || 'Error al procesar el pago', details: data },
        { status: response.status }
      );
    }

    // Si el pago fue aprobado, crear la orden y actualizar el stock
    if (data.status === 'approved' && orderItems && metadata) {
      try {
        // Crear la dirección completa
        const fullAddress = `${metadata.shipping_address}, ${metadata.city}, ${metadata.province}, CP: ${metadata.postal_code}`;

        // Generar número de pedido
        const { data: saleNumberData } = await supabase.rpc('generate_sale_number', { p_sale_type: 'online' });
        const saleNumber = saleNumberData || `ORDER-${data.id}`;

        // Crear la orden en Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('sales')
          .insert([
            {
              sale_type: 'online',
              sale_number: saleNumber,
              customer_name: metadata.customer_name,
              customer_email: payer.email,
              customer_phone: metadata.customer_phone,
              shipping_address: fullAddress,
              city: metadata.city,
              province: metadata.province,
              postal_code: metadata.postal_code,
              total: transaction_amount,
              status: 'approved',
              items: orderItems,
              user_id: metadata.user_id || null,
              payment_id: data.id,
              payment_method: 'mercadopago',
              discount_amount: metadata.discount_amount || 0,
              coupon_code: metadata.coupon_code || null,
            }
          ])
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
        } else {
          console.log('Order created:', orderData);
          
          // Incrementar uso del cupón si se aplicó
          if (metadata.coupon_code) {
            await supabase.rpc('increment_coupon_usage', {
              coupon_code: metadata.coupon_code
            });
          }

          // Actualizar el stock de cada producto
          for (const item of orderItems) {
            if (item.variant_id) {
              const { data, error: stockError } = await supabase.rpc('decrement_variant_stock', {
                p_variant_id: item.variant_id,
                p_quantity: item.quantity
              });

              if (stockError) {
                console.error(`Error updating stock for variant ${item.variant_id}:`, stockError);
              } else {
                const result = data?.[0];
                if (!result?.success) {
                  console.error(`Stock decrement failed: ${result?.error_message}`);
                } else {
                  console.log(`Stock updated for variant ${item.variant_id}: ${result.new_stock}`);
                }
              }
            }
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // No fallar el pago si hay error en DB, pero loguearlo
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in process-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
