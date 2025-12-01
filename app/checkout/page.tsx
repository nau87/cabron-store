'use client';

import { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

// Inicializar Mercado Pago
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY);
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showPaymentBrick, setShowPaymentBrick] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: user?.email || '',
    customer_phone: '',
    shipping_address: ''
  });

  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      setCartItems(JSON.parse(cart));
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, customer_email: user.email! }));
    }
  }, [user]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const createPreference = async () => {
    try {
      const items = cartItems.map(item => ({
        id: item.product.id,
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const response = await fetch('/api/mercadopago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: cartTotal,
          items,
          payer: {
            first_name: formData.customer_name.split(' ')[0],
            last_name: formData.customer_name.split(' ').slice(1).join(' ') || formData.customer_name.split(' ')[0],
            email: formData.customer_email,
            phone: {
              number: formData.customer_phone,
            },
          },
          metadata: {
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            shipping_address: formData.shipping_address,
            user_id: user?.id || null,
          },
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Guardar orden pendiente en Supabase
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      await supabase
        .from('orders')
        .insert([
          {
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            shipping_address: formData.shipping_address,
            total: cartTotal,
            status: 'pending',
            items: orderItems,
            user_id: user?.id || null,
          }
        ]);

      // Mostrar el Payment Brick
      setShowPaymentBrick(true);

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPayment = async (formData: any) => {
    try {
      const response = await fetch('/api/mercadopago/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: cartTotal,
          description: `Compra en Cabrón Store - ${cartItems.length} producto(s)`,
          payer: {
            email: formData.payer.email,
            first_name: formData.payer.first_name || formData.customer_name.split(' ')[0],
            last_name: formData.payer.last_name || formData.customer_name.split(' ').slice(1).join(' '),
          },
          metadata: {
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            shipping_address: formData.shipping_address,
            user_id: user?.id || null,
          },
        }),
      });

      const result = await response.json();

      if (result.status === 'approved') {
        // Limpiar carrito
        localStorage.removeItem('cart');
        setOrderPlaced(true);
      } else if (result.status === 'in_process' || result.status === 'pending') {
        alert('Tu pago está siendo procesado. Te notificaremos cuando se apruebe.');
        localStorage.removeItem('cart');
        setOrderPlaced(true);
      } else {
        alert('Hubo un problema con el pago. Por favor intenta de nuevo.');
      }

      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago');
      throw error;
    }
  };

  const onErrorPayment = (error: any) => {
    console.error('Payment error:', error);
    alert('Error en el pago. Por favor intenta de nuevo.');
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            ¡Pedido Realizado!
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Gracias por tu compra. Recibirás un correo con los detalles de tu pedido.
          </p>
          <Link
            href="/"
            className="inline-block bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            Tu carrito está vacío
          </h1>
          <Link
            href="/"
            className="text-zinc-600 dark:text-zinc-400 hover:underline"
          >
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-8">
          Finalizar Compra
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
              Resumen del Pedido
            </h2>
            
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 space-y-4">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-4 border-b pb-4">
                  <div className="relative w-20 h-20 bg-zinc-100 dark:bg-zinc-700 rounded">
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {item.product.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Cantidad: {item.quantity}
                    </p>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-zinc-900 dark:text-white">Total:</span>
                  <span className="text-zinc-900 dark:text-white">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">
              Información de Envío
            </h2>
            
            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="customer_email"
                  required
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  required
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="+54 11 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Dirección de Envío *
                </label>
                <textarea
                  name="shipping_address"
                  required
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="Calle, número, piso, depto, localidad, provincia, CP"
                />
              </div>

              {!showPaymentBrick ? (
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
                    loading
                      ? 'bg-zinc-400 cursor-not-allowed'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200'
                  }`}
                >
                  {loading ? 'Procesando...' : 'Continuar al Pago'}
                </button>
              ) : (
                <div className="mt-4">
                  <p className="text-zinc-900 dark:text-white font-semibold text-center mb-4">
                    Completa tu pago
                  </p>
                  <Payment
                    initialization={{
                      amount: cartTotal,
                      payer: {
                        email: formData.customer_email,
                        firstName: formData.customer_name.split(' ')[0],
                        lastName: formData.customer_name.split(' ').slice(1).join(' ') || formData.customer_name.split(' ')[0],
                      },
                    }}
                    customization={{
                      paymentMethods: {
                        creditCard: 'all',
                        debitCard: 'all',
                        ticket: 'all',
                        bankTransfer: 'all',
                        atm: 'all',
                        mercadoPago: 'all',
                        prepaidCard: 'all',
                      },
                      visual: {
                        style: {
                          theme: 'default',
                        },
                      },
                    }}
                    onSubmit={onSubmitPayment}
                    onError={onErrorPayment}
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
