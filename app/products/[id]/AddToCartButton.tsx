'use client';

import { Product } from '@/types';
import { useState } from 'react';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = () => {
    setIsAdding(true);
    const cart = localStorage.getItem('cart');
    const currentCart = cart ? JSON.parse(cart) : [];
    
    const existingItemIndex = currentCart.findIndex(
      (item: any) => item.product.id === product.id
    );
    
    if (existingItemIndex > -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({ product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      setIsAdding(false);
      window.location.href = '/';
    }, 800);
  };

  return (
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
        onClick={addToCart}
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
  );
}
