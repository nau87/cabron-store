'use client';

import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import Hero from '@/components/Hero';
import { useState, useEffect } from 'react';

async function getProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .gt('stock', 0) // Solo productos con stock mayor a 0
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products as Product[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data);
      setFilteredProducts(data);
    });
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <Hero />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pb-20 pt-16">
        {/* Buscador */}
        <div className="mb-16">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full px-6 py-4 border-2 border-black font-medium text-lg uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-black"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
                🔍
              </span>
            </div>
            {searchTerm && (
              <p className="mt-4 text-center text-sm text-zinc-600 uppercase tracking-wider">
                {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Grid de Productos */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-lg uppercase tracking-wider">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6">
            ¡SUSCRIBITE!
          </h2>
          <p className="text-lg font-light mb-8 uppercase tracking-wide">
            Recibí nuestras novedades y descuentos exclusivos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-16">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-6 py-4 bg-white text-black font-medium uppercase text-sm tracking-wider focus:outline-none"
            />
            <button className="px-10 py-4 bg-white text-black font-black uppercase tracking-wider hover:bg-zinc-200 transition-colors">
              ENVIAR
            </button>
          </div>

          {/* Contacto */}
          <div className="border-t border-zinc-700 pt-12">
            <h3 className="text-2xl font-bold uppercase tracking-wider mb-8">
              CONTACTO
            </h3>
            <div className="grid md:grid-cols-3 gap-8 text-left md:text-center">
              <div>
                <p className="text-zinc-400 uppercase text-xs font-semibold mb-2">Instagram</p>
                <a 
                  href="https://instagram.com/cabron_indumentaria" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-zinc-300 transition-colors font-medium"
                >
                  @cabron_indumentaria
                </a>
              </div>
              <div>
                <p className="text-zinc-400 uppercase text-xs font-semibold mb-2">WhatsApp</p>
                <a 
                  href="https://wa.me/542302311826" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-zinc-300 transition-colors font-medium"
                >
                  +54 9 2302 31-1826
                </a>
              </div>
              <div>
                <p className="text-zinc-400 uppercase text-xs font-semibold mb-2">Dirección</p>
                <p className="text-white font-medium">
                  9 de Julio 761<br />
                  Trenel, La Pampa
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
