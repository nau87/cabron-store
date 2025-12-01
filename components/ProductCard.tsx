'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = () => {
    setIsAdding(true);
    const cart = localStorage.getItem('cart');
    const currentCart = cart ? JSON.parse(cart) : [];
    
    const existingItemIndex = currentCart.findIndex(
      (item: any) => item.product.id === product.id
    );
    
    if (existingItemIndex > -1) {
      currentCart[existingItemIndex].quantity += 1;
    } else {
      currentCart.push({ product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(currentCart));
    
    // Trigger storage event for header update
    window.dispatchEvent(new Event('storage'));
    
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
          <span className="text-xl font-black">
            ${product.price.toLocaleString('es-AR')}
          </span>
          
          <button
            onClick={addToCart}
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
        </div>
        
        <p className="text-xs text-zinc-500 mt-2">
          {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
        </p>
      </div>
    </div>
  );
}
