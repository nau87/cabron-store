'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: '📦 Productos', exact: true },
    { href: '/admin/orders', label: '📋 Pedidos' },
    { href: '/admin/pos', label: '🏪 Punto de Venta' },
    { href: '/admin/ventas', label: '📊 Ventas' },
    { href: '/admin/inventory', label: '📦 Inventario' },
    { href: '/admin/cuentas-corrientes', label: '💰 Cuentas Corrientes' },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Título */}
          <div className="flex-shrink-0">
            <Link 
              href="/"
              className="text-xl font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Cabrón Store
            </Link>
          </div>

          {/* Navegación Desktop */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive(item.href, item.exact)
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Navegación Mobile */}
          <div className="md:hidden flex-1 ml-4">
            <select
              value={pathname}
              onChange={(e) => window.location.href = e.target.value}
              className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm"
            >
              {navItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}
