'use client';

import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';
import Hero from '@/components/Hero';
import Header from '@/components/Header';
import Newsletter from '@/components/Newsletter';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const CATEGORIES = [
  'Todas',
  'Remeras',
  'Camisas',
  'Pantalones',
  'Buzos',
  'Camperas',
  'Shorts',
  'Calzado',
  'Accesorios'
];

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
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data);
      setFilteredProducts(data);
    });
    
    // Leer categoría de URL si existe
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    let filtered = products;

    // Filtrar por categoría
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Actualizar URL sin recargar página
    const url = new URL(window.location.href);
    if (category === 'Todas') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    window.history.pushState({}, '', url);
  };

  return (
    <>
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      <div className="min-h-screen bg-white">
        {/* Hero Banner */}
        <Hero />

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pb-20 pt-16">
          {/* Filtros por categoría */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3 justify-center">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-2 rounded-full font-semibold text-sm uppercase tracking-wider transition-all ${
                    selectedCategory === category
                      ? 'bg-black text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Contador de resultados */}
          {(searchTerm || selectedCategory !== 'Todas') && (
            <p className="mb-8 text-center text-sm text-zinc-600 uppercase tracking-wider">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} {searchTerm ? 'encontrado' : 'en'} {selectedCategory !== 'Todas' && selectedCategory}
            </p>
          )}

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

      {/* Newsletter Section */}
      <Newsletter />

      {/* Footer Contacto */}
      <section className="bg-black text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold uppercase tracking-wider mb-8 text-center">
            CONTACTO
          </h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
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
      </section>
      </div>
    </>
  );
}
