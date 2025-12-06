'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('❌ Email inválido');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email.toLowerCase().trim() }]);

      if (error) {
        if (error.code === '23505') {
          toast('📧 Ya estás suscrito', { icon: 'ℹ️' });
        } else {
          throw error;
        }
      } else {
        toast.success('✅ ¡Suscripción exitosa!');
        setEmail('');
      }
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast.error('❌ Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-black text-white py-20">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
          ¡SUSCRIBITE!
        </h2>
        <p className="text-lg font-light mb-8 uppercase tracking-wide">
          Recibí nuestras novedades y descuentos exclusivos
        </p>
        <form 
          onSubmit={handleSubscribe}
          className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Tu email"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-white text-black font-medium uppercase text-sm tracking-wider focus:outline-none disabled:opacity-50"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ENVIANDO...' : 'ENVIAR'}
          </button>
        </form>
      </div>
    </section>
  );
}
