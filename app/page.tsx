'use client';

import Hero from '@/components/Hero';
import Header from '@/components/Header';
import Newsletter from '@/components/Newsletter';
import ProductsSection from '@/components/ProductsSection';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        }>
          <ProductsSection />
        </Suspense>

        {/* Newsletter */}
        <Newsletter />
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Columna 1: Información */}
            <div>
              <h3 className="font-black text-xl uppercase tracking-wider mb-4">CABRÓN STORE</h3>
              <p className="text-sm text-zinc-400 uppercase tracking-wide">
                Ropa urbana de calidad
              </p>
            </div>

            {/* Columna 2: Enlaces */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">INFORMACIÓN</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors uppercase tracking-wide">Sobre nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors uppercase tracking-wide">Envíos</a></li>
                <li><a href="#" className="hover:text-white transition-colors uppercase tracking-wide">Cambios y devoluciones</a></li>
                <li><a href="/terminos" className="hover:text-white transition-colors uppercase tracking-wide">Términos y Condiciones</a></li>
                <li><a href="/privacidad" className="hover:text-white transition-colors uppercase tracking-wide">Política de Privacidad</a></li>
                <li><a href="/arrepentimiento" className="hover:text-white transition-colors uppercase tracking-wide">Botón de Arrepentimiento</a></li>
              </ul>
            </div>

            {/* Columna 3: Contacto */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">CONTACTO</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="uppercase tracking-wide">📧 hola@cabronstore.com</li>
                <li className="uppercase tracking-wide">📱 +54 11 1234-5678</li>
                <li className="uppercase tracking-wide">📍 Buenos Aires, Argentina</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wide">
              © {new Date().getFullYear()} Cabrón Store. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
