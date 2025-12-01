'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';

interface HeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ searchTerm, onSearchChange }: HeaderProps = {}) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsMobileMenuOpen(false);
      await signOut();
      // Limpiar localStorage
      localStorage.removeItem('cart');
      // Forzar recarga completa
      window.location.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  useEffect(() => {
    const cart = localStorage.getItem('cart');
    if (cart) {
      setCartItems(JSON.parse(cart));
    }
  }, []);

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const removeFromCart = (productId: string, selectedSize?: string) => {
    const updatedCart = cartItems.filter(item => !(item.product.id === productId && item.selectedSize === selectedSize));
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  return (
    <>
      <header className="bg-white sticky top-0 z-50 border-b border-zinc-200">
        {/* Barra de Promociones con animación de marquesina */}
        <div className="bg-black text-white text-center py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <p className="text-xs font-semibold uppercase tracking-wider inline-block px-8">
              30% OFF TRANSFERENCIA | ENVÍO GRATIS +$150.000 | 12 CUOTAS SIN INTERÉS
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider inline-block px-8">
              30% OFF TRANSFERENCIA | ENVÍO GRATIS +$150.000 | 12 CUOTAS SIN INTERÉS
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider inline-block px-8">
              30% OFF TRANSFERENCIA | ENVÍO GRATIS +$150.000 | 12 CUOTAS SIN INTERÉS
            </p>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-3">
          <div className="flex justify-between items-center gap-4">
            <Link href="/" className="relative h-10 w-32 sm:h-12 sm:w-44 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Cabrón IND"
                fill
                className="object-contain object-left"
                priority
              />
            </Link>
            
            {/* Buscador - visible solo si se pasan las props */}
            {onSearchChange && (
              <div className="flex-1 max-w-md lg:max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full px-4 py-2 border-2 border-zinc-300 rounded-lg text-sm font-medium uppercase tracking-wide focus:outline-none focus:border-black transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-50">
                    🔍
                  </span>
                </div>
              </div>
            )}
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8 flex-shrink-0">
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
                  {!isAdmin && (
                    <Link
                      href="/mi-cuenta"
                      className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      MI CUENTA
                    </Link>
                  )}
                  <span className="text-xs uppercase tracking-wider text-zinc-600">
                    {profile?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="text-xs font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {isSigningOut ? 'Saliendo...' : 'SALIR'}
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

            {/* Mobile: Cart and Menu Button */}
            <div className="lg:hidden flex items-center gap-3 flex-shrink-0">
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
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-2xl"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-4">
              <Link 
                href="/" 
                className="block text-sm font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SHOP
              </Link>

              {isAdmin && (
                <>
                  <Link 
                    href="/admin" 
                    className="block text-sm font-semibold uppercase tracking-wider text-orange-600 hover:text-orange-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    PRODUCTOS
                  </Link>
                  <Link 
                    href="/admin/orders" 
                    className="block text-sm font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    PEDIDOS
                  </Link>
                  <Link 
                    href="/admin/inventory" 
                    className="block text-sm font-semibold uppercase tracking-wider text-purple-600 hover:text-purple-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    INVENTARIO
                  </Link>
                  <Link 
                    href="/admin/cuentas-corrientes" 
                    className="block text-sm font-semibold uppercase tracking-wider text-yellow-600 hover:text-yellow-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    CTAS CTE
                  </Link>
                  <Link 
                    href="/admin/pos" 
                    className="block text-sm font-semibold uppercase tracking-wider text-green-600 hover:text-green-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    POS
                  </Link>
                </>
              )}

              {user ? (
                <div className="space-y-4 border-t pt-4">
                  {!isAdmin && (
                    <Link
                      href="/mi-cuenta"
                      className="block text-sm font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      MI CUENTA
                    </Link>
                  )}
                  <p className="text-xs uppercase tracking-wider text-zinc-600">
                    {profile?.full_name || user.email}
                  </p>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="block text-sm font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {isSigningOut ? 'Saliendo...' : 'SALIR'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block text-sm font-semibold uppercase tracking-wider hover:text-zinc-600 transition-colors"
                >
                  INGRESAR
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cart Dropdown */}
        {isCartOpen && (
          <div className="absolute right-4 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-md bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-4 z-50">
            <h3 className="text-lg font-semibold mb-4">Carrito de Compras</h3>
            
            {cartItems.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-400">Tu carrito está vacío</p>
            ) : (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {cartItems.map((item, index) => (
                    <div key={`${item.product.id}-${item.selectedSize || 'no-size'}-${index}`} className="flex justify-between items-center border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        {item.selectedSize && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            Talle: {item.selectedSize}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500">
                          ${item.product.price} x {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
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
