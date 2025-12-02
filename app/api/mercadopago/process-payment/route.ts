import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in process-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
