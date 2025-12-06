'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAdmin } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAdding, setIsAdding] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Cargar variantes del producto
  useEffect(() => {
    loadVariants();
  }, [product.id]);

  const loadVariants = async () => {
    setLoadingVariants(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, size, stock')
        .eq('product_id', product.id)
        .gt('stock', 0); // Solo variantes con stock

      if (!error && data) {
        setVariants(data);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const hasSizes = variants.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setShowSizeModal(true);
      return;
    }
    addToCart(selectedSize, selectedVariantId);
  };

  const addToCart = (size?: string, variantId?: string) => {
    setIsAdding(true);
    const cart = localStorage.getItem('cart');
    const currentCart = cart ? JSON.parse(cart) : [];
    
    const existingItemIndex = currentCart.findIndex(
      (item: any) => item.product.id === product.id && item.selectedSize === size
    );
    
    if (existingItemIndex > -1) {
      currentCart[existingItemIndex].quantity += 1;
    } else {
      currentCart.push({ 
        product, 
        quantity: 1, 
        selectedSize: size,
        variantId: variantId 
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    
    // Trigger storage event for header update
    window.dispatchEvent(new Event('storage'));
    
    setShowSizeModal(false);
    setSelectedSize('');
    setSelectedVariantId('');
    
    setTimeout(() => {
      setIsAdding(false);
      window.location.reload(); // Force refresh to update cart count
    }, 500);
  };

  return (
    <div className="group">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-[4/5] bg-zinc-50 overflow-hidden mb-4">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Botón de favoritos */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className="absolute top-3 right-3 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
            aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart
              size={20}
              className={`transition-all duration-300 ${
                isFavorite(product.id)
                  ? 'fill-red-500 text-red-500'
                  : 'text-zinc-700 hover:text-red-500'
              }`}
            />
          </button>
          
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <span className="text-white font-bold text-lg uppercase tracking-wider">AGOTADO</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="space-y-2">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-sm uppercase tracking-wide hover:text-zinc-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-zinc-400 line-through">
                ${product.original_price.toLocaleString('es-AR')}
              </span>
            )}
            <span className="text-xl font-black">
              ${product.price.toLocaleString('es-AR')}
            </span>
          </div>
          
          {!isAdmin && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              className={`px-4 py-2 border-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                product.stock === 0
                  ? 'border-zinc-300 text-zinc-400 cursor-not-allowed'
                  : isAdding
                  ? 'border-black bg-black text-white'
                  : 'border-black text-black hover:bg-black hover:text-white'
              }`}
            >
              {product.stock === 0 ? 'Agotado' : isAdding ? '✓ Agregado' : 'Agregar'}
            </button>
          )}
        </div>
        
        <p className="text-xs text-zinc-500 mt-2">
          {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
        </p>
      </div>

      {/* Modal de selección de talle */}
      {showSizeModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            setShowSizeModal(false);
            setSelectedSize('');
            setSelectedVariantId('');
          }}
        >
          <div 
            className="bg-white dark:bg-zinc-800 rounded-lg max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              Seleccionar Talle
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {product.name}
            </p>
            
            {loadingVariants ? (
              <p className="text-center text-zinc-500 py-4">Cargando talles...</p>
            ) : variants.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">No hay talles disponibles</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => {
                      setSelectedSize(variant.size);
                      setSelectedVariantId(variant.id);
                    }}
                    className={`py-3 border-2 font-bold text-sm uppercase tracking-wider transition-all ${
                      selectedSize === variant.size
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-300 text-zinc-700 hover:border-black'
                    }`}
                  >
                    {variant.size}
                    <span className="block text-xs font-normal mt-1">
                      ({variant.stock} disp.)
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedSize('');
                  setSelectedVariantId('');
                }}
                className="flex-1 py-3 border-2 border-zinc-300 text-zinc-700 font-bold text-sm uppercase tracking-wider hover:bg-zinc-100 transition-all"
              >
                Cancelar
              </button>
              {!isAdmin && (
                <button
                  onClick={() => addToCart(selectedSize, selectedVariantId)}
                  disabled={!selectedSize}
                  className={`flex-1 py-3 border-2 font-bold text-sm uppercase tracking-wider transition-all ${
                    selectedSize
                      ? 'border-black bg-black text-white hover:bg-zinc-800'
                      : 'border-zinc-300 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  Agregar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
