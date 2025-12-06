'use client';

import { useEffect, useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { Heart, Loader2 } from 'lucide-react';

export default function FavoritosPage() {
  const { favorites, loading: loadingFavorites } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteProducts();
  }, [favorites]);

  const loadFavoriteProducts = async () => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', favorites)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading favorite products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || loadingFavorites) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={32} className="fill-red-500 text-red-500" />
        <h1 className="text-4xl font-black uppercase tracking-wider">
          MIS FAVORITOS
        </h1>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={64} className="mx-auto mb-4 text-zinc-300" />
          <p className="text-xl text-zinc-500 uppercase tracking-wide">
            NO TENÉS PRODUCTOS FAVORITOS
          </p>
          <p className="text-sm text-zinc-400 mt-2">
            Hacé clic en el corazón de cualquier producto para guardarlo aquí
          </p>
          <a
            href="/"
            className="inline-block mt-8 bg-black text-white px-8 py-3 uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors"
          >
            Ver productos
          </a>
        </div>
      ) : (
        <>
          <p className="text-zinc-600 mb-8">
            Tenés {products.length} {products.length === 1 ? 'producto' : 'productos'} en favoritos
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
