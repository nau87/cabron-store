'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      setCartItems(JSON.parse(cart));
    }
  }, []);

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const removeFromCart = (productId: string) => {
    const updatedCart = cartItems.filter(item => item.product.id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-50 border-b border-zinc-200">
        {/* Barra de Promociones */}
        <div className="bg-black text-white text-center py-2">
          <p className="text-xs font-semibold uppercase tracking-wider">
            30% OFF TRANSFERENCIA | ENVÍO GRATIS +$150.000 | 12 CUOTAS SIN INTERÉS
          </p>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="relative h-14 w-56">
              <Image
                src="/logo.png"
                alt="Cabrón IND"
                fill
                className="object-contain object-left"
                priority
              />
            </Link>
            
            <nav className="flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors">
                SHOP
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    href="/admin" 
                    className="text-sm font-semibold uppercase tracking-wider text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    PRODUCTOS
                  </Link>
                  <Link 
                    href="/admin/orders" 
                    className="text-sm font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    PEDIDOS
                  </Link>
                  <Link 
                    href="/admin/inventory" 
                    className="text-sm font-semibold uppercase tracking-wider text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    INVENTARIO
                  </Link>
                  <Link 
                    href="/admin/cuentas-corrientes" 
                    className="text-sm font-semibold uppercase tracking-wider text-yellow-600 hover:text-yellow-700 transition-colors"
                  >
                    CTAS CTE
                  </Link>
                  <Link 
                    href="/admin/pos" 
                    className="text-sm font-semibold uppercase tracking-wider text-green-600 hover:text-green-700 transition-colors"
                  >
                    POS
                  </Link>
                </>
              )}

              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wider text-zinc-600">
                    {profile?.full_name || user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-xs font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors"
                  >
                    SALIR
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-sm font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors"
                >
                  INGRESAR
                </button>
              )}
              
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative"
              >
                <span className="text-2xl">🛒</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Cart Dropdown */}
        {isCartOpen && (
          <div className="absolute right-4 mt-2 w-80 bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-4 z-50">
            <h3 className="text-lg font-semibold mb-4">Carrito de Compras</h3>
            
            {cartItems.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400">Tu carrito está vacío</p>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-zinc-500">
                          ${item.product.price} x {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 text-sm ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <Link
                    href="/checkout"
                    className="block w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-center py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                    onClick={() => setIsCartOpen(false)}
                  >
                    Ir a Pagar
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
