import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, transaction_amount, installments, payment_method_id, payer, description, metadata } = body;

    // Procesar el pago en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `${Date.now()}-${Math.random()}`,
      },
      body: JSON.stringify({
        token,
        transaction_amount,
        installments,
        payment_method_id,
        payer,
        description: description || 'Compra en Cabrón Store',
        statement_descriptor: 'CABRON STORE',
        metadata: metadata || {},
        external_reference: `order_${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      throw new Error(data.message || 'Error processing payment');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in process-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
