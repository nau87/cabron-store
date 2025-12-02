'use client';

import { Product } from '@/types';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AddToCartButtonProps {
  product: Product & { variants?: any[] };
}

interface Variant {
  id: string;
  size: string;
  stock: number;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Cargar variantes cuando se abre el modal
  useEffect(() => {
    if (showSizeModal && (!product.variants || product.variants.length === 0)) {
      loadVariants();
    } else if (product.variants && product.variants.length > 0) {
      setVariants(product.variants);
    }
  }, [showSizeModal, product.variants]);

  const loadVariants = async () => {
    setLoadingVariants(true);
    try {
      const { data } = await supabase
        .from('product_variants')
        .select('id, size, stock')
        .eq('product_id', product.id)
        .gt('stock', 0)
        .order('size');
      
      setVariants(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  const hasSizes = variants.length > 0 || (product.variants && product.variants.length > 0);

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setShowSizeModal(true);
      return;
    }
    addToCart(selectedSize);
  };

  const addToCart = (size?: string) => {
    setIsAdding(true);
    
    // Si hay talle, buscar la variante correspondiente
    let variantId = null;
    if (size) {
      const variant = variants.find(v => v.size === size);
      if (!variant) {
        alert('Talle no disponible');
        setIsAdding(false);
        return;
      }
      variantId = variant.id;
    }
    
    const cart = localStorage.getItem('cart');
    const currentCart = cart ? JSON.parse(cart) : [];
    
    const existingItemIndex = currentCart.findIndex(
      (item: any) => item.product.id === product.id && 
                     item.selectedSize === size &&
                     item.variantId === variantId
    );
    
    if (existingItemIndex > -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({ 
        product, 
        quantity, 
        selectedSize: size,
        variantId: variantId 
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('storage'));
    
    setShowSizeModal(false);
    setSelectedSize('');
    
    setTimeout(() => {
      setIsAdding(false);
      window.location.href = '/';
    }, 800);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-6">
          <label className="text-sm font-bold uppercase tracking-wider text-zinc-700">
            Cantidad:
          </label>
          <div className="flex items-center border-2 border-black">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-5 py-3 font-bold hover:bg-black hover:text-white transition-all"
            >
              -
            </button>
            <span className="px-8 py-3 font-black text-lg">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
              className="px-5 py-3 font-bold hover:bg-black hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdding}
          className={`w-full py-5 font-black text-base uppercase tracking-wider transition-all duration-300 border-2 ${
            product.stock === 0
              ? 'border-zinc-300 text-zinc-400 cursor-not-allowed'
              : isAdding
              ? 'border-black bg-black text-white'
              : 'border-black text-black hover:bg-black hover:text-white'
          }`}
        >
          {product.stock === 0 ? 'AGOTADO' : isAdding ? '✓ AGREGADO' : 'AGREGAR AL CARRITO'}
        </button>
      </div>

      {/* Modal de selección de talle */}
      {showSizeModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            setShowSizeModal(false);
            setSelectedSize('');
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
              <div className="text-center py-8 text-zinc-600">
                Cargando talles...
              </div>
            ) : variants.length === 0 ? (
              <div className="text-center py-8 text-red-600">
                No hay talles disponibles
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedSize(variant.size)}
                    className={`py-3 border-2 font-bold text-sm uppercase tracking-wider transition-all ${
                      selectedSize === variant.size
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-300 text-zinc-700 hover:border-black'
                    }`}
                  >
                    <div>{variant.size}</div>
                    <div className="text-xs text-zinc-500">
                      {variant.stock} disp.
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSizeModal(false);
                  setSelectedSize('');
                }}
                className="flex-1 py-3 border-2 border-zinc-300 text-zinc-700 font-bold text-sm uppercase tracking-wider hover:bg-zinc-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => addToCart(selectedSize)}
                disabled={!selectedSize}
                className={`flex-1 py-3 border-2 font-bold text-sm uppercase tracking-wider transition-all ${
                  selectedSize
                    ? 'border-black bg-black text-white hover:bg-zinc-800'
                    : 'border-zinc-300 text-zinc-400 cursor-not-allowed'
                }`}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
