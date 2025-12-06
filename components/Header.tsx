'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

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
    toast.success('PRODUCTO ELIMINADO DEL CARRITO');
  };

  const updateQuantity = (productId: string, selectedSize: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cartItems.map(item => {
      if (item.product.id === productId && item.selectedSize === selectedSize) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    if (confirm('¿Estás seguro que deseas vaciar el carrito?')) {
      setCartItems([]);
      localStorage.removeItem('cart');
      toast.success('CARRITO VACIADO');
    }
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
                    <>
                      <Link
                        href="/favoritos"
                        className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
                      >
                        ❤️ FAVORITOS
                      </Link>
                      <Link
                        href="/mi-cuenta"
                        className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        MI CUENTA
                      </Link>
                    </>
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
              
              {!isAdmin && (
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
              )}
            </nav>

            {/* Mobile: Cart and Menu Button */}
            <div className="lg:hidden flex items-center gap-3 flex-shrink-0">
              {!isAdmin && (
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
              )}
              
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
                    <>
                      <Link
                        href="/favoritos"
                        className="block text-sm font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        ❤️ FAVORITOS
                      </Link>
                      <Link
                        href="/mi-cuenta"
                        className="block text-sm font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        MI CUENTA
                      </Link>
                    </>
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
          <div className="absolute right-4 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-lg shadow-2xl z-50 border border-zinc-200">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-wider">Mi Carrito</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-zinc-500 hover:text-black"
              >
                ✕
              </button>
            </div>
            
            {cartItems.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart size={48} className="mx-auto mb-4 text-zinc-300" />
                <p className="text-zinc-500 uppercase tracking-wide mb-4">Tu carrito está vacío</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold uppercase"
                >
                  Seguir comprando
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto p-4">
                  {cartItems.map((item, index) => (
                    <div key={`${item.product.id}-${item.selectedSize || 'no-size'}-${index}`} className="flex gap-3 border-b pb-4">
                      {/* Imagen del producto */}
                      <div className="relative w-20 h-20 flex-shrink-0 bg-zinc-100 rounded overflow-hidden">
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Info del producto */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm uppercase tracking-wide truncate">
                          {item.product.name}
                        </h4>
                        {item.selectedSize && (
                          <p className="text-xs text-zinc-600 mt-1">
                            Talle: <span className="font-semibold">{item.selectedSize}</span>
                          </p>
                        )}
                        <p className="text-sm font-black mt-1">
                          ${item.product.price.toLocaleString('es-AR')}
                        </p>
                        
                        {/* Controles de cantidad */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                            className="w-6 h-6 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-100"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Botón eliminar */}
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                        className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Footer del carrito */}
                <div className="p-4 border-t border-zinc-200 space-y-3">
                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider">Total:</span>
                    <span className="font-black text-xl">${cartTotal.toLocaleString('es-AR')}</span>
                  </div>
                  
                  {/* Botones */}
                  <div className="space-y-2">
                    <Link
                      href="/checkout"
                      className="block w-full bg-black text-white text-center py-3 rounded-lg hover:bg-zinc-800 transition-colors font-bold uppercase tracking-wider"
                      onClick={() => setIsCartOpen(false)}
                    >
                      Ir a Pagar
                    </Link>
                    
                    <button
                      onClick={clearCart}
                      className="w-full border-2 border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 transition-colors font-semibold uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Vaciar Carrito
                    </button>
                  </div>
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
