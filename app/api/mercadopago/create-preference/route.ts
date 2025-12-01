import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, payer, back_urls, metadata } = body;

    // Crear preferencia en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items,
        payer,
        back_urls,
        auto_return: 'approved',
        metadata,
        statement_descriptor: 'CABRON STORE',
        external_reference: `order_${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error creating preference');
    }

    return NextResponse.json({ preferenceId: data.id });
  } catch (error: any) {
    console.error('Error in create-preference:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
