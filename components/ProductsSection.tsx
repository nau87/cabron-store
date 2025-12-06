'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types';

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

export default function ProductsSection() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    loadProducts();
  }, []);

  // Leer categoría de la URL al montar
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && CATEGORIES.includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado combinado: categoría + búsqueda
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    // Actualizar URL
    const url = new URL(window.location.href);
    if (category === 'Todas') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', category);
    }
    window.history.pushState({}, '', url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <>
      {/* Buscador */}
      <div className="mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full px-6 py-4 border-2 border-zinc-300 rounded-lg text-base font-medium uppercase tracking-wide focus:outline-none focus:border-black transition-colors"
        />
      </div>

      {/* Filtros de categoría */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-4 py-2 rounded-full font-semibold text-sm uppercase tracking-wide transition-all ${
              selectedCategory === category
                ? 'bg-black text-white'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-zinc-600">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
        {selectedCategory !== 'Todas' && ` en ${selectedCategory}`}
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-zinc-500 uppercase tracking-wide">
            No se encontraron productos
          </p>
        </div>
      )}
    </>
  );
}
