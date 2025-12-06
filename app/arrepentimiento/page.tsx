'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ArrepentimientoPage() {
  const [formData, setFormData] = useState({
    order_number: '',
    customer_name: '',
    email: '',
    phone: '',
    purchase_date: '',
    product_details: '',
    reason: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (!formData.order_number || !formData.customer_name || !formData.email || !formData.purchase_date) {
      setError('Por favor completá todos los campos obligatorios');
      setLoading(false);
      return;
    }

    try {
      // Guardar en tabla withdrawal_requests (deberías crear esta tabla en Supabase)
      const { error: insertError } = await supabase.from('withdrawal_requests').insert([
        {
          order_number: formData.order_number,
          customer_name: formData.customer_name,
          email: formData.email,
          phone: formData.phone,
          purchase_date: formData.purchase_date,
          product_details: formData.product_details,
          reason: formData.reason,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({
        order_number: '',
        customer_name: '',
        email: '',
        phone: '',
        purchase_date: '',
        product_details: '',
        reason: '',
      });
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      setError('Hubo un error al enviar tu solicitud. Por favor contactanos directamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-black uppercase tracking-wider mb-4">
            Botón de Arrepentimiento
          </h1>
          
          <div className="prose prose-lg max-w-none mb-8">
            <div className="bg-blue-50 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-bold uppercase mb-4 mt-0">¿Qué es el derecho de arrepentimiento?</h2>
              <p className="mb-2">
                Según la <strong>Ley 24.240 de Defensa del Consumidor (Art. 34)</strong>, tenés derecho a
                <strong> arrepentirte de tu compra en un plazo de 10 días corridos</strong> desde la recepción del producto,
                sin necesidad de justificar tu decisión.
              </p>
              <p className="text-sm text-zinc-700 mb-0">
                ⚠️ El producto debe estar en perfectas condiciones, sin uso, con embalaje original y etiquetas.
              </p>
            </div>

            <section className="mb-8">
              <h3 className="text-xl font-bold uppercase mb-3">Condiciones para ejercer este derecho:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>✅ El producto debe estar <strong>sin uso</strong> y en su embalaje original</li>
                <li>✅ Incluir todas las etiquetas, accesorios y documentación</li>
                <li>✅ Presentar la factura o comprobante de compra</li>
                <li>✅ Solicitar dentro de los <strong>10 días corridos</strong> desde la recepción</li>
                <li>✅ El costo del envío de devolución corre por cuenta del comprador</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-bold uppercase mb-3">¿Cómo proceder?</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Completá el formulario a continuación con los datos de tu compra</li>
                <li>Recibirás un email con instrucciones para la devolución</li>
                <li>Envianos el producto en perfectas condiciones</li>
                <li>Una vez recibido y verificado, te reembolsaremos el 100% del monto pagado</li>
              </ol>
            </section>

            <section className="mb-8 bg-yellow-50 p-4 rounded-lg">
              <p className="mb-2 font-semibold">⏱️ Plazo de reembolso:</p>
              <p className="mb-0">
                El reintegro se realizará en un plazo máximo de <strong>15 días hábiles</strong> desde
                la recepción y verificación del producto.
              </p>
            </section>
          </div>

          {success ? (
            <div className="bg-green-50 p-8 rounded-lg text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold uppercase mb-4">¡Solicitud Enviada!</h2>
              <p className="text-lg mb-4">
                Tu solicitud de arrepentimiento fue recibida exitosamente.
                Recibirás un email con las instrucciones de devolución en las próximas 24 horas.
              </p>
              <p className="text-sm text-zinc-700 mb-6">
                Número de seguimiento enviado a <strong>{formData.email}</strong>
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="bg-black text-white px-8 py-3 rounded-lg font-bold uppercase hover:bg-zinc-800"
              >
                Enviar Otra Solicitud
              </button>
            </div>
          ) : (
            <div className="bg-zinc-50 p-8 rounded-lg">
              <h2 className="text-2xl font-bold uppercase mb-6">Formulario de Arrepentimiento</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold uppercase mb-2">
                      Número de Pedido *
                    </label>
                    <input
                      type="text"
                      name="order_number"
                      value={formData.order_number}
                      onChange={handleChange}
                      placeholder="Ej: MP-12345"
                      required
                      className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none"
                    />
                    <p className="text-xs text-zinc-600 mt-1">Lo encontrás en el email de confirmación</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      placeholder="Juan Pérez"
                      required
                      className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+54 11 1234-5678"
                      className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase mb-2">
                      Fecha de Compra *
                    </label>
                    <input
                      type="date"
                      name="purchase_date"
                      value={formData.purchase_date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase mb-2">
                      Producto(s)
                    </label>
                    <input
                      type="text"
                      name="product_details"
                      value={formData.product_details}
                      onChange={handleChange}
                      placeholder="Remera negra talle M"
                      className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase mb-2">
                    Motivo (Opcional)
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Contanos por qué querés devolver el producto..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-zinc-300 rounded-lg focus:border-black focus:outline-none resize-none"
                  />
                  <p className="text-xs text-zinc-600 mt-1">
                    No es obligatorio justificar tu decisión, pero nos ayuda a mejorar
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-800 p-4 rounded-lg">
                    ⚠️ {error}
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg text-sm">
                  <p className="mb-2">
                    ✓ Al enviar este formulario, declaro que:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-zinc-700">
                    <li>El producto está en perfectas condiciones y sin uso</li>
                    <li>Incluyo embalaje original, etiquetas y accesorios</li>
                    <li>Estoy dentro del plazo de 10 días corridos</li>
                    <li>Asumo el costo del envío de devolución</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-4 rounded-lg font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar Solicitud de Arrepentimiento'}
                </button>
              </form>
            </div>
          )}

          <div className="mt-8 p-6 bg-zinc-100 rounded-lg">
            <h3 className="text-lg font-bold uppercase mb-3">¿Preferís contactarnos directamente?</h3>
            <p className="mb-4">
              También podés enviarnos tu solicitud por email o WhatsApp:
            </p>
            <ul className="space-y-2">
              <li>📧 Email: <strong>devoluciones@cabronstore.com</strong></li>
              <li>📱 WhatsApp: <strong>+54 11 1234-5678</strong></li>
            </ul>
          </div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/terminos"
              className="text-black font-bold uppercase underline hover:text-zinc-700"
            >
              Ver Términos y Condiciones
            </Link>
            <Link
              href="/privacidad"
              className="text-black font-bold uppercase underline hover:text-zinc-700"
            >
              Ver Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
