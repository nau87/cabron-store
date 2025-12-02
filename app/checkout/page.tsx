'use client';

import { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
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
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'transferencia'>('mercadopago');
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: user?.email || '',
    customer_phone: '',
    city: '',
    province: '',
    postal_code: '',
    shipping_address: ''
  });

  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      setCartItems(JSON.parse(cart));
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          // Cargar datos del perfil del usuario
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('full_name, email, phone')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && profile) {
            setFormData(prev => ({
              ...prev,
              customer_name: profile.full_name || '',
              customer_email: profile.email || user.email || '',
              customer_phone: profile.phone || user.user_metadata?.phone || '',
            }));
          } else {
            // Si no hay perfil, usar datos del usuario de auth
            setFormData(prev => ({
              ...prev,
              customer_email: user.email || '',
              customer_phone: user.user_metadata?.phone || '',
            }));
          }
        } catch (error: any) {
          // Silently ignore permission errors
          if (error?.code !== '42501' && error?.code !== 'PGRST116') {
            console.error('Error loading profile:', error);
          }
          // Fallback a datos básicos del usuario
          setFormData(prev => ({
            ...prev,
            customer_email: user.email || '',
            customer_phone: user.user_metadata?.phone || '',
          }));
        }
      }
    };

    loadUserData();
  }, [user]);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  // Aplicar descuento del 30% si es transferencia
  const finalTotal = paymentMethod === 'transferencia' ? cartTotal * 0.7 : cartTotal;
  const discount = paymentMethod === 'transferencia' ? cartTotal * 0.3 : 0;

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
            city: formData.city,
            province: formData.province,
            postal_code: formData.postal_code,
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
      if (paymentMethod === 'transferencia') {
        // Crear pedido directamente con estado "Pendiente de pago"
        await createTransferOrder();
      } else {
        // Mostrar el Payment Brick de MercadoPago
        setShowPaymentBrick(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const createTransferOrder = async () => {
    try {
      // Preparar los items del pedido
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        size: item.selectedSize
      }));

      const { data: order, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            shipping_address: formData.shipping_address,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postal_code,
            items: orderItems,
            total: finalTotal,
            status: 'pending_payment',
            payment_id: 'TRANSFER_PENDING',
            payment_method: 'transferencia',
            discount_amount: discount,
            user_id: user?.id || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Decrementar el stock de cada producto usando variantId
      for (const item of cartItems) {
        if (item.variantId) {
          const { error: stockError } = await supabase.rpc('decrement_variant_stock', {
            variant_id: item.variantId,
            quantity_to_decrement: item.quantity
          });

          if (stockError) {
            console.error(`Error actualizando stock para variante ${item.variantId}:`, stockError);
          }
        }
      }

      // Limpiar carrito y mostrar confirmación
      localStorage.removeItem('cart');
      setOrderPlaced(true);
    } catch (error) {
      console.error('Error creating transfer order:', error);
      throw error;
    }
  };

  const onSubmitPayment = async (paymentFormData: any) => {
    try {
      // Asegurar que los datos del payer existen
      const payerEmail = paymentFormData?.payer?.email || formData.customer_email || user?.email || '';
      const payerFirstName = paymentFormData?.payer?.first_name || formData.customer_name.split(' ')[0] || '';
      const payerLastName = paymentFormData?.payer?.last_name || formData.customer_name.split(' ').slice(1).join(' ') || '';

      // Preparar los items del carrito
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        size: item.selectedSize
      }));

      const response = await fetch('/api/mercadopago/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentFormData,
          transaction_amount: cartTotal,
          description: `Compra en Cabrón Store - ${cartItems.length} producto(s)`,
          payer: {
            email: payerEmail,
            first_name: payerFirstName,
            last_name: payerLastName,
          },
          orderItems, // Enviar los items al backend
          metadata: {
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            shipping_address: formData.shipping_address,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postal_code,
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
          {paymentMethod === 'transferencia' ? (
            <>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                Tu pedido ha sido registrado con éxito.
              </p>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-green-800 dark:text-green-200 font-semibold mb-2">
                  📱 Nos comunicaremos contigo por WhatsApp
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Te enviaremos los datos bancarios para que puedas realizar la transferencia y coordinar el envío.
                </p>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Número de pedido: Consulta tu correo para más detalles
              </p>
            </>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Gracias por tu compra. Recibirás un correo con los detalles de tu pedido.
            </p>
          )}
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
    <>
      <Header />
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
                    {item.selectedSize && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Talle: {item.selectedSize}
                      </p>
                    )}
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
                {paymentMethod === 'transferencia' && (
                  <>
                    <div className="flex justify-between items-center text-lg mb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">Subtotal:</span>
                      <span className="text-zinc-900 dark:text-white">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg mb-2 text-green-600">
                      <span>Descuento 30% (Transferencia):</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-zinc-900 dark:text-white">Total:</span>
                  <span className="text-zinc-900 dark:text-white">
                    ${finalTotal.toFixed(2)}
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
              {/* Método de Pago */}
              <div className="border-b pb-4 mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  Método de Pago *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mercadopago"
                      checked={paymentMethod === 'mercadopago'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'mercadopago' | 'transferencia')}
                      className="w-4 h-4 text-zinc-900"
                    />
                    <div className="ml-3 flex-1">
                      <span className="text-zinc-900 dark:text-white font-medium">MercadoPago</span>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Tarjetas de crédito/débito</p>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors border-green-500">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="transferencia"
                      checked={paymentMethod === 'transferencia'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'mercadopago' | 'transferencia')}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="ml-3 flex-1">
                      <span className="text-zinc-900 dark:text-white font-medium">Transferencia Bancaria</span>
                      <p className="text-sm text-green-600 font-semibold">¡30% de descuento!</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                        Te contactaremos por WhatsApp para coordinar el pago
                      </p>
                    </div>
                  </label>
                </div>
              </div>

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

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                    placeholder="Buenos Aires"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    name="province"
                    required
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                    placeholder="Buenos Aires"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Código Postal *
                </label>
                <input
                  type="text"
                  name="postal_code"
                  required
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Dirección de Envío *
                </label>
                <input
                  type="text"
                  name="shipping_address"
                  required
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                  placeholder="Calle, número, piso, depto"
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
    </>
  );
}
